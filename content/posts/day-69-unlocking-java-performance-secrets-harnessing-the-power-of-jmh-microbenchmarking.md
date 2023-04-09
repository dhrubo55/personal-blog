+++
category = ["100DaysOfJava"]
date = 2023-04-05T00:00:00Z
description = "Exploring benchmarking harness in Java and how its use to understand performance"
draft = true
showtoc = true
slug = "/java/100DaysOfJava/day68"
summary = "Exploring benchmarking harness in Java and how its use to understand performance"
title = "Day 69 : Unlocking Java Performance Secrets: Harnessing the Power of JMH Microbenchmarking"
[cover]
alt = "day69"
caption = "day69"
image = ""
relative = false

+++
Java Microbenchmark Harness (JMH) is a Java library used to measure the performance of Java code snippets, methods, and classes. It is a useful tool for developers who want to optimize their Java applications, identify performance bottlenecks, and compare the performance of different implementations.

JMH provides a simple API for developers to write benchmarks and test their performance. In this blog post, we will explore the basics of JMH and how to write and run benchmarks using JMH.

### Setting up JMH

Before we dive into writing benchmarks, we need to set up JMH in our project. JMH can be easily added to your project by adding the following dependency to your Maven or Gradle build file:

    <!-- Maven dependency -->
    <dependency>
        <groupId>org.openjdk.jmh</groupId>
        <artifactId>jmh-core</artifactId>
        <version>1.34</version>
    </dependency>
    
    <!-- Gradle dependency -->
    compile 'org.openjdk.jmh:jmh-core:1.34'

### Writing a simple benchmark

To write a benchmark using JMH, we need to create a class and annotate it with **`@BenchmarkMode`**, **`@OutputTimeUnit`**, and **`@State`** annotations. The **`@BenchmarkMode`** annotation specifies the benchmark mode, the **`@OutputTimeUnit`** annotation specifies the time unit to use for reporting, and the **`@State`** annotation specifies the state of the benchmark.

Here is an example of a simple benchmark that measures the performance of adding two integers:

    import org.openjdk.jmh.annotations.Benchmark;
    import org.openjdk.jmh.annotations.BenchmarkMode;
    import org.openjdk.jmh.annotations.Mode;
    import org.openjdk.jmh.annotations.OutputTimeUnit;
    import org.openjdk.jmh.annotations.State;
    import org.openjdk.jmh.annotations.Scope;
    
    import java.util.concurrent.TimeUnit;
    
    @State(Scope.Thread)
    @BenchmarkMode(Mode.AverageTime)
    @OutputTimeUnit(TimeUnit.NANOSECONDS)
    public class AddBenchmark {
        private int a = 1;
        private int b = 2;
    
        @Benchmark
        public int add() {
            return a + b;
        }
    }

In this benchmark, we have annotated the class with **`@State(Scope.Thread)`** to indicate that the state of the benchmark is local to each thread, **`@BenchmarkMode(Mode.AverageTime)`** to indicate that we want to measure the average time taken by the benchmark, and **`@OutputTimeUnit(TimeUnit.NANOSECONDS)`** to indicate that we want to report the results in nanoseconds.

The benchmark method is annotated with **`@Benchmark`**, which indicates that this is the method that we want to measure. In this case, we are measuring the time taken to add two integers.

Running a benchmark

To run a benchmark, we can create an instance of the **`org.openjdk.jmh.runner.Runner`** class and pass it the class that contains the benchmark. Here is an example of how to run the **`AddBenchmark`** class we just created:

    import org.openjdk.jmh.runner.Runner;
    import org.openjdk.jmh.runner.RunnerException;
    import org.openjdk.jmh.runner.options.Options;
    import org.openjdk.jmh.runner.options.OptionsBuilder;
    
    public class Main {
        public static void main(String[] args) throws RunnerException {
            Options options = new OptionsBuilder()
                    .include(AddBenchmark.class.getSimpleName())
                    .build();
            new Runner(options).run();
        }
    }

In this example, we have created an instance of the **`OptionsBuilder`** class and used it to specify the benchmark class that we want to run. We then create an instance of the **`Runner`** class and pass it the options we just created.