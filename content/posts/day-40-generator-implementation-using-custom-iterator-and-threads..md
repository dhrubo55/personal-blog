+++
category = []
date = 2022-01-27T00:00:00Z
description = "A python like generator implementation using custom Iterator, Thread and ThreadGroup"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day40"
summary = "A python like generator implementation using custom Iterator, Thread and ThreadGroup"
title = "Day 40: Generator implementation using custom Iterator and Threads. "
[cover]
alt = "Day40"
caption = "Day40"
image = ""
relative = false

+++
In one of my previous [post](https://www.linkedin.com/posts/mohibulhassan_100daysofjava-100daysofcode-coding-activity-6862015601217536000-iRvw) i tired to make python like generator in java using `Supplier` function and `IntStream`. That didnt fully behaved like a generator. So tried implementing this time using custom `Iterator` for lazy evaluation of the items in the collections and using a `Thread` to produce the items that will be `yeild` when calling the generator.

{{<replit src="https://replit.com/@dhrubo55/IdealLankySymbol">}}