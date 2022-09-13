+++
category = []
date = 2022-09-01T00:00:00Z
description = "Understanding volatile keyword's use in incrementing a double variable and see how it behaves in multi threaded env"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day54"
summary = "Understanding volatile keyword's use in incrementing a double variable and see how it behaves in multi threaded env"
title = "Day 54: Understanding volatile keyword's use for Multi Threaded program"
[cover]
alt = "Day54"
caption = "Day54"
image = ""
relative = false

+++
1. how java stores a object
2. obj or primitive level caching
3. how variables are cached in cpu cache / memory
4. what does volatile do in this case

### What is V

Processors execute program instructions. So, they need to retrieve both the program instructions and required data from RAM.As CPU's are capable of carrying out a significant number of instructions per second (IOPS), fetching from RAM isn't that ideal for them. As its an expensive call. So to mitigate this issue there are some techniques and `caching` is one of them.

Here in the below diagram we can see that each core of a processor have two level cache (L1, L2) and in L1 there is both `Data` and `Instruction` cache. Where the data and instructions are copied for processing. As different cores execute more instructions and manipulate more data, they fill up their caches with more relevant data and instructions.

![cpu](https://www.baeldung.com/wp-content/uploads/2017/08/cpu.png)

Simply it would be best to think about what would happen if a thread changes a cached value and at the same time other thread trying to read it