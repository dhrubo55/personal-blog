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
