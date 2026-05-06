+++
category = ["Java", "100DaysOfJava"]
date = 2021-07-01T00:00:00Z
description = "A corrected learning note about for-loop and foreach-loop performance, including why the original timing test was not a valid Java benchmark."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day6"
summary = "The original quick timing test was a learning snapshot, not evidence that for loops are faster than foreach loops. This update explains the benchmark flaws and points to JMH."
topics = ["JVM & Performance"]
title = "Day 6: For Loop vs Foreach Loop Performance, and Why My First Benchmark Was Misleading"
[cover]
alt = "Day6"
caption = "Day6"
image = ""
relative = false

+++

> Update, May 2026: the original benchmark below should not be treated as evidence that a classic `for` loop is meaningfully faster than `foreach`. It used `System.currentTimeMillis()`, no warmup, no repeated forks, and loops whose work could be optimized away. A proper Java microbenchmark should use JMH and should consume real work so the JIT cannot remove the measurement target.

This post is kept as a learning snapshot, but the conclusion has changed: prefer the loop that makes the code clearer unless a production measurement with representative data shows otherwise.

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

### What a better benchmark needs

A useful version of this test needs:

- JMH warmup and measurement iterations.
- Several forks so one JVM run does not dominate the result.
- Real work inside each loop.
- A consumed result so the JIT cannot remove the loop.
- Representative data structures, because arrays, `ArrayList`, `LinkedList`, and custom collections do not behave the same way.

For this series, Day 69 covers JMH in more detail: [Day 69 - Unlocking Java Performance Secrets](/posts/java/100DaysOfJava/day69/).

The original LinkedIn graphic is preserved below.

[![Day 6 LinkedIn post](/images/100daysofjava/linkedin/day06.png)](https://www.linkedin.com/feed/update/urn:li:share:6816378176999186432/)


