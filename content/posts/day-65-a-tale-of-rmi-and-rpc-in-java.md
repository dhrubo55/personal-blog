+++
category = []
date = 2023-01-12T00:00:00Z
description = "Understanding how RPC and RMI works in java "
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day65"
summary = "Understanding how RPC and RMI works in java"
title = "Day 65: A tale of RMI (Remote Method Invocation)  in java"
[cover]
alt = "day65"
caption = "day65"
image = ""
relative = false

+++
Remote Method Invocation (RMI) and Remote Procedure Call (RPC) are two important concepts in Java that allow for distributed computing. Both RMI and RPC enable software components to communicate with each other over a network, allowing code to be executed on different machines without the need for manual intervention. In this blog post, we will discuss what RMI and RPC are, how they differ from one another, their advantages/disadvantages as well as an example of each in Java. 

### What is RMI
At its core, Remote Method Invocation is a way of calling methods on remote objects over a network connection using the `Object Request Broker Architecture (ORB)`. It provides developers with the ability to execute code remotely without having any knowledge about where or how it is being run – all you need is an interface definition file (.idl file), which describes your object's methods signatures and return types along with some additional information related to security etc., then you can use it just like any other local object! The main benefit here lies in its flexibility; since there’s no requirement for manual coding or compilation when making changes across multiple systems simultaneously - instead all that needs doing is updating one centralised IDL file. 

Remote invocation is nothing new. For many years C programmers have used remote procedure calls (RPC) to execute a C function on a remote host and return the results. The primary difference between RPC and RMI is that RPC, being an offshoot of the C language, is primarily concerned with data structures. It’s relatively easy to pack up data and ship it around, but for Java, that’s not enough. In Java we don’t just work with data structures; we work with objects, which contain both data and methods for operating on the data. Not only do we have to be able to ship the state of an object (the data) over the wire, but also the recipient has to be able to interact with the object (use its methods) after receiving it.

Now let us first understand some concepts regarding RMI and how it works. At first lets understad what are Remote and Non Remote Objects


#### Remote and Non Remote Obj 

Before an object can be used with RMI, it must be serializable. But that’s not sufficient. Remote objects in RMI are real distributed objects. As the name suggests, a remote object can be an object on a different machine; it can also be an object on the local host. The term remote means that the object is used through a special kind of object reference that can be passed over the network. Like normal Java objects, remote objects are passed by reference. Regardless of where the reference is used, the method invocation occurs at the original object, which still lives on its original host. If a remote host returns a reference to one of its objects to you. Then you call that object’s methods; the actual method invocations will happen on the remote host, where the object is.

Non remote objects are simpler. They are just normal serializable objects. (You can pass these over the network). The catch is that when you pass a non remote object over the network it is simply copied. So references to the object on one host are not the same as those on the remote host. Non remote objects are passed by copy (as opposed to by reference). 

