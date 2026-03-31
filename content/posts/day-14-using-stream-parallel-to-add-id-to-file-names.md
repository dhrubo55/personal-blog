+++
category = ["Java", "100DaysOfJava"]
date = 2021-07-23T00:00:00Z
description = "Using stream parallel to add id to file names."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day14"
summary = "Using stream parallel to add id to file names."
topics = ["Concurrency"]
title = "Day 14: Using stream parallel to add id to file names."
[cover]
alt = "Day14"
caption = "Day14"
image = ""
relative = false

+++

Using stream parallel to add id to file names.

Transcribed from the original LinkedIn image post.

```java
import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

class Day014 {
    public static void main(String[] args) {
        Function<String, String> addIdToFile = (file) -> {
            String hashCode = Integer.toString(file.hashCode());
            return file + "-" + hashCode;
        };

        List<String> fileNames = getFileNameList("/home/mohibulhasan/Downloads");

        fileNames.stream()
            .parallel()
            .map(addIdToFile)
            .forEach(System.out::println);
    }

    public static List<String> getFileNameList(String path) {
        Function<String, String> getFileName = (file) -> {
            int index = file.lastIndexOf(".");
            if (index == -1) return "";
            return file.substring(0, index);
        };

        List<String> fileNameList = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(Paths.get(path))) {
            fileNameList = paths
                .filter(Files::isRegularFile)
                .map(path1 -> path1.getFileName().toString())
                .filter(fileName -> !fileName.isEmpty())
                .map(getFileName)
                .collect(Collectors.toList());
        } catch (IOException e) {
            System.out.println("Exception Occured " + e.getMessage());
        }
        return fileNameList;
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 14 LinkedIn post](/images/100daysofjava/linkedin/day14.png)](https://www.linkedin.com/feed/update/urn:li:share:6824359230003400705/)


