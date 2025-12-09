+++
category = ["Java", "100DaysOfJava"]
date = 2025-11-21T00:00:00Z
description = "Master core Java concurrency synchronization - CyclicBarrier, Semaphore, ThreadFactory, and BlockingQueue with production patterns, trade-offs, and real-world examples."
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day96"
summary = "Part 2: Core Synchronization Patterns - Deep dive into 4 essential coordination tools with real-world patterns, performance characteristics, and common pitfalls"
title = "Day 96: Java Concurrency Toolkit Part 2 - Core Synchronization Patterns"
[cover]
alt = "day96"
caption = "day96"
image = ""
relative = false
+++

**"The art of concurrent programming lies not in making things parallel, but in coordinating parallel things gracefully."**

In [Part 1 (Day 95)](/posts/java/100DaysOfJava/day95), we explored the **foundation and execution patterns**: Executor, ExecutorService, ScheduledExecutorService, Future, CompletableFuture, and CountDownLatch. These tools help us execute tasks concurrently.

Now in **Part 2**, we dive into **core synchronization patterns**—the fundamental tools that help multiple threads coordinate and share resources safely.

## Series Overview

This is a **3-part series** on Java Concurrency:

**Part 1 (Day 95):** Foundation & Execution
- Executor, ExecutorService, ScheduledExecutorService
- Future, CompletableFuture, CountDownLatch

**Part 2 (Today - Day 96):** Core Synchronization Patterns
- CyclicBarrier, Semaphore, ThreadFactory, BlockingQueue

**Part 3 (Day 97):** Advanced Patterns & Production Readiness
- DelayQueue, ReentrantLock, Phaser
- Debugging, Monitoring, Production Patterns

---

## What We're Covering Today

**Part 2 (Today):** Core Synchronization Patterns
1. CyclicBarrier - Reusable multi-phase synchronization
2. Semaphore - Resource pool management
3. ThreadFactory - Production-ready thread management
4. BlockingQueue - Producer-consumer patterns

---

## Performance Characteristics Reference

| Tool | CPU Overhead | Memory Per Instance | Typical Latency | Best For |
|------|-------------|---------------------|-----------------|----------|
| **CyclicBarrier** | Low | ~80 bytes + parties | Microseconds (coordination) | Fixed-party multi-phase work |
| **Semaphore** | Very Low | ~32 bytes | Nanoseconds | Resource limiting |
| **ThreadFactory** | Zero (creation time) | Per thread (~1MB stack) | N/A | Thread customization |
| **BlockingQueue** | Low-Medium | Depends on capacity | Microseconds (ops) | Producer-consumer |

---

## The Coordination Challenge

In Part 1, we learned how to execute work concurrently. But execution alone isn't enough. Real systems need **coordination**:

