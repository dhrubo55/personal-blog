+++
category = []
date = 2024-05-03T00:00:00Z
description = "Day 79: Did you know that too much print statement can cost you money"
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day79 "
summary = "Day 79: Like Python In java printing takes too much processing time which costs money"
title = "Day 79: Did you know that too much print statement can cost you money"
[cover]
alt = "day79"
caption = "day79"
image = ""
relative = false

+++

In this twitter post https://x.com/ekzhang1/status/1785886484140065087 the author saved $27000/year by removing 10 lines of code they were print() statements. So I just wondered as he did it for python does java printing causes lot of processing time? and if so how about writing the same string in a file. This question let me down a rabbit hole of how printing works in java


Many developers, especially those new to Java, often rely on `System.out.println()` for debugging and logging purposes. While this approach is convenient during development, it can become a performance hindrance in production environments, particularly when dealing with high-volume logging scenarios.

### The Problem with `System.out.println()`
---

The `System.out.println()` method is a synchronous operation that involves several steps:

1. **Acquiring a lock**: Before writing to the console, the method must acquire a lock on the `System.out` object to ensure thread safety.
2. **String concatenation**: If the argument passed to `println()` is not a string, it must be converted to a string using the `toString()` method, which can be a costly operation for complex objects.
3. **Writing to the console**: The actual writing of the string to the console stream occurs in this step.
4. **Flushing the stream**: After writing, the console stream is flushed to ensure that the data is immediately visible.
5. **Releasing the lock**: Finally, the lock on the `System.out` object is released.

While these steps may seem trivial, they can introduce significant overhead, especially when logging is performed extensively in performance-critical sections of the code.

Furthermore, If we look into why `System.out.println()` is slow we will find some stackoverflow discussion about it. From one of it's [discussion](https://stackoverflow.com/a/4437752/3088368) I came to know printing to the console (using println) is slow because of the operating system overhead, not the act of printing itself. They compare it to saving a file, which is similar speed. The slowdown comes from the console displaying characters one by one, including rendering fonts and potentially scrolling the screen.

Fortunately, Java provides more efficient alternatives for logging, including writing to files and using dedicated logging libraries like Log4j.

### Writing to a File

Writing log messages directly to a file can be more efficient than printing to the console. Here's an example code snippet:

```java
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;

public class FileLogger {
    private static final String LOG_FILE = "application.log";

    public static void main(String[] args) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(LOG_FILE, true))) {
            for (int i = 0; i < 1000000; i++) {
                writer.write("Hello World " + i + "\n");
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

In this example, we create a `BufferedWriter` to write log messages to a file named `application.log`. The `BufferedWriter` helps improve performance by buffering the data before writing it to the file. However, manually managing file I/O operations can be cumbersome and error-prone, especially in multithreaded environments.

### Using Log4j with Console Appender

Log4j is a widely-used logging library that provides a robust and configurable logging solution. Instead of writing directly to the console or a file, Log4j allows you to configure various appenders (output destinations) and log levels. Here's an example of using Log4j with a console appender:

```java
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Log4jExample {
    private static final Logger logger = LogManager.getLogger(Log4jExample.class);

    public static void main(String[] args) {
        for (int i = 0; i < 1000000; i++) {
            logger.info("Hello World " + i);
        }
    }
}
```

In this example, we use the `LogManager` class to obtain a `Logger` instance for the `Log4jExample` class. The `logger.info()` method is used to log messages at the INFO level. Log4j provides various log levels (e.g., DEBUG, INFO, WARN, ERROR) and allows you to configure the desired log level and appenders through configuration files or programmatically.

Log4j offers several advantages over `System.out.println()`:

- **Asynchronous logging**: Log4j can buffer log messages and write them asynchronously, reducing the impact on the main application thread.
- **Configurability**: Log4j allows you to configure various appenders (e.g., file, console, database), log levels, and formatting options.
- **Performance optimization**: Log4j employs techniques like message construction avoidance, which means that log messages are only constructed if they meet the configured log level, reducing unnecessary string operations.

Benchmarking with JMH
---

To put these claims to the test, we'll use the Java Microbenchmark Harness (JMH), a powerful tool for benchmarking Java code. Here's an example of how we can benchmark the three techniques discussed above:

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@State(Scope.Thread)
public class Day79 {
    private static final Logger logger = LogManager.getLogger(Day79.class);
    private static final String LOG_FILE = "logfile.txt";
    int numIterations = 100000;

    @Benchmark
    public void systemOutPrintln() {
        for (int i = 0; i < numIterations; i++) {
            System.out.println("Hello World!");
        }
    }

    @Benchmark
    public void writeToFile() throws IOException {
        try {
            Path path = Paths.get(LOG_FILE);
            Files.createFile(path);

            List<String> lines = new ArrayList<>(Collections.nCopies(numIterations, "Hello World"));

            Files.write(path, lines, StandardOpenOption.APPEND);

            System.out.println("File written successfully.");
        } catch (IOException e) {
            System.err.println("Error writing to file: " + e.getMessage());
        }
    }

    @Benchmark
    public void log4jConsoleAppender() {
        for (int i = 0; i < numIterations; i++) {
            logger.info("Hello World!");
        }
    }
}
```

In this example, we define three benchmark methods: `systemOutPrintln()`, `writeToFile()`, and `log4jConsoleAppender()`. Each method represents one of the logging techniques we want to benchmark.

The `@BenchmarkMode` annotation specifies that we want to measure the average time taken by each method. The `@OutputTimeUnit` annotation sets the time unit for the benchmark results to nanoseconds. Finally, the `@State(Scope.Thread)` annotation ensures that each benchmark method is executed in a separate thread.

After running the benchmark, we should see results similar to the following:

```
Run complete. Total time: 00:26:52
Benchmark                         Mode  Cnt     Score     Error  Units
Day79.log4jConsoleAppender  avgt   25     0.121 ±   0.004  ms/op
Day79.systemOutPrintln      avgt   25  4089.977 ± 417.122  ms/op
Day79.writeToFile           avgt   25     0.346 ±   0.071  ms/op
```

The results are given in milliseconds per operation (ms/op), which means how many milliseconds it takes on average to perform one operation. The lower the ms/op, the faster the operation.  
Day79.log4jConsoleAppender: This operation takes on average 0.121 ms/op. This is the fastest operation among the three.  
Day79.systemOutPrintln: This operation takes on average 4089.977 ms/op. This is significantly slower than the other two operations.  
Day79.writeToFile: This operation takes on average 0.346 ms/op. This is slower than log4jConsoleAppender but much faster than systemOutPrintln.  
The ± value represents the error in the measurement. It means the actual value could be within this range. For example, for writeToFile, the actual average could be between (0.346 - 0.071) and (0.346 + 0.071).

These results clearly show that `System.out.println()` is significantly slower than the Log4j console appender, and writing to a file is the slowest option among the three.

Conclusion
---

In this blog post, we explored the performance implications of using `System.out.println()` for logging in Java applications. We discussed more efficient alternatives, such as writing to files and using dedicated logging libraries like Log4j. Additionally, we provided benchmark results using JMH to demonstrate the performance differences between these techniques.

While `System.out.println()` may be convenient for simple debugging during development, it should be avoided in performance-critical scenarios or production environments. Instead, consider using a logging library like Log4j, which offers better performance, configurability, and flexibility.