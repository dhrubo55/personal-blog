+++
category = ["Java", "100DaysOfJava"]
date = 2021-07-14T00:00:00Z
description = "Files.walk() and functional interface to remove file extension from fileNames"
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day12"
summary = "Files.walk() and functional interface to remove file extension from fileNames"
topics = ["I/O & Networking"]
title = "Day 12: Files.walk() and functional interface to remove file extension from fileNames"
[cover]
alt = "Day12"
caption = "Day12"
image = ""
relative = false

+++

Files.walk() and functional interface to remove file extension from fileNames

Transcribed from the original LinkedIn image post.

```java
import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

class Day12 {
    public static void main(String[] args) throws IOException, InterruptedException {
        Function<String, String> extensionRemove = (fileName) -> {
            int index = fileName.lastIndexOf(".");
            if (index == -1) return "";
            return fileName.substring(0, index);
        };

        List<String> fileNameList;
        try (Stream<Path> paths = Files.walk(Paths.get("/home/mohibulhasan/Downloads"))) {
            fileNameList = paths
                .filter(Files::isRegularFile)
                .map(path -> path.getFileName().toString())
                .filter(fileName -> !fileName.isEmpty())
                .map(extensionRemove)
                .collect(Collectors.toList());
        }
        fileNameList.forEach(System.out::println);
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 12 LinkedIn post](/images/100daysofjava/linkedin/day12.png)](https://www.linkedin.com/feed/update/urn:li:share:6821083331908771840/)