![](https://res.cloudinary.com/dlsxyts6o/image/upload/v1764909602/Untitled-2025-12-04-2228_gwudj1.png)

Think of it like a construction project:
- Workers need to sync at checkpoints (CyclicBarrier)
- Only X workers can use the crane at once (Semaphore)
- Workers need proper uniforms and tools (ThreadFactory)
- Materials move between stations (BlockingQueue)

---

## 1. CyclicBarrier: Multi-Phase Processing

**The Problem:** Processing a large dataset in three phases: Extract → Transform → Load. Each phase must complete across all threads before the next phase starts.

This is perfect for batch processing scenarios where work happens in distinct phases. Unlike CountDownLatch which is one-shot, CyclicBarrier resets after each phase, making it ideal for iterative workflows.

**The Solution:** Synchronized phase transitions with CyclicBarrier.

```java
import java.util.concurrent.*;
import java.util.stream.IntStream;

public class BatchProcessor {
    private final int workerCount;
    
    public BatchProcessor(int workerCount) {
        this.workerCount = workerCount;
    }
    
    public void processBatch() throws InterruptedException {
        CyclicBarrier barrier = new CyclicBarrier(
            workerCount,
            () -> System.out.println("--- Phase completed. All workers synchronized ---")
        );
        
        ExecutorService pool = Executors.newFixedThreadPool(workerCount);
        
        Runnable worker = () -> {
            try {
                String threadName = Thread.currentThread().getName();
                
                // Phase 1: Extract
                System.out.println(threadName + " - Extracting data...");
                Thread.sleep(ThreadLocalRandom.current().nextInt(500, 1500));
                System.out.println(threadName + " - Extract complete");
                
                barrier.await(); // Wait for all threads to finish Phase 1
                
                // Phase 2: Transform
                System.out.println(threadName + " - Transforming data...");
                Thread.sleep(ThreadLocalRandom.current().nextInt(500, 1500));
                System.out.println(threadName + " - Transform complete");
                
                barrier.await(); // Wait for all threads to finish Phase 2
                
                // Phase 3: Load
                System.out.println(threadName + " - Loading data...");
                Thread.sleep(ThreadLocalRandom.current().nextInt(500, 1500));
                System.out.println(threadName + " - Load complete");
                
                barrier.await(); // Wait for all threads to finish Phase 3
                
            } catch (InterruptedException | BrokenBarrierException e) {
                System.err.println("Worker interrupted: " + e.getMessage());
            }
        };
        
        // Submit all workers
        IntStream.range(0, workerCount)
                .forEach(i -> pool.submit(worker));
        
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.MINUTES);
        
        System.out.println("Batch processing complete!");
    }
}
```

**Key Difference from CountDownLatch:** CyclicBarrier is reusable. After all threads reach the barrier, it resets automatically. Perfect for iterative or phase-based processing.

### Visualizing CyclicBarrier
here is a sequence diagram to visualize how `Cyclic Barrier` works.

![](https://res.cloudinary.com/dlsxyts6o/image/upload/v1764909831/Untitled-2025-12-05-1042_snaqyv.png)

### Trade-offs and Limitations

**Pros:**
- Reusable (unlike CountDownLatch)
- Built-in barrier action (callback when all arrive)
- Low overhead
- Thread-safe reset

**Cons:**
- Fixed number of parties (must be known at creation)
- If one thread fails, others wait forever (unless you handle BrokenBarrierException)
- No dynamic party registration (use Phaser instead)
- All threads must reach barrier together (can't have stragglers)

**Common Mistakes:**

```java
// MISTAKE 1: Wrong party count
CyclicBarrier barrier = new CyclicBarrier(5);
for (int i = 0; i < 3; i++) { // Only 3 threads!
    pool.submit(() -> {
        doWork();
        barrier.await(); // Blocks forever! Only 3/5 arrived
    });
}

// CORRECT: Match party count
int parties = 3;
CyclicBarrier barrier = new CyclicBarrier(parties);
for (int i = 0; i < parties; i++) {
    pool.submit(() -> {
        doWork();
        barrier.await();
    });
}

// MISTAKE 2: Not handling BrokenBarrierException
pool.submit(() -> {
    doWork();
    barrier.await(); // What if another thread throws exception?
});

// CORRECT: Handle broken barrier
pool.submit(() -> {
    try {
        doWork();
        barrier.await();
    } catch (BrokenBarrierException e) {
        System.err.println("Barrier broken! Aborting.");
        // Cleanup and exit
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});

// MISTAKE 3: Reusing after reset without checking
if (barrier.isBroken()) {
    barrier.reset(); // Must reset explicitly if broken
}

// CORRECT: Check state before reuse
if (barrier.isBroken()) {
    barrier.reset();
}
barrier.await();
```

**When to Use:**
- Fixed number of worker threads
- Multi-phase processing where all must complete each phase
- Iterative algorithms (simulation, game loops)
- Dynamic party count needed (use Phaser)
- One-shot synchronization (use CountDownLatch)

---

## 2. Semaphore: Resource Pool Management

**The Problem:** A database connection pool has a limited number of connections. If too many threads try to query simultaneously, we'll overwhelm the pool and get connection timeouts.

Resource pool management is a common challenge in concurrent systems. Semaphores provide a clean way to limit concurrent access to any finite resource.

**The Solution:** Limit concurrent access with Semaphore.

```java
import java.util.concurrent.*;

public class DatabaseService {
    private final Semaphore connectionPermits;
    private final int maxConnections;
    
    public DatabaseService(int maxConnections) {
        this.maxConnections = maxConnections;
        this.connectionPermits = new Semaphore(maxConnections, true); // fair=true for FIFO
    }
    
    public String executeQuery(String sql) {
        System.out.println(Thread.currentThread().getName() + " - Requesting DB connection...");
        
        try {
            // Try to acquire permit (blocks if none available)
            connectionPermits.acquire();
            
            System.out.println(Thread.currentThread().getName() + " - Got connection! " +
                             "Available: " + connectionPermits.availablePermits() + "/" + maxConnections);
            
            // Execute query
            String result = runActualQuery(sql);
            
            return result;
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Query interrupted";
        } finally {
            // Always release permit
            connectionPermits.release();
            System.out.println(Thread.currentThread().getName() + " - Released connection");
        }
    }
    
    public boolean tryExecuteQueryWithTimeout(String sql, long timeoutMs) {
        try {
            // Try to acquire with timeout
            if (connectionPermits.tryAcquire(timeoutMs, TimeUnit.MILLISECONDS)) {
                try {
                    runActualQuery(sql);
                    return true;
                } finally {
                    connectionPermits.release();
                }
            } else {
                System.err.println("Could not acquire connection within " + timeoutMs + "ms");
                return false;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
    
    private String runActualQuery(String sql) {
        // Simulate DB query
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return "Result for: " + sql;
    }
}
```

**Pro Tip:** Use `tryAcquire()` with timeout in request handlers to fail fast instead of blocking indefinitely. Your users will thank you.

### Trade-offs and Limitations

**Pros:**
- Simple API (acquire/release)
- Supports fair vs non-fair modes
- Can try with timeout
- Can query available permits
- Very low overhead

**Cons:**
- No automatic resource management (must call release in finally)
- Permits can be released by any thread (not tied to acquirer)
- No built-in timeout enforcement on resource usage
- Can accidentally create permit leaks

**Common Mistakes:**

```java
// MISTAKE 1: Forgetting to release
semaphore.acquire();
doWork(); // What if this throws?
semaphore.release(); // Never called!

// CORRECT: Always use try-finally
semaphore.acquire();
try {
    doWork();
} finally {
    semaphore.release(); // Always happens
}

// MISTAKE 2: Releasing without acquiring
semaphore.release(); // Increases permit count above initial!
// This creates "phantom permits" that break your resource limit

// CORRECT: Only release what you acquired
boolean acquired = semaphore.tryAcquire();
if (acquired) {
    try {
        doWork();
    } finally {
        semaphore.release();
    }
}

// MISTAKE 3: Using unfair mode for critical resources
Semaphore semaphore = new Semaphore(1, false); // unfair
// Threads can "cut in line" causing starvation

// CORRECT: Use fair mode for critical resources
Semaphore semaphore = new Semaphore(1, true); // fair = FIFO
```

### What is Fair/Unfair in a Semaphore 

In Java, a Semaphore can operate in either fair or unfair mode, which determines the order in which waiting threads acquire a permit. The choice between the two involves a trade-off between guaranteed access and application throughput. 

**Fair Semaphore**

A fair semaphore ensures that threads acquire permits in the order they requested them, operating like a strict First-In, First-Out (FIFO) queue. 

**What is fairness:**
- **Guaranteed Order:** 
The thread that has been waiting the longest is the next one to obtain a permit when one becomes available.
- **Starvation Prevention:** 
It prevents a situation where a thread might wait indefinitely for a resource while new, "barging" threads continuously acquire permits. This makes it suitable for managing access to limited resources like a database connection pool.

**What is unfair:**
- **Performance Overhead:** 
Maintaining a strict FIFO queue requires more overhead, including more context switches, which can result in lower overall application throughput compared to unfair mode. 

To create a fair semaphore, you use the constructor `new Semaphore(int permits, true)`. 

**Real-World Use Cases:**
- Database connection pools
- API rate limiting (X requests per second)
- Limited worker threads for CPU-intensive tasks
- Bounded parallelism in file I/O

### Integration Example: Rate Limiting

```java
public class RateLimiter {
    private final Semaphore permits;
    private final ScheduledExecutorService refiller;
    
    public RateLimiter(int permitsPerSecond) {
        this.permits = new Semaphore(permitsPerSecond, true);
        this.refiller = Executors.newScheduledThreadPool(1);
        
        // Refill permits every second
        refiller.scheduleAtFixedRate(() -> {
            int available = permits.availablePermits();
            int toAdd = permitsPerSecond - available;
            if (toAdd > 0) {
                permits.release(toAdd);
            }
        }, 1, 1, TimeUnit.SECONDS);
    }
    
    public boolean tryAcquire() {
        return permits.tryAcquire();
    }
}
```

---

## 3. ThreadFactory: Production-Ready Thread Management

**The Problem:** Thread dumps show dozens of threads all named `pool-1-thread-X`. Without meaningful names, it's nearly impossible to debug which pool is causing issues.

Proper thread naming and configuration is essential for production debugging. A custom ThreadFactory gives you control over thread creation and helps with monitoring and troubleshooting.

**The Solution:** Custom ThreadFactory with meaningful names and proper configuration.

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class NamedThreadFactory implements ThreadFactory {
    private final String namePrefix;
    private final AtomicInteger threadNumber;
    private final boolean daemon;
    private final int priority;
    
    public NamedThreadFactory(String namePrefix, boolean daemon, int priority) {
        this.namePrefix = namePrefix;
        this.daemon = daemon;
        this.priority = priority;
        this.threadNumber = new AtomicInteger(1);
    }
    
    @Override
    public Thread newThread(Runnable r) {
        Thread t = new Thread(r);
        t.setName(namePrefix + "-" + threadNumber.getAndIncrement());
        t.setDaemon(daemon);
        t.setPriority(priority);
        
        // Add uncaught exception handler
        t.setUncaughtExceptionHandler((thread, throwable) -> {
            System.err.println("Uncaught exception in " + thread.getName() + ": " + 
                             throwable.getMessage());
            // In production: send to error tracking service like sentry, rollbar etc
        });
        
        return t;
    }
    
    public static ExecutorService createNamedPool(String name, int size) {
        return Executors.newFixedThreadPool(
            size,
            new NamedThreadFactory(name, false, Thread.NORM_PRIORITY)
        );
    }
}

// Usage example
class ServiceOrchestrator {
    private final ExecutorService paymentPool;
    private final ExecutorService notificationPool;
    private final ExecutorService analyticsPool;
    
    public ServiceOrchestrator() {
        this.paymentPool = NamedThreadFactory.createNamedPool("payment-worker", 8);
        this.notificationPool = NamedThreadFactory.createNamedPool("notification-worker", 4);
        this.analyticsPool = NamedThreadFactory.createNamedPool("analytics-worker", 2);
    }
    
    // Now thread dumps show: payment-worker-1, notification-worker-1, analytics-worker-1
    // Instead of: pool-1-thread-1, pool-2-thread-1, pool-3-thread-1
}
```

**Production Checklist:**
- Meaningful thread names
- Daemon status set correctly
- Uncaught exception handlers
- Appropriate priority levels

### Trade-offs and Limitations

**Pros:**
- Full control over thread properties
- Consistent naming for debugging
- Centralized exception handling
- Can add custom initialization logic

**Cons:**
- More boilerplate than default factories
- Easy to forget to use it
- Doesn't prevent thread leaks (just makes them easier to find)

**Common Mistakes:**

```java
// MISTAKE 1: Using daemon threads for critical work
ThreadFactory factory = r -> {
    Thread t = new Thread(r);
    t.setDaemon(true); // JVM can exit while thread is running!
    return t;
};
ExecutorService pool = Executors.newFixedThreadPool(10, factory);
pool.submit(() -> {
    writeToDatabase(); // May not complete before JVM exits!
});

// CORRECT: Non-daemon for critical work
ThreadFactory factory = r -> {
    Thread t = new Thread(r);
    t.setDaemon(false); // JVM waits for completion
    return t;
};

// MISTAKE 2: Not thread-safe counter
class BadFactory implements ThreadFactory {
    private int counter = 0; // Not thread-safe!
    
    public Thread newThread(Runnable r) {
        return new Thread(r, "worker-" + counter++);
    }
}

// CORRECT: Use AtomicInteger
class GoodFactory implements ThreadFactory {
    private final AtomicInteger counter = new AtomicInteger(0);
    
    public Thread newThread(Runnable r) {
        return new Thread(r, "worker-" + counter.getAndIncrement());
    }
}

// MISTAKE 3: Swallowing exceptions in handler
t.setUncaughtExceptionHandler((thread, throwable) -> {
    // Just print? Exception is lost!
    throwable.printStackTrace();
});

// CORRECT: Send to monitoring system
t.setUncaughtExceptionHandler((thread, throwable) -> {
    logger.error("Uncaught exception in " + thread.getName(), throwable);
    // Send to Sentry, Rollbar, etc.
    errorTracker.captureException(throwable);
    // Update metrics
    exceptionCounter.increment();
});
```

### Monitoring Integration

```java
public class MonitoredThreadFactory implements ThreadFactory {
    private final String namePrefix;
    private final AtomicInteger threadNumber = new AtomicInteger(1);
    private final AtomicInteger createdThreads;
    private final AtomicInteger activeThreads;
    
    public MonitoredThreadFactory(String namePrefix, MeterRegistry registry) {
        this.namePrefix = namePrefix;
        this.createdThreads = registry.gauge("threads.created", 
            Tags.of("pool", namePrefix), new AtomicInteger(0));
        this.activeThreads = registry.gauge("threads.active", 
            Tags.of("pool", namePrefix), new AtomicInteger(0));
    }
    
    @Override
    public Thread newThread(Runnable r) {
        createdThreads.incrementAndGet();
        activeThreads.incrementAndGet();
        
        Thread t = new Thread(() -> {
            try {
                r.run();
            } finally {
                activeThreads.decrementAndGet();
            }
        });
        
        t.setName(namePrefix + "-" + threadNumber.getAndIncrement());
        return t;
    }
}
```

---

## 4. BlockingQueue: The Producer-Consumer Pattern

**The Problem:** A service receives work faster than it can process it. Without buffering, you either drop requests or the system becomes overwhelmed.

The producer-consumer pattern with BlockingQueue is fundamental to async processing. It decouples work submission from work execution, providing natural backpressure when consumers can't keep up.

**The Solution:** Decouple producers from consumers with a bounded queue.

```java
import java.util.concurrent.*;
import java.nio.file.*;
import java.util.stream.Stream;

public class ImageProcessingPipeline {
    private final BlockingQueue<Path> imageQueue;
    private final ExecutorService producers;
    private final ExecutorService consumers;
    private volatile boolean running;
    
    public ImageProcessingPipeline(int queueSize, int consumerCount) {
        this.imageQueue = new ArrayBlockingQueue<>(queueSize);
        this.producers = Executors.newSingleThreadExecutor(
            new NamedThreadFactory("image-producer", false, Thread.NORM_PRIORITY)
        );
        this.consumers = Executors.newFixedThreadPool(
            consumerCount,
            new NamedThreadFactory("image-consumer", false, Thread.NORM_PRIORITY)
        );
        this.running = true;
    }
    
    public void start(Path imageDirectory) {
        System.out.println("Starting image processing pipeline...");
        
        // Producer: Read image files and add to queue
        producers.submit(() -> {
            try (Stream<Path> paths = Files.list(imageDirectory)) {
                paths.filter(p -> p.toString().endsWith(".jpg"))
                     .forEach(path -> {
                         try {
                             System.out.println("Producer: Queuing " + path.getFileName());
                             imageQueue.put(path); // Blocks if queue is full
                         } catch (InterruptedException e) {
                             Thread.currentThread().interrupt();
                         }
                     });
                     
                // Signal completion by adding poison pills
                for (int i = 0; i < Runtime.getRuntime().availableProcessors(); i++) {
                    imageQueue.put(Paths.get("STOP")); // Sentinel value
                }
            } catch (Exception e) {
                System.err.println("Producer error: " + e.getMessage());
            }
        });
        
        // Consumers: Process images from queue
        int consumerCount = Runtime.getRuntime().availableProcessors();
        for (int i = 0; i < consumerCount; i++) {
            consumers.submit(() -> {
                while (running) {
                    try {
                        Path image = imageQueue.take(); // Blocks if queue is empty
                        
                        if (image.toString().equals("STOP")) {
                            System.out.println("Consumer received stop signal");
                            break;
                        }
                        
                        System.out.println("Consumer: Processing " + image.getFileName());
                        compressImage(image);
                        
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            });
        }
    }
    
    private void compressImage(Path image) {
        // Simulate compression work
        try {
            Thread.sleep(500);
            System.out.println("Compressed: " + image.getFileName());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
    
    public void shutdown() {
        running = false;
        producers.shutdown();
        consumers.shutdown();
    }
}
```

**Key Pattern:** The "poison pill" technique (sentinel value in our example its STOP) to signal consumers to stop gracefully.


### Trade-offs and Limitations

**Pros:**
- Built-in backpressure (blocks when full)
- Thread-safe operations
- Natural decoupling of producers/consumers
- Multiple queue implementations (Array, Linked, Priority, etc.)

**Cons:**
- Bounded queues can cause producers to block
- Unbounded queues can cause OOM
- No built-in monitoring (queue depth not exposed)
- Poison pill pattern requires careful coordination

**Queue Implementation Trade-offs:**

| Implementation | Ordering | Bounded | Throughput | Use Case |
|---------------|----------|---------|------------|----------|
| **ArrayBlockingQueue** | FIFO | ✅ | High | Fixed capacity, predictable memory |
| **LinkedBlockingQueue** | FIFO | Optional | Medium | Variable load, unbounded acceptable |
| **PriorityBlockingQueue** | Priority | ❌ | Lower | Task prioritization needed |
| **SynchronousQueue** | N/A | N/A | Highest | Direct handoff (zero capacity) |
| **DelayQueue** | Delay time | ❌ | Medium | Delayed execution |

**Common Mistakes:**

```java
// ❌ MISTAKE 1: Unbounded queue with slow consumers
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(); // Unbounded!
// Producer adds 1000 items/sec, consumer processes 10/sec
// Queue grows to millions = OOM!

// ✅ CORRECT: Bounded queue with backpressure
BlockingQueue<Task> queue = new ArrayBlockingQueue<>(1000);
// Producer blocks when queue is full = natural backpressure

// ❌ MISTAKE 2: Not handling interruption
queue.put(task); // Blocks if full, but what if interrupted?

// ✅ CORRECT: Handle interruption
try {
    queue.put(task);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    // Cleanup and exit gracefully
}

// ❌ MISTAKE 3: Poison pill per producer instead of per consumer
// 2 producers, 3 consumers
queue.put(STOP); // Only 1 consumer stops!

// ✅ CORRECT: One poison pill per consumer
int consumerCount = 3;
for (int i = 0; i < consumerCount; i++) {
    queue.put(STOP);
}

// ❌ MISTAKE 4: Losing tasks on shutdown
pool.shutdown(); // Queued tasks might not complete!

// ✅ CORRECT: Drain queue before shutdown
pool.shutdown();
List<Runnable> unfinished = new ArrayList<>();
queue.drainTo(unfinished);
// Persist unfinished tasks for retry
```

### Monitoring Queue Health

```java
public class MonitoredQueue<T> {
    private final BlockingQueue<T> queue;
    private final int capacity;
    private final MeterRegistry registry;
    
    public MonitoredQueue(int capacity, MeterRegistry registry) {
        this.queue = new ArrayBlockingQueue<>(capacity);
        this.capacity = capacity;
        this.registry = registry;
        
        // Monitor queue depth
        registry.gauge("queue.size", queue, BlockingQueue::size);
        registry.gauge("queue.utilization", queue, 
            q -> (double) q.size() / capacity);
    }
    
    public void put(T item) throws InterruptedException {
        long startTime = System.nanoTime();
        queue.put(item);
        long duration = System.nanoTime() - startTime;
        
        registry.timer("queue.put.time").record(duration, TimeUnit.NANOSECONDS);
        
        // Alert if blocking for too long
        if (duration > TimeUnit.SECONDS.toNanos(1)) {
            logger.warn("Producer blocked for {}ms", 
                TimeUnit.NANOSECONDS.toMillis(duration));
        }
    }
}
```

---

## Part 2 Summary: Core Synchronization Patterns

We've covered **4 fundamental synchronization tools**:

| Tool | Best For | Key Limitation |
|------|----------|----------------|
| **CyclicBarrier** | Fixed multi-phase work | Can't change party count |
| **Semaphore** | Resource limiting | Must remember to release |
| **ThreadFactory** | Thread customization | Doesn't prevent leaks |
| **BlockingQueue** | Producer-consumer | Queue can grow unbounded |

**Key Takeaways:**

1. **CyclicBarrier** is reusable - perfect for iterative multi-phase work
2. **Semaphore** provides clean resource limiting - always use try-finally
3. **ThreadFactory** makes debugging possible - name your threads!
4. **BlockingQueue** decouples producers from consumers - use bounded queues

**Coming in Part 3 (Day 97):**
- DelayQueue - Time-delayed execution with exponential backoff
- ReentrantLock - Fine-grained locking with timeouts
- Phaser - Dynamic multi-phase coordination
- **Plus:** Debugging techniques, monitoring patterns, and production readiness checklist

---

**Previous:** [Day 95 - Java Concurrency Toolkit Part 1: Foundation & Execution Patterns](/posts/java/100DaysOfJava/day95)

**Next:** [Day 97 - Java Concurrency Toolkit Part 3: Advanced Patterns & Production Readiness](/posts/java/100DaysOfJava/day97)
