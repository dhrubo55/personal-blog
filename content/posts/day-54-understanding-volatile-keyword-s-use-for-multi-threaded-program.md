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
### Understanding Processor Caching

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

In a recent comment of mine on this [question](https://www.linkedin.com/feed/update/urn:li:activity:6965702117483307008/?commentUrn=urn%3Ali%3Acomment%3A(activity%3A6965702117483307008%2C6972607832986644480)&dashCommentUrn=urn%3Ali%3Afsd_comment%3A(6972607832986644480%2Curn%3Ali%3Aactivity%3A6965702117483307008)) made in linkedin answered the question and now will try to expand on that. In the comment i have mentioned increment operation is not thread safe. As a simple `mutableNumber++` is broken into 3 steps.

1. Reading the current value from memory
2. Update the value by adding 1 with it
3. Write the value in memory

So while doing these operations threads context can switch and can cause issues for the thread who is trying to read the value while it wasnt fully committed yet in the memory by another thread. In this case the operations needs to be `Atomic` or the incrementing operation be behind a lock.

### Atomicity

**Atom** comes from greek `atomos` = `uncuttable`, and has been used in the sense `indivisible smallest unit`. In concurrent programming, it means that **there will be no context switch during it - nothing can affect the execution of atomic command.

On a single-processor machine, that's a stronger guarantee than you need. On a multi-processor machine, it isn't strong enough. **What atomic really means is, no other thread will be able to see the operation in a partially-completed state

Now to achieve the solution of the above mentione problem we can you solutions

1. Using synchronize
2. Using AtomicDouble
3. Using AtomicFieldUpdater (Field Updater classes can be used to perform atomic operation on a selected volatile field of a selected class.  
   `AtomicReferenceFieldUpdater`, `AtomicIntegerFieldUpdater`, and `AtomicLongFieldUpdater` are reflection-based utilities that provide access to the associated field types)