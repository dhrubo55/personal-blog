+++
category = []
date = 2022-05-06T00:00:00Z
description = "Zip and Unzip file using Java FileSystem api"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day49"
summary = "Zip and Unzip file using Java FileSystem api"
title = "Day 49: A utility class for Zip and Unzip files using java FileSystem api (Part 2)"
[cover]
alt = "Day49"
caption = "Day49"
image = ""
relative = false

+++
In previous post we have explored and wrote a utility class for zipping and unzipping files and folders using java Zip api. Now we will see another api provided by java named `FileSystem` under `java.nio.file`.

#### FileSystem:

FileSystem api of java non-blocking io's file is an interface to underlying file system. It's the factory for object to access `File` and other objects in the file system.

The default file system, obtained by invoking the `FileSystems.getDefault()` method, provides access to the file system that is accessible to the Java virtual machine. The `FileSystems` class defines methods to create file systems that provide access to other types of (custom) file systems.

