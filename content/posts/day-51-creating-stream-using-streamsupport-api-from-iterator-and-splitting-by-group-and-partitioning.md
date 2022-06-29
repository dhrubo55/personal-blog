+++
category = []
date = 2022-05-28T00:00:00Z
description = "Creating Stream using StreamSupport and splitting it using partitioning and grouping"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day51"
summary = "Creating Stream using StreamSupport and splitting it using partitioning and grouping"
title = "Day 51: Creating Stream (using StreamSupport API)  from Iterator and Spliterator"
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

* A stream is not a data structure instead it takes input from the Collections, Arrays or I/O channels.
* Streams don’t change the original data structure, they only provide the result as per the pipelined methods.
* Each intermediate operation is lazily executed and returns a stream as a result, hence various intermediate operations can be pipelined. Terminal operations mark the end of the stream and return the result.

To make a Stream from `Iterator` We first need to make a `Spliterator` first. So lets first understand what is `Iterator` and `Spliterator` is.

#### Iterator:

A Java Cursor is an Iterator, which is used to iterate or traverse or retrieve a Collection or Stream object’s elements one by one. There are three cursors in Java. `Spliterator` is also a special type of `Iterator` so its also a cursor.

1. Iterator
2. Enumeration
3. ListIterator
4. Spliterator

Iterators in Java are used in the Collection framework to retrieve elements one by one lazily. It is a universal iterator as we can apply it to any Collection object. By using Iterator, we can perform both read/update and remove operations. It is an improved version of `Enumeration` with the additional functionality of removing an element.

Iterator must be used whenever we want to enumerate elements in all Collection framework implemented interfaces like `Set`, `List`, `Queue`, `Deque`, and all implemented classes of `Map` interface.

#### Spliterator:

Besides traversing sequences of data, like an `Iterator<T>` a `Spliterator<T>` can also partition it:

`Iterator + Splitting => Spliterator`

The `trySplit()` method allows it to partition off some elements of the sequence as another `Spliterator<T>.`

This particular advantage over Iterator makes it the core component of the Stream API. By splitting up data into apt sub-sequences, it allows parallel processing.

### Iterator to Spliterator:

To convert an Iterator to Spliterator there is two api's. One is for `unknownsized` collection and another is for known `sized` collections. In the known sized `Spliterators.spliterator()` requires the size whereas the unknownsized doesnt required the size.

There is another parameter that is needed to be provided to the method, and that is `characterstics`, which is an integer that defines the characterstics of the spliterator.

Type of spliterator's

1. Empty Spliterator \[Spliterators.emptySpliterator();\]
2. Sized Spliterator \[Spliterators.spliterator();\]
3. Unknownsized Spliterator \[Spliterators.spliteratorUnknownSize();\]

Now creating a unknownsized spliterator from and Iterator

```java
 Iterator<Node> nodeIterator = Iterators.nodes(result);
Spliterator<Node> nodeSpliterator = Spliterators.spliteratorUnknownSize(nodeIterator,Spliterator.CONCURRENT);
```

Now `StreamSupport.stream()` method can take that `Spliterator` Object and a boolean option to enable parallel processing of stream elements. This method Creates a new sequential or parallel Stream from a Spliterator.

```java
Stream<Node> nodeStream = StreamSupport.stream(nodeSpliterator,false);
```

The spliterator is only traversed, split, or queried for estimated size after the terminal operation of the stream pipeline commences.

If parallel option is enabled then the returned stream will be parallel and if false then it will return a sequential stream.

This is a great [stackoverflow](https://stackoverflow.com/questions/20375176/should-i-always-use-a-parallel-stream-when-possible "Stackoverflow") article to understand if we should use parallel everywhere possible? 