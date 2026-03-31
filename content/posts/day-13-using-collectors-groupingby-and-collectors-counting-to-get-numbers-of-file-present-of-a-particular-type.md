+++
category = ["Java", "100DaysOfJava"]
date = 2021-07-19T00:00:00Z
description = "Using Collectors.groupingBy and Collectors.counting to get numbers of file present of a particular type"
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day13"
summary = "Using Collectors.groupingBy and Collectors.counting to get numbers of file present of a particular type"
topics = ["Language & APIs"]
title = "Day 13: Using Collectors.groupingBy and Collectors.counting to get numbers of file present of a particular type"
[cover]
alt = "Day13"
caption = "Day13"
image = ""
relative = false

+++

Using Collectors.groupingBy and Collectors.counting to get numbers of file present of a particular type

Transcribed from the original LinkedIn image post.

```java
import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

class Scratch {
    public static void main(String[] args) throws IOException, InterruptedException {
        Function<String, String> fileNameRemove = (fileName) -> {
            int index = fileName.lastIndexOf(".");
            if (index == -1) return "";
            return fileName.substring(index);
        };

        try (Stream<Path> paths = Files.walk(Paths.get("/home/mohibulhasan/Downloads"))) {
            Map<String, Long> fileCountByType = paths
                .filter(path -> Files.isRegularFile(path))
                .map(path -> path.getFileName().toString())
                .filter(fileName -> !fileName.isEmpty())
                .map(fileNameRemove)
                .collect(Collectors.groupingBy(
                    Function.identity(), Collectors.counting()
                ));
            System.out.println(fileCountByType);
        }
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 13 LinkedIn post](/images/100daysofjava/linkedin/day13.png)](https://www.linkedin.com/feed/update/urn:li:share:6822890146359316480/)


