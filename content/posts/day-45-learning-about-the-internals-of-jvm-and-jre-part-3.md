+++
category = ["100 Days Of Java"]
date = 2022-03-01T00:00:00Z
description = "learning what is Runtime and Runtime environment and Java Runtime"
showtoc = false
slug = "/java/100DaysOfJava/day45"
summary = "learning what is Runtime and Runtime environment and Java Runtime"
title = "Day 45: learning about the internals of JVM and JRE (part 3)"
[cover]
alt = "Day45"
caption = "Day45"
image = ""
relative = false

+++
`Runtime` and `Runtime Environment` are some of the most overloaded terms in software development. It’s confusing for everyone; this word means many different things in many different contexts. This post’s goal is to provide you with an intuition behind the many use-cases of `Runtime`

Runtime is used both as adjective and noun in most of the time.

### **Runtime — The Lifecycle (Noun)**

The first meaning of runtime is with regards to program lifecycle. This refers to the period of time in which a program is executing. A intuitive comparison is often made between compile time and runtime.

> The IDE is spitting out a lot of new warnings during compile time.

> This process is outputting a lot of logs during runtime.

### **Runtime — During The Lifecycle (Adjective)**

In the same context of program lifecycle, runtime is also commonly used as an adjective. This is sometimes hyphenated as “run-time.” The [O’Reilly Style Guide](http://oreillymedia.github.io/production-resources/styleguide/#getting_started) recommends using “runtime” for both nouns and adjectives.

### **Runtime Environment**

Armed with an intuition of runtime as a lifecycle, let’s discuss runtime environments. These two concepts are related, but subtlety different. Confusion is created because people abridge “runtime environment” to just “runtime.”

> You have to be careful that your Javascript program doesn’t have any runtime errors when it’s running in the Node.js runtime \[environment\].

> Q: Did you see the release notes for the new JRE?
>
> A: Yea, there’s a lot of fancy stuff going on in the new Java Runtime \[Environment\].

In these examples, the standalone “runtime” refers to a “runtime environment.” In these situations, it’s better to be precise with your language.

> The new Java Runtime Environment seems to be doing a better job with garbage collection.

> Is there a way to control how many threads handle the I/O within the Node.js runtime environment?

### **Understanding Runtime by Cooking a Pizza**

After developing a hunger  for a chicken cheese pizza, you decide to hop on Google to look for a recipe. After sifting through a few search results and scrolling past a few walls of ads, you find a clean step-by-step recipe that seems like a winner.

Unfortunately, a recipe on its own is useless. The recipe you found on Google isn’t actually going to get you your pizza, you need a kitchen! The pizza recipe’s runtime environment is your kitchen.

Your code is just code. Whatever code you write, in whatever language you choose, needs to eventually execute on a computer. Runtime environments enable this execution.

### **Common Runtime Environment ( The Operating System )**

The universal runtime environment for any kind of programmatic execution is the operating system. The operating system is the only way you can get the CPU to execute your code. The OS is the silent hero that ensures your program gets some memory, gets scheduled fairly, and doesn’t disturb its neighbors. It doesn’t matter if you’re using C, Python, or Node.js—at the end of the day, the operating system is everyone’s runtime environment.

#### Executable File format

Every operating system defines a binary file format for executable code. In Unix-Like operating systems, this is the [ELF file format](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format) (.so) . For windows its executable (.exe)

#### Executable's Runtime Environment

An executable’s runtime environment is the operating system. In addition, operating systems ship with programs that are able to take these files and give them to the hardware to be executed. In Linux, one example is the [_execve()_](https://man7.org/linux/man-pages/man2/execve.2.html) program. For all other operating systems, there will be a similar set of file formats and loader programs.

### Higher-Level Runtime Environments

As programming languages evolved, people wanted an environment that could handle additional tasks that felt cumbersome for developers.Wouldn’t some kind of automatic reference counting and garbage collection be extremely convenient? Some people say **yes** and this is how fancier runtime environments like the JRE developed.

Another popular higher-level runtime environment is Node.js. Many developers refer to this as the “Node.js Runtime” or simply just “Node.” Node is a runtime environment for the Javascript language, similar to how the JRE is a runtime environment for the Java language. Node comes with fancy features like a callback queue, an event loop, and a thread pool. Just like the JRE, these bells and whistles exist to make our lives easier as developers.

With higher-level runtime environments, features can become blurred across the language and its environment. Within the Java ecosystem, the automatic garbage collection feature is not technically a feature of the Java language itself, but is actually a feature of the JRE. 95% of developers won’t bother making this distinction. The statement “_Java has automatic memory management_” can more precisely be stated as, “_The Java Runtime Environment has automatic memory management_.” As a warning, you’ll get some unpleasant glares if you ever decide to correct someone over these kind of semantics.

### Runtime Environment Layers

Runtime environments have their own runtime environments. If you download the Node binary for Linux, you’ll find that it’s just another ELF executable waiting to be run by the OS. So we could say—Javascript’s runtime environment is Node, and Node’s runtime environment is the operating system. Or you could also say—Javascript’s runtime environment is a combination of Node and the operating system. Again, dive deep enough and everyone’s runtime environment ends up being the operating system.

### Interpreting Languages

Code does not always have to be compiled to OS/architecture-specific binaries. A common pattern is to execute your programs via interpreters. For example, a Python interpreter can read your Python source and produce corresponding machine instructions for your computer to execute. This conveniently makes Python source very portable. However, the Python interpreter itself is a compiled executable, built for a specific OS/architecture, who’s runtime environment is the operating system.

> There is no such thing as interpreted languages or non-interpreted languages. A programming language is just a syntax. Python interpreters are the most popular way to execute Python source, but it’s not the only way. Programmers are creative. I’m sure developers have found ways to compile Python/Javascript into executables or have even created ways to interpret C.

### Java Program’s Runtime Environment

![](https://www.tutorialandexample.com/wp-content/uploads/2019/11/Difference-between-JDK-JRE-JVM.png)

What does it take to execute a Java program on your computer? This is very close to an executable’s runtime environment; all we need to do is to make sure our java  source can turn into a proper bytecode.

This step is familiar to everyone. Java compiler takes your java code and create a properly formatted bytecode (.class) file, targeted for jvm.

A subtler part of java compilers is that they also provide a collection of java [runtime library](https://en.wikipedia.org/wiki/Runtime_library) that is automatically compiled into your program. The purpose of these libraries is to provide you—the programmer—with basic facilities to interact with the runtime environment. For a compiled java program as an bytecode executable in jvm, this environment is the jvm. For example, the java runtime library provides useful systems like _JIT_ and _java bytecode interpreter_ that allow you to manage memory and to help prepare it for execution, and many, many other things.

Any library that allows a program to interact with the operating system will be heavily tailored to that operating system.Java by using JVM talks with operating system and executes the program in jvm and jvm facilitates all the necessary library and function calls. For java, the runtime libraries and functions we just discussed are part of a larger umbrella library referred to as JRE. This is an official standard.

A Java program’s runtime environment is the jvm's runtime environment,  which in turn operating system. The important point to remember is that **all** code—from assembly to Javascript—needs some kind of environment in order execute, just like all recipes need some kind of kitchen to turn into food.