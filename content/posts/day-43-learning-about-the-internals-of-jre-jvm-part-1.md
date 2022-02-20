+++
category = []
date = 2022-02-14T00:00:00Z
description = "Understating the internals of runtime, execution model, Application level virtualization, jre, jvm and compilation of java program"
draft = true
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
Inside out strategy

1. explain what a vm is then what is ALV and how jvm is a application level ALV
2. explain what is a runtime enviornment and how it interacts with underlying os and jvm
3. how does jre compiles bytecode and what is byte code
4. execution model of java and how a program gets executed
5. model diagrams and explain

When we talk about JVM aka java virtual machine. So lets first understand what is virtual machine. To undestand whats a virtual machine is we need to have some basic knowledge of key techonologies like virtualization and hypervisor.

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