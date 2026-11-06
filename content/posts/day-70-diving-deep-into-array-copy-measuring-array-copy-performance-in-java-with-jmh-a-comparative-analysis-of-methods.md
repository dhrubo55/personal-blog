+++
category = []
date = 2023-04-15T00:00:00Z
lastmod = 2026-10-28T00:00:00Z
description = "Measuring the performance of different array copying methods in Java using JMH"
draft = false
showtoc = true
slug = "/java/100DaysOfJava/day70"
summary = "Measuring the performance of different array copying methods in Java using JMH"
topics = ["JVM & Performance"]
title = "Day 70:Diving deep into Array copy- Measuring Array Copy Performance in Java with JMH: A Comparative Analysis of Methods"
[cover]
alt = "day70"
caption = "day70"
image = ""
relative = false

+++
Does reusing a destination array change the cost of copying 3,000 integers? This example compares loops and Java's array-copy APIs, and separates copying into an existing array from allocating a new one. [Day 69](/posts/java/100daysofjava/day69/) introduces the JMH lifecycle behind the example.

This is where the Java Microbenchmark Harness (JMH) library comes in handy. JMH is a benchmarking tool designed specifically for measuring the performance of Java code. In this article, we will use JMH to measure the performance of various array copying methods.

```java
public class ArrayCopyBenchmarks {
    @State(Scope.Benchmark)
    public static class ArrState {
        public int[] arr = new int[3000];
        public int[] arr2 = new int[3000];

        @Setup
        public void setup() {
            Random random = new Random();
            Arrays.fill(arr, random.nextInt());
        }
    }
    //@Benchmark
    public int[] loopCopy(ArrState state) {
        int[] arr2 = new int[30];
        for (int i = 0; i < state.arr.length; i++) {
            arr2[i] = state.arr[i];
        }
        return arr2;
    }

    //@Benchmark
    public int[] systemArraysCopy(ArrState state) {
        int[] arr2 = new int[30];
        System.arraycopy(state.arr, 0, arr2, 0, state.arr.length);
        return arr2;
    }

    @Benchmark
    public int[] systemArraysCopyToExistingArray(ArrState state) {
        System.arraycopy(state.arr, 0, state.arr2, 0, state.arr.length);
        return state.arr2;
    }

    @Benchmark
    public int[] loopCopyToExistingArray(ArrState state) {
        for (int i = 0; i < state.arr.length; i++) {
            state.arr2[i] = state.arr[i];
        }
        return state.arr2;
    }

    //@Benchmark
    public int[] arraysCopy(ArrState state) {
        return Arrays.copyOf(state.arr, state.arr.length);
    }

    public static void main(String[] args) throws Exception {
        runBenchmark(ArrayCopyBenchmarks.class);
    }
}
```

Let's start by taking a look at the Java code provided above. The code defines a class called **`ArrayCopyBenchmarks`** which contains several methods for copying arrays. These methods include:

* **`loopCopy`**: This method uses a simple loop to copy the contents of one array to another.
* **`systemArraysCopy`**: This method uses the **`System.arraycopy`** method to copy the contents of one array to another.
* **`systemArraysCopyToExistingArray`**: This method uses the **`System.arraycopy`** method to copy the contents of one array to an existing array.
* **`loopCopyToExistingArray`**: This method uses a simple loop to copy the contents of one array to an existing array.
* **`arraysCopy`**: This method uses the **`Arrays.copyOf`** method to copy the contents of one array to another.

In the published example, only **`systemArraysCopyToExistingArray`** and **`loopCopyToExistingArray`** have active **`@Benchmark`** annotations. The other three annotations are commented out. Also, **`loopCopy`** allocates 30 elements for a 3,000-element source, so enabling it as written would exceed the destination's bounds. The source above is retained as published; it needs that correction before a five-method comparison can run.

The **`main`** method of the **`ArrayCopyBenchmarks`** class uses the **`runBenchmark`** method to run the benchmarks and display the results. When you run the program, JMH will execute each benchmark method several times and report the average execution time.

The original comparison did not include the raw JMH output, JDK and JMH versions, machine details, or run configuration. Without those records, this article cannot establish a performance ranking. Keep allocation and destination reuse separate when rerunning it, and report the uncertainty with the measured times.

The [System.arraycopy contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#arraycopy(java.lang.Object,int,java.lang.Object,int,int)) describes copying into an existing destination; it does not promise a universal speed advantage. The [JMH samples](https://github.com/openjdk/jmh/tree/master/jmh-samples/src/main/java/org/openjdk/jmh/samples) cover warmup, forks and benchmark design. Use the [Java Atlas](/java/100daysofjava/graph/) to follow the related JVM and performance investigations.
