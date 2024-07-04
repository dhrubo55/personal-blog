+++
category = []
date = 2024-07-04T00:00:00Z
description = "Day 81: Creating custom stream operations ex: Slide, Shift, Zip and Fold using Spliterator"
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day80 "
summary = "Implementing Sliding, shifting, Zipping and Folding a Stream by creating it from a custom spliterator"
title = "Day 81: Creating custom stream operations ex: Slide, Shift, Zip and Fold using Spliterator"
[cover]
alt = "day81"
caption = "day81"
image = ""
relative = false

+++


# Custom Spliterator in Java: Enhancing Stream Operations

In the world of Java development, mastering the Streams API is crucial for efficient data processing. However, there are times when the built-in functionalities fall short of our specific needs. This is where custom Spliterators come into play. In this blog post, we'll explore how to create a custom Spliterator that implements shifting, sliding, zipping, and folding operations on streams, significantly enhancing your data processing capabilities.

## Understanding Spliterators

Before we dive into the implementation, let's briefly recap what a Spliterator is. Short for "splitable iterator," a Spliterator is an object that traverses and partitions elements of a source. It's designed to work seamlessly with the Stream API and supports parallel processing.

## Why Custom Spliterators Matter

Custom Spliterators allow us to:

1. Extend stream functionality beyond built-in operations
2. Optimize performance for specific data processing patterns
3. Combine multiple operations efficiently
4. Create reusable, composable stream components

## Implementing a Custom Spliterator

Our `CustomSpliterator` class will implement four key operations:

1. Shifting: Cyclically move elements in the stream
2. Sliding: Create windows of elements that slide through the stream
3. Zipping: Combine elements from two streams
4. Folding: Apply a cumulative operation to stream elements

Let's break down each operation:

### 1. Shift Operation

```java
public static <T> Stream<T> shift(Stream<T> stream, int offset) {
    Iterator<T> iterator = stream.iterator();
    Queue<T> queue = new LinkedList<>();
    for (int i = 0; i < offset && iterator.hasNext(); i++) {
        queue.add(iterator.next());
    }
    return StreamSupport.stream(new Spliterators.AbstractSpliterator<T>(Long.MAX_VALUE, Spliterator.ORDERED) {
        @Override
        public boolean tryAdvance(Consumer<? super T> action) {
            if (iterator.hasNext()) {
                queue.add(iterator.next());
                action.accept(queue.poll());
                return true;
            }
            return !queue.isEmpty() && queue.poll() != null;
        }
    }, false);
}
```

This method shifts the elements in the stream by a specified offset. It uses a queue to hold the shifted elements and advances the stream accordingly.

### 2. Slide Operation

```java
public static <T> Stream<List<T>> slide(Stream<T> stream, int windowSize) {
    Iterator<T> iterator = stream.iterator();
    Deque<T> deque = new LinkedList<>();
    for (int i = 0; i < windowSize - 1 && iterator.hasNext(); i++) {
        deque.add(iterator.next());
    }
    return StreamSupport.stream(new Spliterators.AbstractSpliterator<List<T>>(Long.MAX_VALUE, Spliterator.ORDERED) {
        @Override
        public boolean tryAdvance(Consumer<? super List<T>> action) {
            if (iterator.hasNext()) {
                deque.add(iterator.next());
                if (deque.size() > windowSize) {
                    deque.pollFirst();
                }
                action.accept(new ArrayList<>(deque));
                return true;
            }
            return false;
        }
    }, false);
}
```

The slide operation creates overlapping windows of elements. It maintains a deque of the current window and slides it through the stream.

### 3. Zip Operation

```java
public static <A, B> Stream<AbstractMap.SimpleEntry<A, B>> zip(Stream<A> streamA, Stream<B> streamB) {
    Spliterator<A> spliteratorA = streamA.spliterator();
    Spliterator<B> spliteratorB = streamB.spliterator();

    Iterator<A> iteratorA = Spliterators.iterator(spliteratorA);
    Iterator<B> iteratorB = Spliterators.iterator(spliteratorB);

    return StreamSupport.stream(new Spliterators.AbstractSpliterator<AbstractMap.SimpleEntry<A, B>>(
            Math.min(spliteratorA.estimateSize(), spliteratorB.estimateSize()), Spliterator.ORDERED) {
        @Override
        public boolean tryAdvance(Consumer<? super AbstractMap.SimpleEntry<A, B>> action) {
            if (iteratorA.hasNext() && iteratorB.hasNext()) {
                A a = iteratorA.next();
                B b = iteratorB.next();
                action.accept(new AbstractMap.SimpleEntry<>(a, b));
                return true;
            }
            return false;
        }
    }, false);
}
```

The zip operation combines elements from two streams into pairs. It advances both streams simultaneously, creating pairs until one of the streams is exhausted.

### 4. Fold Operation

```java
public static <T, R> R fold(Stream<T> stream, R identity, BiFunction<R, T, R> accumulator) {
    Iterator<T> iterator = stream.iterator();
    R result = identity;
    while (iterator.hasNext()) {
        result = accumulator.apply(result, iterator.next());
    }
    return result;
}
```

