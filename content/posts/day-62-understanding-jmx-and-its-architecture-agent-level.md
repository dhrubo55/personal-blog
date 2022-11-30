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

Architecture

What is MBean

MBean Server