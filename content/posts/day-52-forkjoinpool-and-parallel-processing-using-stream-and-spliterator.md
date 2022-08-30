+++
category = []
date = 2022-07-04T00:00:00Z
description = "Understanding forkjoinpool and user defined batch size streaming with spliterator to have parallel processing of heavy cpu bound workload"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day53"
summary = "ForkJoinPool and parallel processing using Stream and Spliterator"
title = "Day 54:Understanding forkjoinpool and user defined batch size streaming with spliterator to have parallel processing"
[cover]
alt = "Day52"
caption = "Day52"
image = ""
relative = false

+++
1. ThreadPool
2. ForkJoinPool
3. How Stream uses ForkJoinPool
4. Parallelization in Stream

Using a ForkJoinPool (ThreadPool) and parallel processing of streams containing a fixed batch size to process heavy cpu bound workload. So at first we will try to understand what is ForkJoin pool and how does it work.  
  
### ForkJoinPool :

