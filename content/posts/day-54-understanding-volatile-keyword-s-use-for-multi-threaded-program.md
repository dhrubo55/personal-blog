+++
category = []
date = 2022-09-01T00:00:00Z
description = "Understanding volatile keyword's use in incrementing a double variable and see how it behaves in multi threaded env"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day54"
summary = "Understanding volatile keyword's use in incrementing a double variable and see how it behaves in multi threaded env"
title = "Day 54: Understanding volatile keyword's use for Multi Threaded program"
[cover]
alt = "Day54"
caption = "Day54"
image = ""
relative = false

+++
1. how java stores a object
2. obj or primitive level caching
3. how variables are cached in cpu cache / memory
4. what does volatile do in this case

### What is V

Processors execute program instructions. So, they need to retrieve both the program instructions and required data from RAM.As CPU's are capable of carrying out a significant number of instructions per second (IOPS), fetching from RAM isn't that ideal for them. As its an expensive call. So to mitigate this issue there are some techniques and `caching` is one of them.

Here in the below diagram we can see that each core of a processor have two level cache (L1, L2) and in L1 there is both `Data` and `Instruction` cache. Where the data and instructions are copied for processing. As different cores execute more instructions and manipulate more data, they fill up their caches with more relevant data and instructions.

![cpu](https://www.baeldung.com/wp-content/uploads/2017/08/cpu.png "Cpu Cache")

Source: Baeldung

Simply it would be best to think about what would happen if a thread changes a cached value and at the same time other thread trying to read it

### What is Volatile

First for understanding `volatile` lets understand what is non-volatile varialbe. Non volatile variables have no particular guarantee when JVM  will read data from the main memory into cpu caches or when will cpu caches writes those data in main memory. This particular issue can cause lots of issues.

Simplest example would be something like incrementing a number.

```java
public class SharedClass {

    public double mutableNumber = 3.141529;

}
```

`Thread 1` increments the `mutableNumber` variable, but both `Thread 1` and `Thread 2` may read the mutableNumber variable.

In this case mutableNumber variable is not declared volatile so there is no guarantee about when the value of the counter variable is written from the CPU cache back to main memory. This means, that the mutableNumber variable value in the CPU cache may not be the same as in main memory.

Its not guaranteed when cpu cache will write to memory or vice versa no thread is sure about the state of mutableNumber. Thus having a visibility issue. This is called [Visibility Problem](https://wiki.sei.cmu.edu/confluence/display/java/Concurrency%2C+Visibility%2C+and+Memory)

The Java **volatile** keyword is intended to address variable visibility problems. By declaring the mutableNumber variable volatile, all writes to the mutableNumber variable will be written back to main memory immediately. Also, all reads of the mutableNumber variable will be read directly from main memory.

```java
public class SharedClass {

    public volatile double mutableNumber = 3.141529;

}
```

Declaring a variable volatile thus guarantees the visibility for other threads of writes to that variable.

In the scenario given above, where `Thread 1` modifies the value, and another `Thread 2` reads the value **(but never modifies it)**, declaring the mutableNumber variable volatile is enough to guarantee visibility for Thread 2 of writes to the variable.


### Where Volatile is Not Enough:

If, however, both `Thread 1` and `Thread 2` were incrementing the variable, then declaring the variable volatile would not have been enough.

In a recent comment of mine on this question made in linkedin