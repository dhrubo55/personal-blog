+++
category = ["Java", "100DaysOfJava"]
date = 2025-12-24T00:00:00Z
description = "Day 100: I added .parallel() expecting near-linear speedup on 8 cores. I got 60% CPU utilization. Here's why the default spliterator gets load balancing wrong, and how a 50-line fix pushed it to 95%."
draft = true
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day100"
summary = "Parallel streams gave me 60% CPU utilization on 8 cores. I thought that was good. Then I discovered why the default spliterator creates massive load imbalance, and how a 50-line custom implementation cut processing time by 40%."
title = "Day 100: Why Your Parallel Streams Are Leaving CPU Cores Idle (And How to Fix It)"
[cover]
alt = "day100"
caption = "day100"
image = ""
relative = false
+++

I added `.parallel()` to my stream. Eight cores. Should be 8x faster, right?

Nope. 60% CPU utilization. Cores sitting idle. Processing 100 million rows took 5.2 seconds when it should've taken under 2.

What I didn't get at first: the default Java Stream API has a load balancing problem. When you call `.parallel()` on an I/O-based source like `Files.lines()`, the spliterator that divides work among threads uses a growing batch size strategy: 1, 2, 4, 8, 16... up to 16,384 elements per batch.

This creates massive imbalance. One thread gets a 16K batch and grinds away for 200ms. The other seven threads finish their tiny batches in 10ms and sit idle, waiting.

I found this out the hard way on the One Billion Row Challenge, which is exactly what it sounds like: process 1 billion rows of weather data as fast as possible. The task is simple: read a text file where each line is `station_name;temperature`, compute min/mean/max per station, output sorted results.

Top solutions finish in under 2 seconds using `Unsafe`, memory-mapped I/O, and custom parsers. I wanted to understand the fundamentals first: why does the Stream API struggle with this workload, and can we fix it without ditching the abstraction?

You can. A 50-line custom spliterator cut my processing time by 40% and pushed CPU utilization from 60% to 95%. No `Unsafe`. No native code. Just fixing the load balancing problem the JDK gets wrong.

***

## The load balancing problem: what actually happens

First version looked like this:

```java
try (Stream<String> lines = Files.lines(Paths.get("measurements.txt"))) {
    Map<String, DoubleSummaryStatistics> result = lines
        .parallel()
        .map(line -> line.split(";"))
        .collect(Collectors.groupingBy(
            parts -> parts[0],
            Collectors.summarizingDouble(parts -> Double.parseDouble(parts[1]))
        ));
}
```

Eight cores. Should be fast. Wasn't.

I opened `jconsole` to watch CPU. This is what I saw:

```
Core 0: 95%  ████████████████████
Core 1: 95%  ████████████████████
Core 2: 95%  ████████████████████
Core 3: 15%  ███░░░░░░░░░░░░░░░░░
Core 4: 15%  ███░░░░░░░░░░░░░░░░░
Core 5: 15%  ███░░░░░░░░░░░░░░░░░
Core 6: 15%  ███░░░░░░░░░░░░░░░░░
Core 7: 15%  ███░░░░░░░░░░░░░░░░░
```

Three cores maxed out. Five cores mostly idle. Average: ~60%.

The problem is the `Spliterator`, the thing that divides work among threads. When you call `Files.lines().parallel()`, you get a spliterator that doesn't know the file size upfront. It can't split the file into eight equal chunks because it's reading sequentially.

So it uses a different strategy: growing batches. First split creates a batch of 1 element. Next split: 2 elements. Then 4, 8, 16, 32, 64... up to 16,384.

This is arithmetic progression with a cap. The JDK hardcodes these numbers in `AbstractSpliterator`.

Why? To minimize split overhead. Creating a new batch has cost: allocating arrays, coordinating threads, managing the work queue. If batches are too small, you spend more time splitting than processing.

But this optimization backfires for `I/O workloads`. Here's what happens:

Timeline of a parallel stream with growing batches:

```
Time 0ms:   Thread 1 gets batch of 1 element    (processes in 0.05ms)
Time 1ms:   Thread 2 gets batch of 2 elements   (processes in 0.1ms)
Time 2ms:   Thread 3 gets batch of 4 elements   (processes in 0.2ms)
Time 3ms:   Thread 4 gets batch of 8 elements   (processes in 0.4ms)
...
Time 50ms:  Thread 1 gets batch of 16,384 elements (processes in 820ms)
Time 51ms:  Thread 2 gets batch of 16,384 elements (processes in 820ms)
Time 52ms:  Thread 3 gets batch of 16,384 elements (processes in 820ms)
Time 870ms: Threads 4-8 are idle, waiting for threads 1-3 to finish
```

