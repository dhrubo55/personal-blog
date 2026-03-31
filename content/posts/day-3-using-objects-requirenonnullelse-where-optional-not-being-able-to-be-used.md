+++
category = ["Java", "100DaysOfJava"]
date = 2021-06-28T00:00:00Z
description = "Using Objects.requireNonNullElse() where Optional not being able to be used."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day3"
summary = "Using Objects.requireNonNullElse() where Optional not being able to be used."
topics = ["Language & APIs"]
title = "Day 3: Using Objects.requireNonNullElse() where Optional not being able to be used."
[cover]
alt = "Day3"
caption = "Day3"
image = ""
relative = false

+++

Using Objects.requireNonNullElse() where Optional not being able to be used.

Transcribed from the original LinkedIn image post.

```java
/*
When returning a object that can have null value. wrapping it with an optional
can give you NullPointerException if object contains null.
In this case using optional might create some issue.
*/
import java.util.*;

public class Day03 {
    public static void main(String[] args) {
        // String fileExtension = getFileExtensionOpt().get();
        String fileExtension = Objects.requireNonNullElse(
            getFileExtension(),
            "got null in getFileExtension()"
        );
        System.out.println(fileExtension);
    }

    // will cause NullPointerException when get() is called on returned object
    public static Optional<String> getFileExtensionOpt() {
        return Optional.of(null);
    }

    // without optional
    public static String getFileExtension() {
        return null;
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 3 LinkedIn post](/images/100daysofjava/linkedin/day03.png)](https://www.linkedin.com/feed/update/urn:li:share:6815311983378870272/)


