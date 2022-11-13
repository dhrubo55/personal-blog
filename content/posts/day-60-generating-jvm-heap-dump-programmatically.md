+++
category = ["100DaysOfJava"]
date = 2022-11-11T00:00:00Z
description = "Generating Heap dumps programatically by using MBeanServer and PlatformBeans to get Management information from JVM"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day60"
summary = "Generating JVM heap dump using PlatformMBeanServer"
title = "Day 60: Generating JVM heap dump programmatically "
[cover]
alt = "day60"
caption = "day60"
image = ""
relative = false

+++
What is Heap 
What is Used For
Why dump it
What is JMX
What is MBeanServer and MBean
Process of calling api to get HeapDump
Arguments of the api desigend


### Heap in JVM

At first before we dump the heap we should unnderstand what is the Heap and why should we dump it. In JVM The Java heap is the area of memory used to store objects instantiated by applications running on the JVM. When the JVM is started, heap memory is created and any objects in the heap can be shared between threads as long as the application is running. The size of the heap can vary, so many users restrict the Java heap size to 2-8 GB in order to minimize garbage collection pauses.

### Why dump Heap Memory

A heap dump is a snapshot of all the objects that are in memory in the JVM at a certain moment. They are very useful to troubleshoot memory-leak problems and optimize memory usage in Java applications.

Heap dumps are usually stored in `binary format hprof files`. We can open and analyze these files using tools like `JVisualVM` and `Eclipse Memory Analyzing Tool`

To generate a heap dump we first need to get a connection to heap and then create the heap dump file. So to that we need the help of java's `JMX` framework.

### What is JMX

Java Management Extensions (JMX) is a standard component of the Java Platform.  It was first added to the J2SE 5.0 release. It is a set of  specifications used for network and application management. It specifies  a method for developers to integrate the applications they are working  on with their network management software by assigning Java objects with  management attributes.

JMX gives developers a standard and simple way to manage resources. Including services, devices, and applications. It is dynamic, making it  possible to manage and monitor resources as soon as they are created,  implemented or installed.

### What is MBean and MBeanServer






