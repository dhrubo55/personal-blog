+++
category = []
date = 2024-01-02T00:00:00Z
description = "Java Buffered Reader and why we need to close and what will happend if we dont"
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day75"
summary = "Java Buffered Reader and why we need to close and what will happend if we dont"
title = "Day 75: Java BufferedReader: Do We Know Why We Need To Close It?"
[cover]
alt = "day75"
caption = "day75"
image = ""
relative = false

+++


In this blog post, I will shine a spotlight on the significance of closing a Java BufferedReader after its creation, exploring the inner workings of BufferedReader, its implications, and offering practical insights to enhance your coding practices.

### Understanding BufferedReader:

Java's BufferedReader class is a versatile tool for efficient reading of text from a character-based input stream. One of its defining features is the ability to buffer input, enhancing performance by reducing the number of I/O operations. While it offers enhanced reading capabilities, developers must exercise caution, ensuring that the BufferedReader is closed once its purpose is served.

### The Consequences of Neglecting Closure:

Failing to close a BufferedReader can lead to resource leaks and adverse consequences for your application. Java's garbage collector is responsible for reclaiming resources, but it may not be immediate or deterministic. A resource leak can accumulate over time, impacting the overall performance and reliability of your application. Furthermore, in scenarios where the code interacts with external systems or files, leaving the BufferedReader unclosed can lead to file locks and other resource contentions, causing unintended issues.

**Performance Issues:**

1. **Memory Usage:** An unclosed `BufferedReader` can lead to increased memory usage over time. The buffer associated with the reader retains resources until the garbage collector decides to reclaim them. In the absence of explicit closure, these resources may persist longer than necessary, contributing to higher memory consumption.

	Now let us see a code example where not closing the BufferedReader can cause high memory usage. 
	```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class Day75 {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new FileReader("sample.txt"));
        StringBuilder content = new StringBuilder();

        String line;
        while ((line = bufferedReader.readLine()) != null) {
            content.append(line).append(System.lineSeparator());
        }

        // Imagine forgetting to close the BufferedReader
        // bufferedReader.close(); // Uncommenting this line is crucial

        // Do something with the content, if needed
        System.out.println("File Content:\n" + content.toString());
    }
}

	```
	In this example we can see that after reading from the file if we dont close the buffered reader it will keep the reference of the buffered reader from getting garbage collected and thus will have the allocated memory intact, though we dont need the file data and buffered reader instance memory.

2. **File Descriptor Exhaustion:**  
	Let us first understand what a file descriptor is. 
	
	#### File Descriptor : 
	A file descriptor is a low-level integer value that uniquely identifies an open file within a process in a Unix-based operating system. It serves as a handle or reference to an open file or I/O resource, and it is used by the operating system to keep track of various properties and status information associated with the file.

	 File descriptors are represented as non-negative integers. Standard input, output, and error have the file descriptor values 0, 1, and 2, respectively. Additional file descriptors are typically assigned starting from 3 and incrementing for each new open file.

	In Java, while the concept of file descriptors exists at the operating system level, Java itself abstracts many details through higher-level constructs like streams and readers/writers. When working with Java's I/O classes, you often don't directly deal with file descriptors, but the underlying operating system still manages them behind the scenes
	
	When dealing with file-based input streams, each open file consumes a file descriptor. Failing to close a `BufferedReader` means leaving file descriptors unclosed. In scenarios where the application handles a large number of files or operates for an extended period, this can result in file descriptor exhaustion. Once the system runs out of available file descriptors, it may fail to open new files, causing unexpected errors and disruptions.

	Now let us see a code example for this 

	```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class Day75 {

    public static void main(String[] args) {
        for (int i = 1; i <= 1000; i++) {
            readFromFile("file" + i + ".txt");
        }
    }

    private static void readFromFile(String filePath) {
        BufferedReader bufferedReader = null;
        try {
            bufferedReader = new BufferedReader(new FileReader(filePath));

            String line;
            while ((line = bufferedReader.readLine()) != null) {
                // Process the content (in this example, we are just printing it)
                System.out.println(line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            // Missing: Properly close the BufferedReader
            // Uncomment the following line to avoid file descriptor exhaustion
            // try { bufferedReader.close(); } catch (IOException e) { e.printStackTrace(); }
        }
    }
}

```

	In this example:

 The `main` method iterates over a range of file names (e.g., "file1.txt", "file2.txt", ..., "file1000.txt").
 
 The `readFromFile` method is responsible for reading the content from each file using a `BufferedReader`.
 
 The `BufferedReader` is not properly closed in the `finally` block, simulating a scenario where developers forget to close the resource.

	To see the impact of file descriptor exhaustion, you can run this program in an environment where there is a limit on the number of allowed open file descriptors. After running for some time, the program may encounter issues due to the exhaustion of file descriptors.

	To avoid file descriptor exhaustion, it's crucial to close resources properly. Uncommenting the `bufferedReader.close();` line in the `finally` block ensures that the file descriptor associated with each `BufferedReader` is released after reading from the file.
	
