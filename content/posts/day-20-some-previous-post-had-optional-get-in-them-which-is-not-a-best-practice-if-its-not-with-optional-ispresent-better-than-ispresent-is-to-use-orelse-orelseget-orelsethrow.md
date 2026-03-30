+++
category = ["Java", "100DaysOfJava"]
date = 2021-08-20T00:00:00Z
description = "Some previous post had optional.get() in them which is not a best practice if its not with Optional.isPresent(). better than isPresent is to use orElse(), orElseGet(), orElseThrow()"
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day20"
summary = "Some previous post had optional.get() in them which is not a best practice if its not with Optional.isPresent(). better than isPresent is to use orElse(), orElseGet(), orElseThrow()"
title = "Day 20: Some previous post had optional.get() in them which is not a best practice if its not with Optional.isPresent(). better than isPresent is to use orElse(), orElseGet(), orElseThrow()"
[cover]
alt = "Day20"
caption = "Day20"
image = ""
relative = false

+++

Some previous post had optional.get() in them which is not a best practice if its not with Optional.isPresent(). better than isPresent is to use orElse(), orElseGet(), orElseThrow()

Transcribed from the original LinkedIn image post.

```java
import java.util.OptionalInt;
import java.util.function.IntSupplier;
import java.util.stream.IntStream;

class Day20 {
    public static void main(String[] args) throws Exception {
        int defaultNumber = Integer.MAX_VALUE;
        IntSupplier intSupplier = () -> (int) (Math.random() * 100);

        IntStream intStream = IntStream.range(0, 10);
        OptionalInt maxValue = intStream
            .filter(i -> i > 3)
            .findAny();

        // get value. if not present then get the default number
        int maxValueOrElse = maxValue.orElse(defaultNumber);
        // get value. if not present get free provided supplier
        int maxValueOrElseGet = maxValue.orElseGet(intSupplier);
        // get value. if not present throws an exception
        int maxValueOrElseThrow = maxValue.orElseThrow(() -> new Exception("No value present"));
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 20 LinkedIn post](/images/100daysofjava/linkedin/day20.png)](https://www.linkedin.com/feed/update/urn:li:share:6834503322163122176/)


