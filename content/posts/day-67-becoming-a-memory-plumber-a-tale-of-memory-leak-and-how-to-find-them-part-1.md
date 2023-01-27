+++
category = ["100DaysOfJava"]
date = 2023-01-21T00:00:00Z
description = "Finding memory leak by analyzing GC and memory dump using VisualVM and Eclipse MAT "
draft = true
showtoc = true
slug = "/java/100DaysOfJava/day67"
summary = "Understanding and finding the causes and types of memory leaks and tools and suggestions to fix them"
title = "Day 67: Becoming a memory plumber; A tale of Memory Leak and how to find them ( part 1)"
[cover]
alt = "day67"
caption = "day67"
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

previous post breifly discussed about few types of memory leaks. In todays post going to further discuss about six other scenarios which can cause memory leaks. They are

1. Unclosed resource
2. custom equals and hashcode implementation
3. Inner class that references outer classes
4. Finalization bug
5. Interned strings
6. Thread local

#### Unclosed Resources

Unclosed resource memory leak in Java occurs when an application fails to release resources such as file handles, sockets, and database connections after they are no longer needed. These unclosed resources can remain allocated for extended periods of time resulting in a gradual buildup of system memory. This type of leak is particularly dangerous because it often goes unnoticed until the system runs out of available RAM or disk space. 

Java developers must be aware that any code which opens external resources such as files or databases should ensure that these are properly closed once their use has concluded. Failure to do so will result in a slow but steady increase in the amount of used memory on the system over time which can eventually lead to performance issues or even complete failure due to lack of available RAM and/or disk space on the machine hosting your application's process(es).

#### Custom .equals() and .hashCode() implementation 

Custom .equals() and .hashCode() implementation can cause memory leaks in Java due to the way they are used. When a class implements these methods, it is responsible for managing its own state and ensuring that all objects of the same type have unique references. If this is not done properly, an object can be created but never garbage collected because it will always exist as a reference from another object or collection. This leads to more objects staying in memory than necessary which causes a gradual increase in system resources over time until eventually there is no longer enough available for other tasks leading to poor performance or even crashing of the application. 

Let's see an example scenario, In HashSet and HashMap `.equals()` and `.hashCode()`uses these methods in many operations, and if they're not overridden correctly, they can become a source for potential memory leak problems.

```java
class SaleResult {
	int saleCount;
    booelan isSuccess;
    
    public SaleResult(int saleCount, boolean isSuccess) {
    	this.saleCount = saleCount;
        this.isSuccess = isSuccess;
    }
}
```
now if we set this object as key in a hashmap or hashset and if a string id for value of the cusomterId we would need to ensure they are unique as HashMap and HashSet dont allow duplicate keys.

```java

```

### Analyze for finding Memory leaks

In order analyze whether your program contains any potential Memory Leaks you will need some kind specialized tools like HeapHero , JProfiler , VisualVM etc., these allow you view what exactly happening under hood during runtime & identify problematic areas ahead time before problems start manifesting themselves on production environment

### Steps to prevent Memory leaks

To prevent Memory Leaks occurring its important ensure all resources get closed properly at end each operation ; try avoid creating too many temporary variables unnecessarily & keep track object lifetime create them only necessary basis then dispose off quickly once done with it ; finally make sure Garbage Collector running correctly so old unused objects get cleared up regularly thus freeing up valuable system resources

### Memory leak issue i faced in my work