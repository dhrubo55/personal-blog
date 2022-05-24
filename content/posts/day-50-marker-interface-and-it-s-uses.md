+++
category = []
date = 2022-05-21T00:00:00Z
description = "Marker interface and it's uses"
draft = true
showtoc = false
slug = "/java/100daysofjava/day50"
summary = "Marker interface and it's uses"
title = "Day 50: Marker interface and it's uses"
[cover]
alt = "Day50"
caption = "Day50"
image = ""
relative = false

+++
At first lets understand what is an Interface in Java

### Interface:

An Interface in Java programming language is defined as an abstract type used to specify the behavior of a class. An interface in Java is a blueprint of a class. A Java interface contains static constants and abstract methods and from java 8 default implementations.

The interface in Java is a mechanism to achieve abstraction. There can be abstract methods in the Java interface, and method body for default methods. It is used to achieve abstraction and multiple inheritance in Java. In other words, you can say that interfaces can have abstract methods and variables. Java Interface also represents the IS-A relationship.

### Marker Interface:

Market Interface is an interface that has no method declarations or fields in it. It is used as a tag to let the compiler know it needs to add some special behavior to the class implementing the marker interface. That is why the marker interface is also known as the tag interface in Java. Some java interfaces have no members like

`java. lang.Cloneable`
`java.io.Serializable`

these both interfaces are Marker Interfaces because it has no members. Marker interfaces are used to mark a class for a purpose. Purpose does not require any additional functionality.

##### For Example

java.io.Serializable interface is defined into java.io classes

`ObjectInputStream`
`ObjectOutputStream`

Marker Interfaces provide runtime information about Object. So the compiler and the JVM have additional information about the Object.

*As we can see clonable and serialization implementes marker type interface so lets see example of both*