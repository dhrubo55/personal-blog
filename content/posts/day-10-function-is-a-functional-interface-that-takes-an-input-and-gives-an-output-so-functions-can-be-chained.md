+++
category = ["Java", "100DaysOfJava"]
date = 2021-07-06T00:00:00Z
description = "Function is a functional interface that takes an input and gives an output. so functions can be chained."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day10"
summary = "Function is a functional interface that takes an input and gives an output. so functions can be chained."
topics = ["Language & APIs"]
title = "Day 10: Function is a functional interface that takes an input and gives an output. so functions can be chained."
[cover]
alt = "Day10"
caption = "Day10"
image = ""
relative = false

+++

Function is a functional interface that takes an input and gives an output. so functions can be chained.

Transcribed from the original LinkedIn image post.

```java
import java.io.IOException;
import java.util.function.Function;

public class Day10 {
    public static void main(String[] args) throws IOException, InterruptedException {
        Function<String, String> stringFunction = String::trim;
        Function<String, Boolean> stringFunctionChar = stringFunction
            .andThen(String::toLowerCase)
            .andThen(s -> s.contains("function"));

        Boolean check = stringFunctionChar.apply("A string to put in function");
        System.out.println(check.booleanValue());
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 10 LinkedIn post](/images/100daysofjava/linkedin/day10.png)](https://www.linkedin.com/feed/update/urn:li:share:6818201484791029760/)


