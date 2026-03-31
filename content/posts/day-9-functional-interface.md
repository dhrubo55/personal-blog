+++
category = ["Java", "100DaysOfJava"]
date = 2021-07-05T00:00:00Z
description = "Functional interface"
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day9"
summary = "Functional interface"
topics = ["Language & APIs"]
title = "Day 9: Functional interface"
[cover]
alt = "Day9"
caption = "Day9"
image = ""
relative = false

+++

Functional interface

A functional interface or single abstract method interface is a special type of interface. It can still declare default methods, and even `toString()` without breaking the single-abstract-method constraint because the implementation can come from `Object` at runtime.

```java
@FunctionalInterface
interface MyFunctionalInterface {
    void init();

    default String addString(String str) {
        return str + str;
    }

    String toString();
}

public class Day09 {
    public static void main(String[] args) throws IOException, InterruptedException {
        MyFunctionalInterface myFunctionalInterface =
            () -> System.out.println("My functional Interface");
        myFunctionalInterface.init();
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 9 LinkedIn post](/images/100daysofjava/linkedin/day09.png)](https://www.linkedin.com/feed/update/urn:li:share:6817832175115862016/)


