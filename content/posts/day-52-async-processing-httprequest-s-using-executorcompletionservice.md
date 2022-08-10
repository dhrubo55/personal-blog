+++
category = []
date = 2022-07-26T00:00:00Z
description = "Async Processing HttpRequest's using ExecutorCompletionService"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day52"
summary = "Async Processing HttpRequest's using ExecutorCompletionService"
title = "Day 52: Async Processing HttpRequest's using ExecutorCompletionService"
[cover]
alt = "Day52"
caption = "Day52"
image = ""
relative = false

+++
1. Synchronous and Async
2. ExecutorCompletionService to do http request among 3 threads
3. CompletableFuture to do http request among 3 threads

### What is Synchronous and Asynchronous:

Java code executes line by line."**Synchronously"** means "using the same clock" so when two instructions are synchronous they use the same clock and must happen one after the other. "Asynchronous" means "not using the same clock" so the instructions are not concerned with being in step with each other. That's why it looks backwards, the term is not referring to the instructions relationship to each other. It's referring to each instructions relationship to the clock

![Koyeb - Introduction to Synchronous and Asynchronous Processing](https://www.koyeb.com/static/images/blog/sync-vs-async-schema.png)

There are a couple of ways in which you can make asynchronous calls in Java depending upon your requirement. (But controlling them well is extremely important and tricky at times.)

In addition to `Runnable` interface (which is used to just execute tasks but doesn't return anything to caller) ,you can read about `Callable` interface and Future objects in java. (Which can return data to the caller)

### CompletionService:

A service that decouples the production of new asynchronous tasks from the consumption of the results of completed tasks. Producers submit tasks for execution. Consumers take completed tasks and process their results in the order they complete. A CompletionService can for example be used to manage asynchronous I/O, in which tasks that perform reads are submitted in one part of a program or system, and then acted upon in a different part of the program when the reads complete, possibly in a different order than they were requested.
Typically, a CompletionService relies on a separate Executor to actually execute the tasks, in which case the CompletionService only manages an internal completion queue. The ExecutorCompletionService class provides an implementation of this approach.
