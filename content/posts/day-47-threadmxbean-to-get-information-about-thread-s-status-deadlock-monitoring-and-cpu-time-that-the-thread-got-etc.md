+++
category = []
date = 2022-03-28T00:00:00Z
description = "Using ThreadMXBean get thread execution and monitoring related information for running threads in jvm"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day47"
summary = "Using ThreadMXBean get thread execution and monitoring related information for running threads in jvm"
title = "Day 47: ThreadMXBean to get information about thread's status, deadlock monitoring and cpu time that the thread got etc."
[cover]
alt = "Day 47"
caption = "Day 47"
image = ""
relative = false

+++
MXBean:

Java Management Extension  or JMX framwork provides an easily configurable, scalable, reliable and more or less friendly infrastructure for managing Java application either locally or remotely. The framework introduces the concept of MBeans for real-time management of applications.

An MXBean is **a type of MBean that references only a predefined set of data types**. In this way, you can be sure that your MBean will be usable by any client, including remote clients, without any requirement that the client have access to model-specific classes representing the types of your MBeans

ThreadMXBean:

The management interface for the thread system of the Java virtual machine.

A Java virtual machine has a single instance of the implementation class of this interface. This instance implementing this interface is an [MXBean](https://docs.oracle.com/javase/8/docs/api/java/lang/management/ManagementFactory.html#MXBean) that can be obtained by calling the [`ManagementFactory.getThreadMXBean()`](https://docs.oracle.com/javase/8/docs/api/java/lang/management/ManagementFactory.html#getThreadMXBean--) method or from the [`platform MBeanServer`](https://docs.oracle.com/javase/8/docs/api/java/lang/management/ManagementFactory.html#getPlatformMBeanServer--) method.

Using `ThreadMXBean` we can get information about 

* Dumping all live threads and their stack trace
* Finding deadlock threads those are waiting to get monitors / ownable synchronizes
* Thread count for live daemon / non daemon threads
* If cpu thread time and user thread time and `Thread Contention` Monitoring supported

So now using `ThreadMXBean` get thread count, currentThreadCpuTime, currentThreadUserTime

    class Day47 {
        public static void main(String[] args) {
            ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
            System.out.println("Thread count is "+threadMXBean.getThreadCount());
            System.out.println("Current Thread CPU time "+TimeUnit.MILLISECONDS.convert(threadMXBean.getCurrentThreadCpuTime(),TimeUnit.NANOSECONDS));
            System.out.println(MessageFormat.format("Current Thread User time {0} ",TimeUnit.MILLISECONDS.convert(threadMXBean.getCurrentThreadUserTime(),TimeUnit.NANOSECONDS));
    
            List<ThreadInfo> threadInfos = List.of(threadMXBean.dumpAllThreads(true, true));
            for (ThreadInfo threadInfo: threadInfos) {
                System.out.println(MessageFormat.format("Thread Name is {0} | Thread id -> {1}",threadInfo.getThreadName(),threadInfo.getThreadId()));
            }
        }
      }