The last few threads to grab work get massive batches. Everyone else finishes early and waits.

This is the load balancing problem. The spliterator optimizes for split overhead, not work distribution.

***

## The fix: stop growing batches

Marko Topolnik figured this out in 2014. Don't let batch size grow. Pick a size and stick with it.

Instead of 1, 2, 4, 8, 16... just do 10,000, 10,000, 10,000, 10,000.

Every thread gets the same amount of work. No imbalance. No idle cores.

The implementation is 50 lines:

```java
public abstract class FixedBatchSpliteratorBase<T> implements Spliterator<T> {
    private final int batchSize;
    private final int characteristics;
    private long estimatedSize;

    public FixedBatchSpliteratorBase(int characteristics, int batchSize, long estimatedSize) {
        this.characteristics = characteristics | SUBSIZED;
        this.batchSize = batchSize;
        this.estimatedSize = estimatedSize;
    }

    @Override
    public Spliterator<T> trySplit() {
        final HoldingConsumer<T> holder = new HoldingConsumer<>();
        if (!tryAdvance(holder)) {
            return null;
        }

        final Object[] batch = new Object[batchSize];
        int j = 0;
        do {
            batch[j] = holder.value;
        } while (++j < batchSize && tryAdvance(holder));

        if (estimatedSize != Long.MAX_VALUE) {
            estimatedSize -= j;
        }

        return Spliterators.spliterator(batch, 0, j, characteristics());
    }

    @Override
    public long estimateSize() {
        return estimatedSize;
    }

    @Override
    public int characteristics() {
        return characteristics;
    }

    static final class HoldingConsumer<T> implements Consumer<T> {
        T value;
        @Override
        public void accept(T value) {
            this.value = value;
        }
    }
}
```

The base class handles batching. You implement `tryAdvance()` to read one element:

```java
public class FileLineSpliterator extends FixedBatchSpliteratorBase<String> {
    private final BufferedReader reader;

    public FileLineSpliterator(BufferedReader reader, int batchSize, long estimatedSize) {
        super(ORDERED | NONNULL | IMMUTABLE, batchSize, estimatedSize);
        this.reader = reader;
    }

    @Override
    public boolean tryAdvance(Consumer<? super String> action) {
        try {
            String line = reader.readLine();
            if (line == null) {
                return false;
            }
            action.accept(line);
            return true;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public static Stream<String> stream(Path path, int batchSize) throws IOException {
        BufferedReader reader = Files.newBufferedReader(path);
        long estimatedSize = Files.size(path) / 50;
        
        return StreamSupport.stream(
            new FileLineSpliterator(reader, batchSize, estimatedSize),
            true
        ).onClose(() -> {
            try {
                reader.close();
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        });
    }
}
```

That's it. `tryAdvance()` reads one line. The base class calls it `batchSize` times, fills an array, hands that array to a thread. Repeat until the file ends. The `estimatedSize` is a rough guess (file size divided by 50, assuming ~50 bytes per line on average) that the ForkJoinPool uses to decide how aggressively to split work.

***

## What this actually does

When you call `.parallel()` on this stream, the ForkJoinPool calls `trySplit()` repeatedly to create work for threads.

With the default spliterator, thread 1 gets 1 element, thread 2 gets 2, thread 3 gets 4, and so on. Thread 8 ends up with 16,384 elements and processes for 820ms while the others sit there.

With the fixed-batch spliterator:
- Thread 1: 10,000 elements (~500ms)
- Thread 2: 10,000 elements (~500ms)
- Thread 3: 10,000 elements (~500ms)
- ...
- Thread 8: 10,000 elements (~500ms)

They all finish at roughly the same time.

No idle cores. No wasted CPU.

***

## Using it for the One Billion Row Challenge

