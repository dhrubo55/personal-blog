+++
category = ["100DaysOfJava"]
date = 2022-11-11T00:00:00Z
description = "Generating Heap dumps programatically by using MBeanServer and PlatformBeans to get Management information from JVM"
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

With Java Management Extensions technology, a resource is represented by Managed Beans or mBeans.  These are registered on the mBean server. It is a core-managed object server  that acts as an agent and can be used on a majority of devices that  support Java.

In simpler terms, mBeans acts like Java wrappers for

1. services
2. components
3. devices
4. applications

in a distributed network.

MBean server provides the actual management, as it is where you would  find all the manageable resources. This server then becomes the central  focus of the architectural frame. which allow the server components to plug  in and find manageable objects.

A JMX agent, would consist of the mBean server, and the services needed to handle the mBeans (you’ll also want an APM solution  that includes application framework metrics like mBeans and performance  counters). This means that the resources are independent and apart from  the management infrastructure. while these resources are manageable no  matter how the management applications are deployed.

**So now by using these MBeans and MBeanServer's we can get many inforamtions about the JVM and the application that its hosting.**

### Doing Heap Dump Programatically

At first we need to call the `PlatformMBeanServer` to get the platform informations of JVM and then with those information need to access `HotSpotDiagnosticMXBean` whic is an Management Extension Bean different from typical MBean.

So let us understand what is and MXBean

#### MXBean

MXBeans are just a special kind of MBeans. The main difference is that MXBean restrict the data types, so that they are "more compatible" with potential clients.

As example: a MBean can expose attributes of a data type `Foo`. Now the client also needs to have this type `Foo` to make sense of the attribute.

The `MXBean` tries to restrict the data types to those `already available` e.g. - java.lang.* etc.

#### procedure

To extract a heap dump

1. At first need to get `PlatformMXBeanServer`.
2. From that need to get the specific MXBean in this case `HotSpotDiagnotsicMXBean`
3. As the procedure is not thread safe we need to sychronize it
4. Now we need to call the `dumpHeap` method on HotSpotDiagnotic
5. To call this method we need to pass file name (with `.hprof` extension) and boolean option to get information about live objects in the heap.
6. It will return the file in the specified locaiton

#### Code

```java
class Day60 {
    private static final String HotSpotBeanName = "com.sun.management:type=HotSpotDiagnostic";
    private static volatile HotSpotDiagnosticMXBean hotSpotDiagnosticMXBean;

    public static void main(String[] args) throws IOException {
        String timestamp = LocalDateTime.now().toString();
        System.out.println("Dumping heap");
        generateHeapDump("/home/mohibul/Documents/heapdump_"+timestamp+".hprof", true);
    }

    private static void generateHeapDump(String fileName, boolean isLive) throws IOException {
        if (hotSpotDiagnosticMXBean == null) {
            synchronized (Day60.class) {
                hotSpotDiagnosticMXBean = getHotSpotDiagnosticMXBean();
            }
        }

        hotSpotDiagnosticMXBean.dumpHeap(fileName,isLive);
    }

    private static HotSpotDiagnosticMXBean getHotSpotDiagnosticMXBean() throws IOException {
        MBeanServer mBeanServer = ManagementFactory.getPlatformMBeanServer();
        return ManagementFactory.newPlatformMXBeanProxy(mBeanServer, HotSpotBeanName, HotSpotDiagnosticMXBean.class);
    }
}
```