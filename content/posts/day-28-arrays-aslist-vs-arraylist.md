+++
category = ["Java", "100DaysOfJava"]
date = 2021-10-22T00:00:00Z
description = "Arrays.asList() and new ArrayList<>() both return lists, but they do not behave the same way."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day28"
summary = "Arrays.asList() and new ArrayList<>() both return lists, but they do not behave the same way."
title = "Day 28: Arrays.asList() and new ArrayList<>() are not the same"
[cover]
alt = "Day28"
caption = "Day28"
image = ""
relative = false

+++

`Arrays.asList()` and `new ArrayList<>()` both return lists, but they do not behave the same way.

Transcribed from the original LinkedIn image post.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Day28 {
    public static void main(String[] args) {
        List<String> filePathsFromList = new ArrayList<>();
        filePathsFromList.add("/home/mohibulhasan/Downloads");
        filePathsFromList.add("/home/mohibulhasan/Pictures");

        String[] paths = new String[]{
            "/home/mohibulhasan/Downloads",
            "/home/mohibulhasan/Pictures"
        };
        List<String> filePathsFormArray = Arrays.asList(paths);

        // Calling add on a list created from Arrays.asList()
        // will throw UnsupportedOperationException.
        filePathsFormArray.add("/home/mohibulhasan/Applications");

        filePathsFromList.add("/home/mohibulhasan/Applications");

        System.out.println("Arrays.asList() returns ArrayList? "
            + (filePathsFormArray instanceof ArrayList));
        System.out.println("new ArrayList<>() returns ArrayList? "
            + (filePathsFromList instanceof ArrayList));
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 28 LinkedIn post](/images/100daysofjava/linkedin/day28.png)](https://www.linkedin.com/feed/update/urn:li:share:6857290678196686848/)

