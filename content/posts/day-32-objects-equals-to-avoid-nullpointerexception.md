+++
category = ["Java", "100DaysOfJava"]
date = 2021-11-17T00:00:00Z
description = "Using Objects.equals() when one of the values may be null."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day32"
summary = "Using Objects.equals() when one of the values may be null."
topics = ["Language & APIs"]
title = "Day 32: Using Objects.equals() when values may be null"
[cover]
alt = "Day32"
caption = "Day32"
image = ""
relative = false

+++

Using `Objects.equals()` when one of the values may be `null`.

Transcribed from the original LinkedIn image post.

```java
import java.util.Objects;

class Day32 {
    public static void main(String[] args) {
        String file1Name = "data.zip";
        String file2Name = "data.json";

        System.out.println(Objects.equals(true, file2Name));
        System.out.println(file2Name.equals(file1Name));

        // Changing file2Name to data.zip to get equality.
        file2Name = "data.zip";
        System.out.println(Objects.equals(file1Name, file2Name));

        file2Name = null;

        System.out.println(Objects.equals(file1Name, file2Name));
        // This will give NullPointerException as null.equals() is not possible.
        System.out.println(file2Name.equals(file1Name));
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 32 LinkedIn post](/images/100daysofjava/linkedin/day32.png)](https://www.linkedin.com/feed/update/urn:li:share:6866753869075116032/)