3. **Resource Contention:** In cases where the code interacts with external resources, such as databases or network connections, leaving the `BufferedReader` unclosed can lead to resource contention. This occurs when the resources are not released promptly, and subsequent operations may be delayed or blocked due to the lingering open connections.
	
	Resource contention occurs in computing when multiple processes or threads compete for access to a shared resource, and this competition leads to delays, reduced performance, or potential deadlocks. A shared resource can be any entity that is accessed or modified by multiple concurrent operations, such as files, database connections, network sockets, or even sections of memory.

	Now let us see a code example 

	```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class Day75 {

    private static final String FILE_PATH = "shared-file.txt";

    public static void main(String[] args) {
        // Create two threads that read from the same file
        Thread thread1 = new Thread(() -> readFromFile());
        Thread thread2 = new Thread(() -> readFromFile());

        // Start the threads
        thread1.start();
        thread2.start();
    }

    private static void readFromFile() {
        BufferedReader bufferedReader = null;

        try {
            bufferedReader = new BufferedReader(new FileReader(FILE_PATH));

            String line;
            while ((line = bufferedReader.readLine()) != null) {
                // Simulate reading from the file (e.g., processing the line)
                System.out.println(Thread.currentThread().getName() + ": " + line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            // Missing: Properly close the BufferedReader
            // Uncomment the following line to avoid resource contention
            // try { bufferedReader.close(); } catch (IOException e) { e.printStackTrace(); }
        }
    }
}

```

    The `main` method creates two threads (`thread1` and `thread2`) that concurrently attempt to read from the same file (`shared-file.txt`).

	The `readFromFile` method is responsible for reading the content from the file using a `BufferedReader`.
	
	The `BufferedReader` is not properly closed in the `finally` block, simulating a scenario where developers forget to close the resource, leading to resource contention.

	To observe the resource contention, run this program and observe the empty output from both threads. Uncommenting the `bufferedReader.close();` line in the `finally` block ensures that the resource contention is mitigated by properly closing the `BufferedReader`. Without proper closure, multiple threads may interfere with each other, leading to unpredictable and undesirable outcomes.

**Resource Leaks:**

1. **File Locks:** When reading from files, especially in a multi-threaded environment, failing to close a `BufferedReader` can result in file locks not being released. This is critical because file locks prevent other processes or threads from accessing the file. Over time, accumulating file locks due to unclosed readers can lead to contention and potential deadlock situations.

	In the above example of Resource contention can generate file locks that will prevent other instances of buffered reader to get the file to read.
	
2. **Network Resource Leaks:** When dealing with network-related input streams, such as reading from a URL, leaving the `BufferedReader` unclosed can result in resource leaks in the network stack. This may lead to issues such as connection leaks, where network resources are not released promptly, affecting the application's ability to establish new connections.

	Now let us see a code example for this

	```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;

public class NetworkResourceLeakExample {

    private static final String URL_STRING = "https://www.example.com";

    public static void main(String[] args) {
        // Create two threads that read from the same URL
        Thread thread1 = new Thread(() -> readFromURL());
        Thread thread2 = new Thread(() -> readFromURL());

        // Start the threads
        thread1.start();
        thread2.start();
    }

    private static void readFromURL() {
        BufferedReader bufferedReader = null;

        try {
            URL url = new URL(URL_STRING);
            bufferedReader = new BufferedReader(new InputStreamReader(url.openStream()));

            String line;
            while ((line = bufferedReader.readLine()) != null) {
                // Simulate reading from the URL (e.g., processing the line)
                System.out.println(Thread.currentThread().getName() + ": " + line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            // Missing: Properly close the BufferedReader
            // Uncomment the following line to avoid network resource leak
            // try { bufferedReader.close(); } catch (IOException e) { e.printStackTrace(); }
        }
    }
}
	
	```


The `main` method creates two threads (`thread1` and `thread2`) that concurrently attempt to read from the same URL (`https://www.example.com`).

The `readFromURL` method is responsible for reading the content from the URL using a `BufferedReader`.

The `BufferedReader` is not properly closed in the `finally` block, simulating a scenario where developers forget to close the resource, leading to a potential network resource leak.

To observe the potential network resource leak, run this program and observe the interleaved output from both threads. Uncommenting the `bufferedReader.close();` line in the `finally` block ensures that the network resource leak is mitigated by properly closing the `BufferedReader`. Without proper closure, multiple threads may interfere with each other, leading to unpredictable and undesirable outcomes when reading from the shared network resource.

In essence, proper closure of the `BufferedReader` is essential for efficient resource management. By closing the reader explicitly, developers release system resources promptly, preventing memory bloat, file descriptor exhaustion, and resource contention. Failure to do so can lead to a cascade of performance issues and resource leaks that, although subtle, can have a significant impact on the reliability and efficiency of the Java application over time.