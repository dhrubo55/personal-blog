+++
category = []
date = 2022-12-14T00:00:00Z
description = "Using JMX to write an alert system for Java JVM OutOfMemory Error"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day63"
summary = "Using JMX to write an alert system for Java JVM OutOfMemory Error"
title = "Day 63: Alert system for Java OutOfMemory Error "
[cover]
alt = "day63"
caption = "day63"
image = ""
relative = false

+++
What is java out of memory error

when does it happens

what are the common things causes it

the alert system

`java.lang.OutOfMemoryError` exception  is thrown when there is insufficient space to allocate an object in the Java heap. In this case, The garbage collector cannot make space available to accommodate a new object, and the heap cannot be expanded further. Also, this error may be thrown when there is insufficient native memory to support the loading of a Java class. In a rare instance, a `java.lang.OutOfMemoryError` may be thrown when an excessive amount of time is being spent doing garbage collection and little memory is being freed.

When a `java.lang.OutOfMemoryError` exception is thrown, a stack trace is also printed. In that stack trace the cause are mentioned for easier fixing of the issue.

This exception will be thrown when

1. Memory Leak occurs
2. `Not enough heap` space to allocate objects
3. If `GC` is running all the time
4. Trying to allocate memory larger than the heap size
5. When Metaspace memory is full
6. When native memory is not enough to allocate

There are many more reasons OOM can occur. An OutOfMemoryError (OOME) is bad. It can happen at any time, with any thread. There is little that you can do about it, except to exit the program, change the -Xmx value, and restart the JVM. If you then make the -Xmx value too large, you slow down your application. The secret is to make the maximum heap value _the right size_, neither too small, nor too big. OOME can happen with any thread, and when it does, that thread typically dies. Often, there is not enough memory to build up a stack trace for the OOME, so you cannot even determine where it occurred, or why.

Once we have downcast the MemoryMXBean to a NotificationEmitter we can add a NotificationListener to the MemoryMXBean. You should verify that the notification is of type `MEMORY_THRESHOLD_EXCEEDED`. In our OOMAlterService we add listeners to implement the OOMAlertService.Listener interface, with one method alertMemoryLow(**long** usedMemory, **long** maxMemory) that will be called when the threshold is reached.

This notification will be emitted fast.Something to note is that the listener is being called by a special thread, called the `Low Memory Detector thread`, that is part of the standard JVM.

What is the threshold? And which of the many pools should we monitor? The only sensible pool to monitor is the Tenured Generation (Old Space). When you set the size of the memory with -Xmx256m, you are setting the maximum memory to be used in the Tenured Generation. Searching in findTenuredGenPool() method, and returning the first one that was of type HEAP to get the Tenured gen memory.

In  `setUsageThreshold(`**`double`**` threshold)` method, I specify when I would like to be notified. This threshold is a global setting. so only one usage threshold per Java Virtual Machine. The threshold value is used to calculate the usage threshold, based on the maximum memory size of the Tenured Generation pool (not the Runtime.getRuntime().maxMemory() value!).