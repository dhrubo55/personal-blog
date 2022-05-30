+++
category = []
date = 2022-05-28T00:00:00Z
description = "Creating Stream using StreamSupport and splitting it using partitioning and grouping"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day51"
summary = "Creating Stream using StreamSupport and splitting it using partitioning and grouping"
title = "Day 51: Creating Stream (using StreamSupport API)  from Iterator and splitting ( by group and partitioning)"
[cover]
alt = "Day51"
caption = "Day51"
image = ""
relative = false

+++
Creating a Stream using Java `StreamSupport` api and iterator, spliterator and then partition the stream using `Collections.partitionBy()` and `Collections.groupBy()` method.

### Stream:

Introduced in Java 8, the `Stream` API is used to process collections of objects. A stream is a sequence of objects that supports various methods which can be pipelined to produce the desired result.
The features of Java stream are –

- A stream is not a data structure instead it takes input from the Collections, Arrays or I/O channels.
- Streams don’t change the original data structure, they only provide the result as per the pipelined methods.
- Each intermediate operation is lazily executed and returns a stream as a result, hence various intermediate operations can be pipelined. Terminal operations mark the end of the stream and return the result.