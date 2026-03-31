+++
category = ["Java", "100DaysOfJava"]
date = 2021-06-27T00:00:00Z
description = "Getting the last element of a Stream."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day2"
summary = "Getting the last element of a Stream."
topics = ["Language & APIs"]
title = "Day 2: Getting the last element of a Stream."
[cover]
alt = "Day2"
caption = "Day2"
image = ""
relative = false

+++

Getting the last element of a Stream.

Transcribed from the original LinkedIn image post.

```java
/*
Getting the last element of a stream
*/
import java.util.List;
import java.util.stream.*;

public class Day02 {
    public static void main(String[] args) {
        List<String> fileTypeList = List.of("jpg", "png", "avi", "mpeg", "docx");

        // using reduce
        String lastElement = fileTypeList.stream()
            .reduce((element1, element2) -> element2)
            .get();

        System.out.println(lastElement);

        // using skip
        String lastElement1 = fileTypeList.stream()
            .skip(fileTypeList.size() - 1)
            .findFirst()
            .get();

        System.out.println(lastElement1);
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 2 LinkedIn post](/images/100daysofjava/linkedin/day02.png)](https://www.linkedin.com/feed/update/urn:li:share:6814832702764797952/)


