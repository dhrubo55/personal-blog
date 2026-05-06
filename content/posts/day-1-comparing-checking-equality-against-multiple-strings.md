+++
category = ["Java", "100DaysOfJava"]
date = 2021-06-26T00:00:00Z
description = "Checking whether a string matches one of several allowed values in Java."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day1"
summary = "A small Java example for checking whether a string matches one of several allowed values, with notes on List.of, Set.of, Apache Commons Lang, and streams."
topics = ["Language & APIs"]
title = "Day 1: Checking Whether a String Matches One of Several Values"
[cover]
alt = "Day1"
caption = "Day1"
image = ""
relative = false

+++

This example checks whether one string is equal to any value from a fixed set of allowed strings.

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

### Which option should you use?

For a small fixed list, `List.of(...).contains(value)` is simple and readable.

For repeated lookups or a larger set, keep the allowed values in a `Set`:

```java
import java.util.Locale;
import java.util.Set;

public class Day01 {
    private static final Set<String> ALLOWED_FILE_TYPES =
            Set.of("jpg", "png", "avi", "mpeg", "docx");

    public static void main(String[] args) {
        String fileType = "mpeg";
        if (ALLOWED_FILE_TYPES.contains(fileType.toLowerCase(Locale.ROOT))) {
            System.out.println("Found file with type " + fileType);
        }
    }
}
```

If a project already uses Apache Commons Lang, `Strings.CS.equalsAny(...)` or the relevant case-insensitive variant can express this directly without creating a collection at the call site. Streams are better when this check is part of a longer pipeline, not just for a standalone membership test.

The original LinkedIn graphic is preserved below.

[![Day 1 LinkedIn post](/images/100daysofjava/linkedin/day01.png)](https://www.linkedin.com/feed/update/urn:li:share:6814533809460137984/)


