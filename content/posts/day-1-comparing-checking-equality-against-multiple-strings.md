+++
category = ["Java", "100DaysOfJava"]
date = 2021-06-26T00:00:00Z
description = "Comparing/ checking equality against multiple Strings."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day1"
summary = "Comparing/ checking equality against multiple Strings."
title = "Day 1: Comparing/ checking equality against multiple Strings."
[cover]
alt = "Day1"
caption = "Day1"
image = ""
relative = false

+++

Comparing/ checking equality against multiple Strings.

Transcribed from the original LinkedIn image post.

```java
/*
Checking equality against multiple string
*/
import java.util.List;
import java.util.stream.*;

public class Day01 {
    public static void main(String[] args) {
        String fileType = "mpeg";

        // have to assure that given fileType and comparing strings
        // are all in same case (case-sensitiveness)

        if (List.of("jpg", "png", "avi", "mpeg", "docx").contains(fileType)) {
            System.out.println("Founded file with type " + fileType);
        }

        // another way of doing it
        if (Stream.of("jpg", "png", "avi", "mpeg", "docx").anyMatch(fileType::equalsIgnoreCase)) {
            System.out.println("Founded file with type " + fileType);
        }
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 1 LinkedIn post](/images/100daysofjava/linkedin/day01.png)](https://www.linkedin.com/feed/update/urn:li:share:6814533809460137984/)


