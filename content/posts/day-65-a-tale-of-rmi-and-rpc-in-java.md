+++
category = []
date = 2023-01-12T00:00:00Z
description = "Understanding how RPC and RMI works in java "
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day65"
summary = "Understanding how RPC and RMI works in java"
title = "Day 65: A tale of RMI and RPC in java"
[cover]
alt = "day65"
caption = "day65"
image = ""
relative = false

+++
Remote Method Invocation (RMI) and Remote Procedure Call (RPC) are two important concepts in Java that allow for distributed computing. Both RMI and RPC enable software components to communicate with each other over a network, allowing code to be executed on different machines without the need for manual intervention. In this blog post, we will discuss what RMI and RPC are, how they differ from one another, their advantages/disadvantages as well as an example of each in Java. 

### What is RMI
At its core, Remote Method Invocation is a way of calling methods on remote objects over a network connection using the Object Request Broker Architecture (ORB). It provides developers with the ability to execute code remotely without having any knowledge about where or how it is being run – all you need is an interface definition file (.idl file), which describes your object's methods signatures and return types along with some additional information related to security etc., then you can use it just like any other local object! The main benefit here lies in its flexibility; since there’s no requirement for manual coding or compilation when making changes across multiple systems simultaneously - instead all that needs doing is updating one centralised IDL file. 

Remote invocation is nothing new. For many years C programmers have used remote procedure calls (RPC) to execute a C function on a remote host and return the results. The primary difference between RPC and RMI is that RPC, being an offshoot of the C language, is primarily concerned with data structures. It’s relatively easy to pack up data and ship it around, but for Java, that’s not enough. In Java we don’t just work with data structures; we work with objects, which contain both data and methods for operating on the data. Not only do we have to be able to ship the state of an object (the data) over the wire, but also the recipient has to be able to interact with the object (use its methods) after receiving it.

### What is RPC
In contrast , Remote Procedure Call operates by sending messages between client-server applications via either TCP/IP sockets or named pipes depending upon implementation details; typically these requests contain parameters such as function name & arguments which will be used by server side procedure before returning results back again through same communication channel used initially . Unlike RMI however , RPC does not have direct access control mechanisms built into protocol itself - meaning if needed extra steps must taken during development time ensure only authorised clients able make calls against particular procedures exposed publicly .  


 Now let us look at pros & cons associated both approaches : On plus side , because everything handled transparently under hood users don't even aware system setup utilising either technology ; also due fact data passed encoded format latency issues minimal compared traditional web services solutions wherein XML payloads exchanged between nodes causing delays due sheer size content transferred every request response cycle . However downside comes form lack granular control offered when using these technologies - whilst possible secure communications channels still possibility malicious actors may exploit weaknesses existing within application layer so thorough testing always recommended prior deployment production environment !  

 To illustrate concept further let's take quick look example usage case written java language: Suppose developer wants create distributed chat application whereby user able connect chatroom hosted separate machine communicate others connected same room