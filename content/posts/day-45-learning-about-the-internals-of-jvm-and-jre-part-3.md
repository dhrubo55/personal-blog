+++
category = ["100 Days Of Java"]
date = 2022-03-01T00:00:00Z
description = "learning what is Runtime and Runtime environment and Java Runtime"
draft = true
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
1. What is Runtime
2. Different runtime nouns
3. Runtime environment
4. JRE

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

### Common Runtime Environment ( The Operating System )

The universal runtime environment for any kind of programmatic execution is the operating system. The operating system is the only way you can get the CPU to execute your code. The OS is the silent hero that ensures your program gets some memory, gets scheduled fairly, and doesn’t disturb its neighbors. It doesn’t matter if you’re using C, Python, or Node.js—at the end of the day, the operating system is everyone’s runtime environment.

#### Executable File format

Every operating system defines a binary file format for executable code. In Unix-Like operating systems, this is the [ELF file format](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format) (.so) . For windows its executable (.exe) 

#### Executable's Runtime Environment

An executable’s runtime environment is the operating system. In addition, operating systems ship with programs that are able to take these files and give them to the hardware to be executed. In Linux, one example is the [_execve()_](https://man7.org/linux/man-pages/man2/execve.2.html) program. For all other operating systems, there will be a similar set of file formats and loader programs.