The fold operation, also known as reduce, applies a cumulative operation to the stream elements. It's a powerful tool for aggregating data.

### Full Code: 

```java
import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class CustomSpliterator {

    public static <T> Stream<T> shift(Stream<T> stream, int offset) {
        Iterator<T> iterator = stream.iterator();
        Queue<T> queue = new LinkedList<>();
        for (int i = 0; i < offset && iterator.hasNext(); i++) {
            queue.add(iterator.next());
        }
        return StreamSupport.stream(new Spliterators.AbstractSpliterator<T>(Long.MAX_VALUE, Spliterator.ORDERED) {
            @Override
            public boolean tryAdvance(Consumer<? super T> action) {
                if (iterator.hasNext()) {
                    queue.add(iterator.next());
                    action.accept(queue.poll());
                    return true;
                }
                return !queue.isEmpty() && queue.poll() != null;
            }
        }, false);
    }

    public static <T> Stream<List<T>> slide(Stream<T> stream, int windowSize) {
        Iterator<T> iterator = stream.iterator();
        Deque<T> deque = new LinkedList<>();
        for (int i = 0; i < windowSize - 1 && iterator.hasNext(); i++) {
            deque.add(iterator.next());
        }
        return StreamSupport.stream(new Spliterators.AbstractSpliterator<List<T>>(Long.MAX_VALUE, Spliterator.ORDERED) {
            @Override
            public boolean tryAdvance(Consumer<? super List<T>> action) {
                if (iterator.hasNext()) {
                    deque.add(iterator.next());
                    if (deque.size() > windowSize) {
                        deque.pollFirst();
                    }
                    action.accept(new ArrayList<>(deque));
                    return true;
                }
                return false;
            }
        }, false);
    }

    public static <A, B> Stream<AbstractMap.SimpleEntry<A, B>> zip(Stream<A> streamA, Stream<B> streamB) {
        Spliterator<A> spliteratorA = streamA.spliterator();
        Spliterator<B> spliteratorB = streamB.spliterator();

        Iterator<A> iteratorA = Spliterators.iterator(spliteratorA);
        Iterator<B> iteratorB = Spliterators.iterator(spliteratorB);

        return StreamSupport.stream(new Spliterators.AbstractSpliterator<AbstractMap.SimpleEntry<A, B>>(
                Math.min(spliteratorA.estimateSize(), spliteratorB.estimateSize()), Spliterator.ORDERED) {
            @Override
            public boolean tryAdvance(Consumer<? super AbstractMap.SimpleEntry<A, B>> action) {
                if (iteratorA.hasNext() && iteratorB.hasNext()) {
                    A a = iteratorA.next();
                    B b = iteratorB.next();
                    action.accept(new AbstractMap.SimpleEntry<>(a, b));
                    return true;
                }
                return false;
            }
        }, false);
    }

    public static <T, R> R fold(Stream<T> stream, R identity, BiFunction<R, T, R> accumulator) {
        Iterator<T> iterator = stream.iterator();
        R result = identity;
        while (iterator.hasNext()) {
            result = accumulator.apply(result, iterator.next());
        }
        return result;
    }
}
```
here is the runner class

```java
public class Day81 {
    public static void main(String[] args) {
        System.out.println("Shift example");
        List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);
        Stream<Integer> shiftedStream = CustomSpliterator.shift(list.stream(), 2);
        shiftedStream.forEach(System.out::println);

        System.out.println("Slide example");
        Stream<List<Integer>> slidingStream = CustomSpliterator.slide(list.stream(), 3);
        slidingStream.forEach(System.out::println);

        System.out.println("Zip example");
        List<String> list2 = Arrays.asList("a", "b", "c");
        Stream<AbstractMap.SimpleEntry<Integer, String>> zippedStream = CustomSpliterator.zip(list.stream(), list2.stream());
        zippedStream.forEach(pair -> System.out::println(pair.getKey() + ", " + pair.getValue()));

        System.out.println("Fold example");
        Integer sum = CustomSpliterator.fold(list.stream(), 0, Integer::sum);
        System.out.println("Sum: " + sum);
    }
}
```


## Example: Calculating Moving Average

Here's a practical example of using our custom Spliterator to calculate a moving average:

```java
List<Double> stockPrices = Arrays.asList(100.0, 102.0, 98.0, 103.0, 99.0, 101.0);
int windowSize = 3;

Stream<Double> movingAverages = CustomSpliterator.slide(stockPrices.stream(), windowSize)
    .map(window -> window.stream().mapToDouble(Double::doubleValue).average().orElse(0.0));

movingAverages.forEach(System.out::println);
```

This code efficiently calculates the 3-day moving average of stock prices using our custom sliding window operation.


Creating a custom Spliterator is an advanced technique that can significantly enhance your Java data processing capabilities. By combining shifting, sliding windows, zipping, and folding into a single, efficient component, we've created a powerful tool for complex data manipulation tasks.

As you implement these techniques in your projects, remember to consider the trade-offs. While custom Spliterators offer great flexibility and power, they can also introduce complexity. Always benchmark your implementations to ensure they provide the expected performance benefits.

Happy coding, and may your streams flow efficiently!