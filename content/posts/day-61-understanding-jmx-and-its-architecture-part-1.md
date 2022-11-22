+++
category = []
date = 2022-11-15T00:00:00Z
description = "Understanding JMX architecture and how it works. In part 1 will learn about the first layer of JMX"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day61"
summary = "Understanding JMX and its architecture"
title = "Day 61: Understanding JMX and its architecture (Management Level) "
[cover]
alt = "day61"
caption = "day61"
image = ""
relative = false

+++
What is JMX

The Java Management Extensions (JMX) API is a standard for managing and monitoring applications and services.

It defines -

1\. management architecture

2\. design patterns

3\. APIs

4\. services

for building web-based, distributed, dynamic, and modular solutions to manage Java-enabled resources. The JMX APIs make it possible to add manageability to Java-enabled applications, from web phones to set-top boxes to network devices and servers.

The JVM gives you a set of MBeans through which you can access runtime data like **memory consumption**, **GC stats** and some more data. You can also invoke many operations. Your app server will also give you many MBeans which you can use to control the server and installed applications.

JMX overview

The JMX technology is native to the Java programming language.

The [java.lang.management](https://docs.oracle.com/javase/1.5.0/docs/api/java/lang/management/package-summary.html) package provides the interface for monitoring and managing the JVM.

The API provides access to information such as:

* Number of classes loaded and threads running
* Virtual machine uptime, system properties, and JVM input arguments
* Thread state, thread contention statistics, and stack trace of live threads
* Memory consumption
* Garbage collection statistics
* Low memory detection
* On-demand deadlock detection
* Operating system information

The API includes [logging monitoring and management](https://docs.oracle.com/javase/1.5.0/docs/guide/management/overview.html#loggingmxbean) capabilities. The [java.util.logging.LoggingMXBean](https://docs.oracle.com/javase/1.5.0/docs/api/java/util/logging/LoggingMXBean.html) interface provides for management of the logging facility.

As a result, it offers natural, efficient, and lightweight management extensions to Java-based apps. It consists of a set of specifications and development tools for managing Java environments and developing state-of-the-art management solutions for applications and services. It provides Java developers with the means to instrumet Java code, create smart Java agents, implement distributed management middleware and managers, and integrate these solutions into existing management and monitoring systems (eg. APM)

 The dynamics of the JMX technology architecture enables you to use it to monitor and manage resources as they are implemented and installed. It can also be used to monitor and manage the [Java Virtual Machine (JVM machine)](https://www.oracle.com/technical-resources/articles/javase/jmx.html#jvm).

JMX's layerd architecture

First layer

First layer details

how to connect to jvisualvm

what metrics it show's 

how 