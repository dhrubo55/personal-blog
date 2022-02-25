+++
category = []
date = 2022-02-24T00:00:00Z
description = "learning about jvm internals and its architecture"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day44"
summary = "learning about jvm  architecture"
title = "Day 44: learning about the internals of JRE and JVM (Part 2)"
[cover]
alt = "Day44"
caption = "Day44"
image = ""
relative = false

+++
![The JVM Architecture Explained - DZone Java](https://www.javainterviewpoint.com/java-virtual-machine-architecture-in-java/jvm-architecture/)

JVM has 4 major parts

1. Class Loader
2. Runtime Data areas
3. Execution engine
4. Native interface and method libraries

### Classloader:

Class loaders are responsible for **loading Java classes dynamically to the JVM** **(Java Virtual Machine) during runtime.** They're also part of the JRE (Java Runtime Environment). So, the JVM doesn't need to know about the underlying files or file systems in order to run Java programs thanks to class loaders.

Furthermore, these Java classes aren't loaded into memory all at once, but rather when they're required by an application. This is where class loaders come into the picture. They're responsible for loading classes into memory.

classloader subsystem does 3 things mainly

1. Class Loading
2. Linking
3. Initializing

##### Class Loading Mechanism:

The Java platform uses a delegation model for loading classes. The basic idea is that every class loader has a `parent` class loader. When loading a class, a class loader first `delegates` the search for the class to its parent class loader before attempting to find the class itself.

1. Constructors in java.lang.ClassLoader and its subclasses allow you to specify a parent when you instantiate a new class loader. If you don't explicitly specify a parent, the virtual machine's system class loader will be assigned as the default parent.
2. The loadClass method in ClassLoader performs these tasks, in order, when called to load a class:
   * If a class has already been loaded, it returns it.
   * Otherwise, it delegates the search for the new class to the parent class loader.
   * If the parent class loader does not find the class, loadClass calls the method findClass to find and load the class.
3. The findClass method of ClassLoader searches for the class in the current class loader if the class wasn't found by the parent class loader. You will probably want to override this method when you instantiate a class loader subclass in your application.
4. The class java.net.URLClassLoader serves as the basic class loader for extensions and other JAR files, overriding the findClass method of java.lang.ClassLoader to search one or more specified URLs for classes and resources.

![](https://docs.oracle.com/cd/E19501-01/819-3659/images/dgdeploy2.gif)

```Java
		System.out.println(Day44.class.getClassLoader());
        System.out.println(String.class.getClassLoader());
```

output:

    jdk.internal.loader.ClassLoaders$AppClassLoader@512ddf17
    null

here the class `Day44` will be loaded by `ApplicationClassLoader` and String is loaded by `BootStrapClassLoader` A bootstrap or primordial class loader is the parent of all the others.Though, we can see that for the String, it displays null in the output. This is because the bootstrap class loader is written in native code, not Java, so it doesn't show up as a Java class.

#### Linking:

After a class is located and its initial in-memory representation created in the JVM process, it is verified, prepared, resolved, and initialized.

* **Verification** 

  makes sure that the class is not corrupted and is structurally correct: its runtime constant pool is valid, the types of variables are correct, and the variables are initialized prior to being accessed. Verification can be turned off by supplying the `-noverify` option. If the JVM process does not run potentially malicious code, strict verification might not be required. Turning off the verification can speed up the startup of the JVM. Another benefit is that some classes, especially those generated on the fly by various tools, can be valid and safe for the JVM but unable to pass the strict verification process. In order to use such tools, the developer should disable this verification, which is often acceptable to do in a development environment.
* **Preparation** 

  of a class involves initializing its static fields to the default values for their respective types. (After preparation, fields of type `int` contain `0`, references are null, and so forth.)
* **Resolution** 

  of a class means checking that the symbolic references in the runtime constant pool actually point to valid classes of the required types. The resolution of a symbolic reference triggers loading of the referenced class. According to the JVM specification, this resolution process can be performed lazily, so it is deferred until the class is used.

#### Initialization

Initialization expects a prepared and verified class. It runs the class’s `initializer`. During initialization, the static fields are initialized to whatever values are specified in the code. The static initializer method that combines the code from all the static initialization blocks is also run. The initialization process should be run only once for every loaded class, so it is synchronized, especially because the initialization of the class can trigger the initialization of other classes and should be performed with care to avoid deadlocks.