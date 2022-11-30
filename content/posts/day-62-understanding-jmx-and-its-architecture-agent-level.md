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
Agent Overview

A JMX agent is a standard management agent that directly controls resources. And it makes them available to remote management applications. A JMX agent is usually located on the same system as the resources that it controls, but this is not a need.

A JMX agent is a management entity that runs in a JVM and acts as the liaison between the managed beans (MBeans) and the management application. The various components of a JMX agent are outlined in the following sections:

1. MBean Server
2. Agent Services
3. Protocol Adaptors and Connectors

MBean Server:

The MBean server is the core component of a JMX agent. It’s a registry for objects in a JMX agent which does management operations. An object that registers with the MBean server is visible to management applications. The MBean server exposes only the management interface of an MBean.

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