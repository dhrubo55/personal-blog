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


### What is Synchornous and Asynchronous:

Java code executes line by line. Suppose if you are reading a set of large files having exam details of the schools of the whole state, where one file has data of one school's exam results.

Further you want to sort the student records by total marks per class and show on UI. If you write this as normal java code (i.e. Without multi threading) , each line would execute one by one. You can not process another file if one file is not yet done processing. If you want to do any parallel operation for 

example : Creating DB connection, you can't do, because it will happen only after your file processing is done. This sequential behavior can be termed as Synchronous behavior.

Now you can very well read and process a sub-group of files without interrupting the processing of other files by executing tasks in concurrently (aka Threads).This phenomena is called as Multithreading . Caller (the one who needs the result) can be notified when the processing is complete and the result can then be used for further processing. So, the execution which happens independently, without interrupting the Normal flow of execution is called Asynchronous call.

There are a couple of ways in which you can make asynchronous calls in Java depending upon your requirement. (But contrlling them well is extremely important and tricky at times.)

In addition to Runnable interface (which is used to just execute tasks but doesn't return anything to caller) ,you can read about Callable interface and Future objects in java. (Which can return data to the caller)
