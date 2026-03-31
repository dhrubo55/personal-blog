+++
category = ["Java", "100DaysOfJava"]
date = 2021-07-01T00:00:00Z
description = "Today I got to know that for loop is faster than foreach loop for a large amount of elements. after checking I found out that is on average 2 times faster for the below program in my machine."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day6"
summary = "Today I got to know that for loop is faster than foreach loop for a large amount of elements. after checking I found out that is on average 2 times faster for the below program in my machine."
topics = ["JVM & Performance"]
title = "Day 6: Today I got to know that for loop is faster than foreach loop for a large amount of elements. after checking I found out that is on average 2 times faster for the below program in my machine."
[cover]
alt = "Day6"
caption = "Day6"
image = ""
relative = false

+++

Today I got to know that for loop is faster than foreach loop for a large amount of elements. after checking I found out that is on average 2 times faster for the below program in my machine.

Transcribed from the original LinkedIn image post.

```java
import java.util.ArrayList;
import java.util.List;

public class Day06 {
    public static void main(String args[]) {
        List<String> fileTypeList = new ArrayList<>();
        for (int i = 0; i < 1000000; i++) {
            fileTypeList.add("fileType");
        }

        long beforeForLoop = System.currentTimeMillis();
        for (int i = 0; i < fileTypeList.size(); i++) {
            fileTypeList.get(i);
        }
        long afterForLoop = System.currentTimeMillis();
        System.out.println("Time took in millis for for " + (afterForLoop - beforeForLoop));

        long beforeForeachLoop = System.currentTimeMillis();
        for (String s : fileTypeList) {
        }

        long afterForeachLoop = System.currentTimeMillis();
        System.out.println("Time took in millis for foreach " + (afterForeachLoop - beforeForeachLoop));
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 6 LinkedIn post](/images/100daysofjava/linkedin/day06.png)](https://www.linkedin.com/feed/update/urn:li:share:6816378176999186432/)


