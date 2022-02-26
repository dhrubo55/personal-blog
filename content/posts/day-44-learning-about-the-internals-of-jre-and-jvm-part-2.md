+++
category = []
date = 2022-02-24T00:00:00Z
description = "learning about jvm internals and its architecture"
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

  of a class involves initializing its static fields to the default values for their respective types. After preparation, fields of type `int` contain `0`, references are null, and so forth.
* **Resolution**

  of a class means checking that the symbolic references in the runtime constant pool actually point to valid classes of the required types. The resolution of a symbolic reference triggers loading of the referenced class. According to the JVM specification, this resolution process can be performed lazily, so it is deferred until the class is used.

#### Initialization

Initialization expects a prepared and verified class. It runs the class’s `initializer`. During initialization, the static fields are initialized to whatever values are specified in the code. The static initializer method that combines the code from all the static initialization blocks is also run. The initialization process should be run only once for every loaded class, so it is synchronized, especially because the initialization of the class can trigger the initialization of other classes and should be performed with care to avoid deadlocks.

### Runtime Data Areas:

Runtime data areas consist of

1. Heap Area
2. Method Area
3. Stack Area
4. PC Registers
5. Native Method Stack

#### Heap Area:

The Java Virtual Machine has a heap that is shared among all Java Virtual Machine threads. The heap is the run-time data area from which memory for all class instances and arrays is allocated. The heap is created on virtual machine start-up. Heap storage for objects is reclaimed by an automatic storage management system (known as a garbage collector); objects are never explicitly deallocated.

Heap Memory can be accessed by any thread is further divided into three generations **Young Generation**, **Old** & **PermGen(Permanent Generation)**. When object is created then it first go to Young generation(especially Eden space) when objects get old then it moves to Old/tenured Generation. In PermGen space all static & instance variables name-value pairs(name-references for object) are stored. Below is image showing heap structure of java.

![](/images-from-blog/v1645799959/images-from-blog/ppt_img_shlgwn.gif)

You can manually increase heap size by some JVM parameters as shown in images. Suppose we have a simple class Day44 then increasing its memory by following parameters:-

    java -Xms=1M -XmX=2M Day44

#### Stack Area:

Stack is generated with each thread created by program. It is associated by thread. Each Thread has its own stack. All local variables & function calls are stored in stack. It’s life depends upon Thread’s life as thread will be alive it will also and vice-versa. It can also be increased by manually:-

    java -Xss=512M HackTheJava

It throws StackOverFlow error when stack get full.

#### Method Area:

It is memory which is shared among all Threads like Heap. It is created on Java Virtual Machine startup. It contains the code actually a compiled code, methods and its data and fields. **Runtime constant pool** is also a part of Method Area. Runtime Constant pool is per class representation of constant Table. It contains all literals defined at compiled time and references which is going to be solved at runtime. Memory for it is by default allotted by JVM and can be increased if needed.

#### Native Method Stack:

An implementation of the Java Virtual Machine may use conventional stacks, also called "C stacks," to support native methods (methods written in a language other than the Java programming language). Native method stacks may also be used by the implementation of an interpreter for the Java Virtual Machine's instruction set in a language such as C. Java Virtual Machine implementations that cannot load native methods and that do not themselves rely on conventional stacks need not supply native method stacks. If supplied, native method stacks are typically allocated per thread when each thread is created.

### Execution Engine

Execution Engine helps in executing the byte code by converting it into machine code and also interact with the memory area. So here are the components involved in executing:

* **Interpreter**: 

  It is responsible to read, interpret, and execute java program line by line. So if any method is called multiple times new interpretation required which is the main disadvantage of it.
* **JIT Compiler (Just In Time):** 

  > **When we compile our Java program (e.g., using the _javac_ command), we'll end up with our source code compiled into the binary representation of our code – a JVM bytecode**. This bytecode is simpler and more compact than our source code, but conventional processors in our computers cannot execute it.
  >
  > **To be able to run a Java program, the JVM interprets the bytecode**. Since interpreters are usually a lot slower than native code executing on a real processor, the **JVM can run another compiler which will now compile our bytecode into the machine code that can be run by the processor**. This so-called just-in-time compiler is much more sophisticated than the _javac_ compiler, and it runs complex optimizations to generate high-quality machine code

The JDK implementation by Oracle is based on the open-source OpenJDK project. This includes the **HotSpot virtual machine**, available since Java version 1.3. It **contains two conventional JIT-compilers: the client compiler, also called C1 and the server compiler, called opto or C2**.

C1 is designed to run faster and produce less optimized code, while C2, on the other hand, takes a little more time to run but produces a better-optimized code. The client compiler is a better fit for desktop applications since we don't want to have long pauses for the JIT-compilation. The server compiler is better for long-running server applications that can spend more time on the compilation.

* Intermediate Code Generator
* Code Optimizer
* Target Code Generator
* Profiler

Note: Profiler is there to identify hotspot repeated methods inside JIT.

In order to provide native libraries to the Execution Engine, we have JNI that connects with Native libraries and the Execution Engine.

In the next part will discuss about what is runtime and java runtime environment