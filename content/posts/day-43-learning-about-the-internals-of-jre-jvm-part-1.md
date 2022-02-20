+++
category = []
date = 2022-02-14T00:00:00Z
description = "Understating the internals of runtime, execution model, Application level virtualization, jre, jvm and compilation of java program"
showtoc = false
slug = "/java/100DaysOfJava/day43"
summary = "Understating the internals of jre and jvm how does they work to run a java program"
title = "Day 43: learning about the internals of jre, jvm (Part 1)"
[cover]
alt = "Day43"
caption = "Day43"
image = ""
relative = false

+++
> First of all here inside out approach is followed to understand JVM then JRE and then JDK and along the path will try to explain Virtualization, Hypervisor, VM, various kind of VM, runtime, java program execution model and memory model.

**N.B JVM is a specification and it have many implementations.**

When we talk about JVM aka java virtual machine. So lets first understand what is virtual machine. To understand whats a virtual machine is we need to have some basic knowledge of key technologies like virtualization and hypervisor.

### Virtualization:

Virtualization is the process of running a virtual instance of a computer system in a layer (Hypervisor) up from the actual hardware. Most commonly, it refers to running multiple operating systems on a computer system simultaneously. To the applications running on top of the virtualized machine, it can appear as if they are on their own dedicated machine, where the operating system, libraries, and other programs are unique to the guest virtualized system and unconnected to the host operating system which sits below it.

### Hypervisor(VMM):

A hypervisor aka VMM( Virtual Machine monitor) is a program for creating and running virtual machines. Hypervisors have traditionally been split into two classes: type one, or "bare metal" hypervisors that run guest virtual machines directly on a system's hardware, essentially behaving as an operating system. Type two, or "hosted" hypervisors behave more like traditional applications that can be started and stopped like a normal program. In modern systems, this split is less prevalent, particularly with systems like KVM. KVM, short for kernel-based virtual machine, is a part of the Linux kernel that can run virtual machines directly, although you can still use a system running KVM virtual machines as a normal computer itself.

### Virtual Machine:

A virtual machine is the emulated equivalent of a computer system that runs on top of another system. Virtual machines may have access to any number of resources:

1. computing power, through hardware-assisted
2. Limited access to the host machine's CPU and memory
3. one or more physical or virtual disk devices for storage
4. A virtual or real network interface
5. Other devices such as video cards, USB devices, or other hardware that are shared with the virtual machine.

If the virtual machine is stored on a virtual disk, this is often referred to as a disk image. A disk image may contain the files for a virtual machine to boot, or, it can contain any other specific storage needs.

![](https://img.brainkart.com/imagebk12/FTtnlOD.jpg)

There are many type of VM and many layers where virtualization can be done and they are

![](https://img.brainkart.com/imagebk12/oJDo3bd.jpg)

There are five layers where virtualization can be possible. For understanding JVM (Java virtual Machine) that is a application level vm.

### Application Level Virtualization:

Virtualization at the application level virtualizes an application as a VM. On a OS, an application often runs as a process. Therefore, application-level virtualization is also known as process-level virtualization. The most popular approach is to deploy high level language (HLL)VMs.

In this scenario, the virtualization layer sits as an application program on top of the operating system, and the layer behaves like a VM that have the normal properties of an VM and can run programs written and compiled to a particular machine definition for that virtual machine. Any program written in the HLL and compiled for this VM will be able to run on it. The Microsoft .NET CLR and Java Virtual Machine (JVM) are two good examples of this class of VM.

Other forms of application level virtualization are known as application isolation, application sandboxing, or application streaming. This process involves wrapping up the application in a layer that is isolated from the host OS and other applications. The result is an application that is much easier to distribute and remove from user workstations.

So now as JVM is an application that behaves like a virtual machine it has its own architecture.

### JVM:

Java virtual machine (JVM) is a virtual machine that enables a computer to run Java programs as well as programs written in other languages that are also compiled to bytecode. The JVM is detailed by a specification that formally describes what is required in a JVM implementation. Having a specification ensures interoperability of Java programs across different implementations so that program authors using the Java Development Kit (JDK) need not worry about idiosyncrasies of the underlying hardware platform.

JVM has some important tasks to perform and those are

1. Loading Code
2. Verifying Code
3. Executing Code
4. Providing Runtime Environment

\**JVM Architecuture

\**![The JVM Architecture Explained - DZone Java](https://www.javainterviewpoint.com/java-virtual-machine-architecture-in-java/jvm-architecture/)

In Part 2 details discussion about JVM will be posted