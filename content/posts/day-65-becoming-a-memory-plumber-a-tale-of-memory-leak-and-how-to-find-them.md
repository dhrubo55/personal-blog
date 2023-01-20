+++
category = []
date = 2023-01-05T00:00:00Z
description = "Finding memory leak by analyzing GC and memory dump using VisualVM and Eclipse MAT "
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day66"
summary = "Understanding and finding the causes and types of memory leaks and tools and suggestions to fix them"
title = "Day 65: Becoming a memory plumber; A tale of Memory Leak and how to find them ( part 1)"
[cover]
alt = "day65"
caption = "day65"
image = ""
relative = false

+++
1. What is memory leak
2. What problems it causes
3. Types
4. Analyzing tools
5. What to analyze and how
6. What can we do to prevent it
7. conclusion with example

What is memory leak

Memory leaks are a major issue for software engineers, especially those working with Java. A memory leak occurs when an application continues to use more and more of the computer's RAM without releasing it after it has been used. This can cause serious performance issues as the available RAM decreases and eventually leads to system crashes or outages.

Java has automated memory management system unlike its predecessor C . Java does this using GC. The GC implicitly takes care of allocating and freeing up memory, and thus is capable of handling the majority of memory leak issues.

While the GC effectively handles a good amount of memory, it doesn't guarantee a foolproof solution to memory leaking. The GC is pretty smart, but not flawless. Memory leaks can still happen.

Now let us understand what is Memory Leak

### Memory Leak

a memory leak is a type of resource leak that occurs when a computer program incorrectly manages memory allocations in a way that memory which is no longer needed is not released.

As a software engineer, it’s important to understand the concept of memory leaks in Java. A memory leak is when an application continues to hold onto memory that it no longer needs and this can lead to performance issues or even system crashes. In Java, a common cause of such leaks is objects not being garbage collected as expected due to references still pointing at them from other parts of the code.

When an object is created in Java, the JVM (Java Virtual Machine) allocates space for it on the heap and then assigns a reference variable which points towards that allocated space. As long as there are any active references pointing towards this object, it will remain alive on heap until all these references are removed and GC (Garbage Collector) reclaims its resources back from Heap Memory Pool. If somehow some reference(s) remains active even after they have been used up by program logic then those objects become eligible for Garbage Collection but never get collected since their respective reference variables still point at them causing unnecessary accumulation of unused/unrequired Objects over time resulting into what we call “Memory Leak” issue with our Application Codebase leading into Performance Degradation & System Crashes eventually!

To avoid such problems one should keep track if their code has any potential chances where Object References might be left dangling without getting released explicitly using null assignments or try-catch blocks etc., so that GC can reclaim those resources back once they become eligible otherwise Memory Leaks would continue accumulating over time leading us into trouble!

### What problems it causes

Memory leaks in Java can be caused by a variety of factors such as incorrect garbage collection, resource leakage in APIs, unclosed streams or connections, poor coding practices etc. These issues can lead to decreased responsiveness from applications due to increased latency times; they may also result in OutOfMemoryError exceptions being thrown which causes applications to crash unexpectedly or become unstable over time due their inability handle large amounts of data efficiently anymore .

### Types of Memory Leaks

There are many ways memory leaks can occur in a java program. Some of them are

1. Static fields
2. Loitering objects
3. In memory cache not evicted
4. Unclosed resource
5. custom equals and hashcode implementation
6. Inner class that references outer classes
7. Finalization bug
8. Interned strings
9. Thread local


now let us understand these typical memory leak issues

#### static fields
 heavy use of static variables can cause memory leaks. In Java, static fields have a lifetime that usually matches the entire lifetime of the running program / application (unless ClassLoader becomes eligible for garbage collection).
 
lets see a case 

```java
public class Day65 {
    public static List<String> strings = new ArrayList<>();

    public void add() {
        for (int i = 0; i < 100000; i++) {
            list.add(new String());
        }
        System.out.println("check point add");
    }

    public static void main(String[] args) {
        System.out.println("Beforee calling add");
        new Day65().populateList();
        System.out.println("After calling add");
    }
}
```

here when observing with 

#### Loitering Objects

These objects are allocated memory, but not used, and not garbage collected. These keep increasing the size of the JVM heap and represent memory leaks, which can cause an out-of-memory error or excessive overhead on the garbage collector.

Let's understand this scenario with an example


### Analyze for finding Memory leaks

In order analyze whether your program contains any potential Memory Leaks you will need some kind specialized tools like HeapHero , JProfiler , VisualVM etc., these allow you view what exactly happening under hood during runtime & identify problematic areas ahead time before problems start manifesting themselves on production environment

### Steps to prevent Memory leaks

To prevent Memory Leaks occurring its important ensure all resources get closed properly at end each operation ; try avoid creating too many temporary variables unnecessarily & keep track object lifetime create them only necessary basis then dispose off quickly once done with it ; finally make sure Garbage Collector running correctly so old unused objects get cleared up regularly thus freeing up valuable system resources

### Memory leak issue i faced in my work