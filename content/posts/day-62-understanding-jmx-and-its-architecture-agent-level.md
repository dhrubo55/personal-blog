+++
category = []
date = 2022-11-29T00:00:00Z
description = "Understanding JMX architecture and how it works. In part 2 will learn about the second layer of JMX"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day62"
summary = "Understanding JMX and its architecture"
title = "Day 62: Understanding JMX and its architecture ( Agent Level )"
[cover]
alt = "day62"
caption = "day62"
image = ""
relative = false

+++
In part one we disscussed about JMX and its remote management layer. In this one we are going to understand its second layer which is Agent layer.

![](https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/JMX_Architecture.svg/400px-JMX_Architecture.svg.png)

### Agent Overview

A JMX agent is a standard management agent that directly controls resources. And it makes them available to remote management applications. A JMX agent is usually located on the same system as the resources that it controls, but this is not a need.

A JMX agent is a management entity that runs in a JVM and acts as the liaison between the managed beans (MBeans) and the management application. The various components of a JMX agent are outlined in the following sections:

1. MBean Server
2. Agent Services
3. Protocol Adaptors and Connectors

### MBean Server:

The MBean server AKA MBean Agent is the core component of a JMX agent. It’s a registry for objects in a JMX agent which does management operations. An object that registers with the MBean server is visible to management applications. The MBean server exposes only the management interface of an MBean.

Any resource that you want to manage from outside the agent’s JVM must be registered as an MBean with the server. The MBean server provides a standardized interface for accessing MBeans within the same JVM. Thus giving local objects all the benefits of manipulating manageable resources. MBeans can be instantiated and registered by:

* Another MBean
* The agent itself
* A remote management application

When you register an MBean, you must assign it a unique object name. A management application uses the object name to identify the object on which it is to perform a management operation. The operations available on MBeans include:

* Discovering the management interface of MBeans
* Reading and writing their attribute values
* Performing operations defined by the MBeans
* Getting notifications emitted by MBeans
* Querying MBeans by using their object name or their attribute values
* Architecture
* What is MBean
* MBean Server

### MBean

MBeans are managed beans, Java objects that represent resources to be managed. MBeans can be standard or dynamic. Standard MBeans are Java objects that conform to design patterns derived from the JavaBeans component model. Dynamic MBeans define their management interface at runtime.

There are two types of `MBeans`

1. Standard MBean
2. Dynamic MBean

A standard MBean exposes the resource to be managed directly through its attributes and operations. Attributes are exposed through "getter" and "setter" methods. Operations are the other methods of the class that are available to managers. All these methods are defined statically in the MBean interface and are visible to a JMX agent through introspection. This is the most straightforward way of making a new resource manageable.

A dynamic MBean is an MBean that defines its management interface at runtime. For example, a configuration MBean could determine the names and types of the attributes it exposes by parsing an XML file.

A JMX agent is a management entity that runs in a JVM and acts as the liaison between the managed beans (MBeans) and the management application. The various components of a JMX agent are outlined in the following sections:

1. MBean Server
2. Agent Services
3. Protocol Adaptors and Connectors

### MBean Server

The MBean server is the core component of a JMX agent. It’s a registry for objects in a JMX agent that are exposed to management operations. An object that is registered with the MBean server is visible to management applications. The MBean server exposes only the management interface of an MBean, never its direct object reference.

Any resource that you want to manage from outside the agent’s JVM must be registered as an MBean with the server. The MBean server provides a standardized interface for accessing MBeans within the same JVM, giving local objects all the benefits of manipulating manageable resources. MBeans can be instantiated and registered by:

1. Another MBean
2. The agent itself
3. A remote management application

When you register an MBean, `you must assign it a unique object name`. A management application uses the object name to identify the object on which it is to perform a management operation. The operations available on MBeans include:

1. Discovering the management interface of MBeans
2. Reading and writing their attribute values
3. Performing operations defined by the MBeans
4. Getting notifications emitted by MBeans
5. Querying MBeans by using their object name or their attribute values

### Agent Services

Agent services are objects that can perform management operations on the MBeans that registers with the MBean server. Agent services can be provided by MBeans as well, allowing them and their functionality to be controlled through the MBean server. Java Management Extensions (JMX) Specification, version 1.4 defines the following agent services:

* **Dynamic Class loader** : Dynamic class loading through the management service fetches and instantiates new classes and native libraries. That are dynamically downloaded from the network.
* **Monitors** : Monitors the numerical or string value of MBean attributes. They can notify other objects of several types of changes.

Timers: Timers provide a scheduling mechanism and can send notifications at predetermined intervals.

Relation service: The relation service lets the MBeans communicate with each other.

### Protocol Adaptors and Connectors

Protocol adaptors and connectors make agents accessible from remote management applications. They provide a view through a specific protocol of the MBeans that are instantiated and registered with the MBean server. They enable a management application outside the JVM to:

Get or set attributes of existing MBeans
Perform operations on existing MBeans
Instantiate and register new MBeans
Register for and receive notifications emitted by MBeans

Platform MBeans
A platform MBean (also called an MXBean) is an MBean for monitoring and managing the Java Virtual Machine (JVM).  Each MXBean encapsulates a part of JVM functionality such as the JVM's class loading system, JIT compilation system, garbage collector, and so on.  The java.lang.management package defines the platform MXBeans.

Table 1 lists all the platform MBeans and the aspect of the VM that they manage. Each platform MXBean has a unique javax.management.ObjectName for registration in the platform MBeanServer.  A JVM may have zero, one, or more than one instance of each MXBean, depending on its function, as shown in the table.

### Platform MBeans

| Interface | Manages | Object Name | Instances Per VM |
| --- | --- | --- | --- |
| ClassLoadingMXBean | Class loading system | java.lang:type=ClassLoading | One |
| CompilationMXBean | Compilation system | java.lang:type=Compilation | Zero or one |
| GarbageCollectorMXBean | Garbage collector | java.lang:type=GarbageCollector name=collectorName | One or more |
| MemoryManagerMXBean (sub-interface of GarbageCollectorMXBean) | Memory pool | java.lang:type=MemoryManager name=managerName | One or more |
| MemoryPoolMXBean | Memory | java.lang:type=MemoryPool name=poolName | One or more |
| MemoryMXBean | Memory system | java.lang:type=Memory | One |
| OperatingSystemMXBean | Underlying operating system | java.lang:type=OperatingSystem | One |
| RuntimeMXBean | Runtime system | java.lang:type=Runtime | One |
| ThreadMXBean | Thread system | java.lang:type=Threading | One |

### Platform MBean Server

The Platform MBean Server can be shared by different managed components running within the same Java Virtual Machine. You can access the Platform MBean Server with the method ManagementFactory.getPlatformMBeanServer(). The first call to this method, creates the platform MBeanServer and registers the platform MXBeans using their unique ObjectNames. Subsequently, it returns the initially created platform MBeanServer.

MXBeans that get created and destroyed dynamically, for example, memory pools and managers, will automatically be registered and deregistered into the platform MBeanServer.  If the system property `javax.management.builder.initial` is set, the platform MBeanServer creation will be done by the specified MBeanServerBuilder.

Use the platform MBeanServer to register other MBeans besides the platform MXBeans. This enables all MBeans to be published through the same MBeanServer and makes network publishing and discovery easier.

#### Now in this Java code we create a MBean and see it In visualVm

in step 1

lets create a `SystemStatusMBean` to get some system related information

```java
public interface SystemStatusMBean {
       Long uptime();
    }
```

