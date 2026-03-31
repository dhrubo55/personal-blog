+++
category = ["Java", "100DaysOfJava"]
date = 2021-09-14T00:00:00Z
description = "Removing nulls from list using Collections.singleton and Objects.isNull"
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day24"
summary = "Removing nulls from list using Collections.singleton and Objects.isNull"
topics = ["Language & APIs"]
title = "Day 24: Removing nulls from list using Collections.singleton and Objects.isNull"
[cover]
alt = "Day24"
caption = "Day24"
image = ""
relative = false

+++

Removing nulls from list using Collections.singleton and Objects.isNull

Transcribed from the original LinkedIn image post.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

class Day24 {
    public static void main(String[] args) {
        String[] filesFromDirUsr = {"A.txt", "C.txt", null, "G.txt"};
        List<String> usrFiles = new ArrayList<>(Arrays.asList(filesFromDirUsr));

        String[] fileFromDirDownloads = {"X.txt", null, "J.txt", "N.txt", null, null};
        List<String> downloadedFiles = new ArrayList<>(Arrays.asList(fileFromDirDownloads));

        usrFiles.forEach(System.out::println);
        downloadedFiles.forEach(System.out::println);

        usrFiles.removeAll(Collections.singleton(null));
        downloadedFiles.removeIf(Objects::isNull);
        System.out.println();

        usrFiles.forEach(System.out::println);
        downloadedFiles.forEach(System.out::println);
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 24 LinkedIn post](/images/100daysofjava/linkedin/day24.png)](https://www.linkedin.com/feed/update/urn:li:share:6843564935948173312/)