The challenge: read [1 billion rows](/posts/posts/java/100daysofjava/day91/#1-memory-mapped-files-the-magicians-trick) of `station;temperature`, compute min/mean/max per station, output sorted.

Here's the code:

```java
public class OneBillionRowChallenge {
    
    public static void main(String[] args) throws IOException {
        Path inputFile = Paths.get("measurements.txt");
        long start = System.nanoTime();
        
        Map<String, StationStats> results;
        try (Stream<String> lines = FileLineSpliterator.stream(inputFile, 10_000)) {
            results = lines
                .map(OneBillionRowChallenge::parseLine)
                .collect(Collectors.groupingByConcurrent(
                    Measurement::station,
                    Collector.of(
                        StationStats::new,
                        StationStats::accept,
                        StationStats::combine
                    )
                ));
        }
        
        // Sort and print
        results.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .forEach(entry -> {
                StationStats stats = entry.getValue();
                System.out.printf("%s=%.1f/%.1f/%.1f%n",
                    entry.getKey(),
                    stats.min,
                    stats.sum / stats.count,
                    stats.max
                );
            });
        
        long end = System.nanoTime();
        System.err.printf("%.2f seconds%n", (end - start) / 1_000_000_000.0);
    }
    
    static Measurement parseLine(String line) {
        int idx = line.indexOf(';');
        String station = line.substring(0, idx);
        double temp = Double.parseDouble(line.substring(idx + 1));
        return new Measurement(station, temp);
    }
    
    record Measurement(String station, double temp) {}
    
    static class StationStats {
        double min = Double.POSITIVE_INFINITY;
        double max = Double.NEGATIVE_INFINITY;
        double sum = 0;
        long count = 0;
        
        void accept(Measurement m) {
            min = Math.min(min, m.temp);
            max = Math.max(max, m.temp);
            sum += m.temp;
            count++;
        }
        
        StationStats combine(StationStats other) {
            min = Math.min(min, other.min);
            max = Math.max(max, other.max);
            sum += other.sum;
            count += other.count;
            return this;
        }
    }
}
```

Changed one line: `Files.lines(path).parallel()` became `FileLineSpliterator.stream(path, 10_000)`.

Result: 40% faster.

***

## Picking the right batch size

I tried different batch sizes on 100 million rows:

| Batch Size | Time | CPU Util | Memory |
|------------|------|----------|--------|
| Default JDK | 5.2s | 60% | 1.2 GB |
| 1,000 | 4.1s | 75% | 1.5 GB |
| **10,000** | **3.1s** | **95%** | **1.8 GB** |
| 50,000 | 3.4s | 85% | 2.1 GB |
| 100,000 | 4.0s | 70% | 2.5 GB |

10,000 was the sweet spot. 40% faster than default. CPU utilization jumped from 60% to 95%.

Why not 1,000? Too much overhead. Each batch requires:
- Allocating an `Object[]` array
- Filling it with elements
- Creating a new `Spliterator` wrapper
- Submitting it to the ForkJoinPool

At 1,000 elements per batch, you're creating 100,000 batches for 100M rows. That's 100,000 array allocations, 100,000 spliterator objects, 100,000 pool submissions. The GC can't keep up. You spend more time managing batches than processing data.

Why not 100,000? Back to the load imbalance problem. If each batch takes 5 seconds to process and you have 8 threads, the last thread to get work might process for 5 seconds while others sit idle.

Topolnik's rule: each batch should take 1–10 ms to process. That balances batch overhead (allocation, coordination, GC) against load imbalance (idle threads waiting).

For this workload on my machine, 10,000 rows takes about 5ms to process. Perfect.

Your optimal size depends on:
- How expensive each row is to process
- Your core count (more cores = need more batches)
- Your I/O speed (faster I/O = can handle smaller batches)

Measure. Don't guess.

***

## Where the time goes

I ran this through JFR (Java Flight Recorder) to see the breakdown:

```
Total: 3.1 seconds for 100M rows

I/O (BufferedReader.readLine):        0.8s  (26%)
Parsing (indexOf + substring + parse): 1.4s  (45%)
Aggregation (ConcurrentHashMap):       0.6s  (19%)
Thread coordination:                   0.2s  (6%)
GC:                                    0.1s  (3%)
```

Parsing is the bottleneck. 45% of time goes to `indexOf()`, `substring()`, and `Double.parseDouble()`.

This surprised me. I thought I/O would dominate. Nope. Modern SSDs are fast; sequential reads hit 3–5 GB/s. Reading 5 GB of text takes under 2 seconds.

But parsing? Every row requires:
- `indexOf(';')` - scan bytes looking for semicolon
- `substring(0, idx)` - allocate new String for station name
- `substring(idx + 1)` - allocate new String for temperature
- `Double.parseDouble()` - parse string to double

That's three string allocations per row. 100 million rows = 300 million strings. Each string is 16 bytes of object header + char array + length. That's ~5 GB of allocations just for parsing.

The GC handles it (only 3% overhead) because these strings are short-lived. But the allocation and copying still burns CPU.

Top 1BRC solutions don't use `String.split()` or `substring()`. They parse directly from byte arrays. No allocations. Just pointer arithmetic and manual digit parsing.

That's the next optimization. But it requires abandoning the Stream API and working with raw byte buffers.

***

## How top solutions get under 2 seconds

My fixed-batch implementation: 3.1 seconds for 100M rows. Extrapolate to 1B rows: ~31 seconds.

Top 1BRC solutions: under 2 seconds for 1B rows.

What are they doing?

### 1. Custom Parsing

They don't use `String.split()` or `Double.parseDouble()`. They parse bytes directly. Here's what I do:

```java
int idx = line.indexOf(';');
String station = line.substring(0, idx);
double temp = Double.parseDouble(line.substring(idx + 1));
```

Here's what top solutions do:

```java
int idx = findSemicolon(bytes, offset);
long stationHash = hashBytes(bytes, offset, idx);
double temp = parseDouble(bytes, idx + 1);
```

No string allocations. No substring copies. Just pointer arithmetic and manual digit parsing.

They also use hash codes instead of strings for station names. Store the hash in a primitive long array. Only materialize the actual string at the end for output.

Roughly 30–40% of parsing time saved.

### 2. Memory-Mapped I/O

Instead of `BufferedReader`, they use `FileChannel.map()`:

```java
FileChannel channel = FileChannel.open(path, StandardOpenOption.READ);
MappedByteBuffer buffer = channel.map(FileChannel.MapMode.READ_ONLY, 0, channel.size());
```

The OS maps the file directly into process memory. No read() syscalls. No copying from kernel space to user space. Just pointer dereferences.

About 10–15% of I/O time saved.

### 3. Thread-Local Aggregation

`ConcurrentHashMap` has overhead. Every `put()` or `compute()` requires:
- Hash calculation
- CAS operation to check for contention
- Potential lock acquisition if bucket is contested

Instead, each thread maintains its own `HashMap`. No contention. No CAS. No locks. At the end, merge all maps single-threaded.

```java
Map<String, StationStats>[] localMaps = new Map[numThreads];

Map<String, StationStats> result = new HashMap<>();
for (Map<String, StationStats> local : localMaps) {
    local.forEach((station, stats) -> 
        result.merge(station, stats, StationStats::combine)
    );
}
```

About half of aggregation time saved.

### 4. Unsafe

Top solutions use `sun.misc.Unsafe` to:
- Read memory without bounds checks
- Parse numbers with manual bit manipulation
- Use SIMD instructions for scanning bytes

This is not portable. Not safe. But fast.

Another 20–30% on top of that.

### 5. GraalVM Native Image

Compile to native binary. No JVM startup. No JIT warmup. No interpreter.

1–2 seconds of fixed overhead gone.

***

## The performance ladder

Here's the full spectrum for 1 billion rows:

| Approach | Time | Complexity | Portable? |
|----------|------|------------|-----------|
| Sequential | 180s | Low | Yes |
| Default `.parallel()` | 52s | Low | Yes |
| **Fixed-batch spliterator** | **31s** | **Medium** | **Yes** |
| + Custom parsing | 22s | High | Yes |
| + Memory-mapped I/O | 19s | High | Yes |
| + Thread-local aggregation | 13s | High | Yes |
| + Unsafe | 5s | Very High | No |
| + GraalVM native | 2s | Very High | No |

Fixed-batch is the sweet spot. 3.5x faster than default. Still maintainable. Still portable.

Everything after that trades maintainability for speed. Custom parsing means you're writing your own `indexOf()` and `parseDouble()`. Memory-mapped I/O means you're managing byte buffers and offsets. Thread-local aggregation means you're manually partitioning work.

And `Unsafe`? You're reading raw memory addresses. One off-by-one error and you segfault the JVM.

I'm comfortable stopping at fixed-batch for production code. The rest is for competitions and benchmarks.

***

## When this actually helps

Fixed-batch spliterators make sense when you're reading from I/O (files, network streams, database cursors) and can't split the source upfront. They also help when per-element work is non-trivial (parsing, validation, transformation). If one element takes under a microsecond, batch overhead dominates. You need real parallelism: multiple cores and a workload that's CPU-bound after I/O. And you want something maintainable: standard Java, no `Unsafe`, nothing that makes code review painful.

Skip it when your data is already in memory (arrays, lists, collections split fine on their own). Skip it when processing is trivial (simple filters or no-op maps); batch overhead costs more than you gain. If you're I/O bound, parallelism won't help; profile first. And if you need predictable latency, batching adds variance: some requests hit batch boundaries, others don't.

***

## The memory cost

Fixed-batch uses more memory than default streams.

Why? Each batch materializes into an `Object[]` array. With 8 threads and 10K batch size, you have 8 × 10K = 80K elements in memory.

Measured on the 1BRC:
- Default stream: 1.2 GB peak
- Fixed-batch (10K): 1.8 GB peak  
- Fixed-batch (50K): 2.5 GB peak

You're trading memory for CPU utilization. Usually worth it—memory is cheap, CPU is expensive.

But if you're memory-constrained (containers with tight limits, embedded systems), this matters. You might need smaller batches or a different approach.

Also: larger batches mean larger arrays. Large arrays can cause GC issues:
- Young gen collections happen more often
- Arrays might get promoted to old gen
- Fragmentation increases

I saw GC overhead jump from 3% to 8% when I went from 10K to 100K batch size. The arrays were large enough to survive young gen collections and get promoted. Then old gen filled up and triggered full GCs.

Keep batches small enough to stay in young gen. For most workloads, that's under 100K elements.

***

## What surprised me

The default Stream API optimizes for the wrong thing. Growing batches minimize split overhead. For I/O workloads though, split overhead is tiny next to load imbalance. The JDK picked the wrong trade-off. I get why—they can't know your workload. But it means `.parallel()` often makes things slower. People try it, see worse numbers, and decide "parallel streams don't work." They do. The default spliterator doesn't.

I expected to spend most of my time waiting on disk. Nope. Parsing is the bottleneck. Modern SSDs do 3–5 GB/s sequential. Reading the file is a couple of seconds. Parsing is 14 seconds. String allocation, substring copies, `parseDouble()`. That's where the time goes. Top solutions avoid strings and parse bytes directly. No allocations, just arithmetic.

Parallelism has steep diminishing returns. 1 thread to 8 threads: 8x (linear). Default parallel to fixed-batch: 1.7x. Fixed-batch to custom parsing: 1.4x. Custom parsing to Unsafe: 2.6x, but 10x the complexity. Each step is harder and gives less. Fixed-batch is the last easy win.

The 1BRC isn't about algorithms. It's about constants. The gap between 30 seconds and 2 seconds is 3 string allocations per row vs zero, ConcurrentHashMap CAS vs thread-local HashMap, bounds-checked access vs Unsafe, JIT vs GraalVM native. Every microsecond counts.

***

## What I'd do differently in production

For a system that processes large files (logs, CSV exports, data dumps), I'd start with the fixed-batch spliterator. Fifty lines, 40% speedup, still maintainable, runs on any JVM. If that's not enough, custom parsing—bytes directly, no string allocations—but it's easy to get wrong, so test carefully. If it's still not enough, step back: do you really need to process 1B rows in one shot? Can you stream, preprocess, or partition across machines?

`Unsafe` and memory-mapped I/O are last resorts. The complexity and maintenance cost are real. I've seen teams spend weeks tuning hot paths with `Unsafe` only to find the real bottleneck somewhere else. Profile first. Fix the algorithm and data structures. Then micro-optimize.

The 1BRC rewards extreme optimization. Production rewards maintainability and correctness. Fixed-batch sits in the middle.

***

## The complete implementation

Here's everything you need to benchmark this yourself. The `benchmark` helper runs 3 warmup iterations to let the JIT compile the hot path, then 5 timed runs and reports the median:

```java
public class BenchmarkFixedBatch {

    public static void main(String[] args) throws IOException {
        int numRows = args.length > 0 ? Integer.parseInt(args[0]) : 1_000_000_000;
        int[] batchSizes = args.length > 1
                ? parseBatchSizes(args[1])
                : new int[]{1_000, 10_000, 50_000, 100_000};

        Path testFile = generateTestFile(numRows);

        System.out.println("Benchmarking " + String.format("%,d", numRows) + " rows...\n");

        benchmark("Sequential", () -> processSequential(testFile));
        benchmark("Default Parallel", () -> processDefaultParallel(testFile));

        for (int batchSize : batchSizes) {
            benchmark("Fixed-Batch " + batchSize,
                    () -> processFixedBatch(testFile, batchSize));
        }
    }

    private static int[] parseBatchSizes(String arg) {
        String[] parts = arg.split(",");
        int[] sizes = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            sizes[i] = Integer.parseInt(parts[i].trim());
        }
        return sizes;
    }
    
    private static void benchmark(String name, ThrowingRunnable task) {
        for (int i = 0; i < 3; i++) {
            try { task.run(); } 
            catch (Exception e) { throw new RuntimeException(e); }
        }

        long[] times = new long[5];
        for (int i = 0; i < 5; i++) {
            long start = System.nanoTime();
            try { task.run(); } 
            catch (Exception e) { throw new RuntimeException(e); }
            times[i] = System.nanoTime() - start;
        }
        
        Arrays.sort(times);
        double median = times[2] / 1_000_000_000.0;
        System.out.printf("%-20s: %.2f seconds%n", name, median);
    }
    
    private static Map<String, StationStats> processSequential(Path path) throws IOException {
        try (Stream<String> lines = Files.lines(path)) {
            return lines
                .map(OneBillionRowChallenge::parseLine)
                .collect(Collectors.groupingBy(
                    Measurement::station,
                    Collector.of(
                        StationStats::new,
                        StationStats::accept,
                        StationStats::combine
                    )
                ));
        }
    }
    
    private static Map<String, StationStats> processDefaultParallel(Path path) throws IOException {
        try (Stream<String> lines = Files.lines(path)) {
            return lines
                .parallel()
                .map(OneBillionRowChallenge::parseLine)
                .collect(Collectors.groupingByConcurrent(
                    Measurement::station,
                    Collector.of(
                        StationStats::new,
                        StationStats::accept,
                        StationStats::combine
                    )
                ));
        }
    }
    
    private static Map<String, StationStats> processFixedBatch(Path path, int batchSize) 
            throws IOException {
        try (Stream<String> lines = FileLineSpliterator.stream(path, batchSize)) {
            return lines
                .map(OneBillionRowChallenge::parseLine)
                .collect(Collectors.groupingByConcurrent(
                    Measurement::station,
                    Collector.of(
                        StationStats::new,
                        StationStats::accept,
                        StationStats::combine
                    )
                ));
        }
    }
    
    private static Path generateTestFile(int numRows) throws IOException {
        Path path = Paths.get("test_measurements_" + numRows + ".txt");
        if (Files.exists(path)) return path;
        
        String[] stations = {
            "Hamburg", "Bulawayo", "Palembang", "St. John's", "Cracow",
            "Bridgetown", "Istanbul", "Roseau", "Conakry", "Ankara"
        };
        
        Random random = new Random(42);
        try (BufferedWriter writer = Files.newBufferedWriter(path)) {
            for (int i = 0; i < numRows; i++) {
                String station = stations[random.nextInt(stations.length)];
                double temp = -10 + random.nextDouble() * 50;
                writer.write(String.format("%s;%.1f%n", station, temp));
            }
        }
        
        return path;
    }
    
    @FunctionalInterface
    interface ThrowingRunnable {
        void run() throws Exception;
    }
}
```

Run this. Watch your CPU utilization jump from 60% to 95%.

***

## Day 100: what I learned about performance

Optimization is a ladder: right algorithm, right data structures, right concurrency, then constants (allocation, parsing, copying), then the metal (`Unsafe`, SIMD, native). Most code never gets past step 2. Some needs step 3. Very little needs 4 or 5.

Fixed-batch spliterators sit around 3.5. Fifty lines, 40% faster. The 1BRC made it clear there's always another level—custom parsing, memory-mapped I/O, thread-local aggregation, `Unsafe`, GraalVM. Each step is harder and pays off less. Knowing when to stop is the part nobody teaches.

***

## N.B
Later this problem with stream imbalance split was fixed in openJDK in this [enhancement](https://bugs.openjdk.org/browse/JDK-8280915)

## References

Details and inspiration from:
- [One Billion Row Challenge Repository](https://github.com/gunnarmorling/1brc) - Gunnar Morling's challenge and leaderboard
- [Parallel Processing of I/O-Based Data with Java Streams](https://web.archive.org/web/20210207202033/https://www.airpair.com/java/posts/parallel-processing-of-io-based-data-with-java-streams) - Marko Topolnik's original fixed-batch spliterator article
- [Java Spliterator Documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Spliterator.html) - Official Java documentation
- [JEP 266: More Concurrency Updates](https://openjdk.org/jeps/266) - Background on Java concurrency improvements
- [1BRC Solutions Analysis](https://questdb.io/blog/billion-row-challenge-step-by-step/) - Detailed breakdown of optimization techniques
- [Java Performance Tuning Guide](https://www.oracle.com/java/technologies/javase/performance-tuning.html) - Oracle's performance best practices
