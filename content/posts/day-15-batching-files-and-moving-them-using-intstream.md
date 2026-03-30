+++
category = ["Java", "100DaysOfJava"]
date = 2021-07-27T00:00:00Z
description = "Batching files and moving them using intStream"
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day15"
summary = "Batching files and moving them using intStream"
title = "Day 15: Batching files and moving them using intStream"
[cover]
alt = "Day15"
caption = "Day15"
image = ""
relative = false

+++

Batching files and moving them using intStream

Transcribed from the original LinkedIn image post.

```java
import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

class Day015 {
    public static void main(String[] args) {
        int batchSize = 100;
        Path dirPath = getDirPath();
        final List<File> files = getFileList("/home/mohibulhasan/Downloads");
        int batchRange = (files.size() + batchSize - 1) / batchSize;

        IntStream.range(0, batchRange)
            .mapToObj(i -> files.subList(i * batchSize, Math.min(files.size(), (i + 1) * batchSize)))
            .forEach(filesInBatch -> moveToDir(filesInBatch, dirPath));
    }

    static List<File> getFileList(String path) {
        List<File> files = new ArrayList<>();
        try (Stream<Path> pathStream = Files.walk(Paths.get(path))) {
            files = pathStream
                .filter(Files::isRegularFile)
                .map(Path::toFile)
                .collect(Collectors.toList());
        } catch (IOException e) {
            e.printStackTrace();
        }
        return files;
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 15 LinkedIn post](/images/100daysofjava/linkedin/day15.png)](https://www.linkedin.com/feed/update/urn:li:share:6825808817792675840/)


