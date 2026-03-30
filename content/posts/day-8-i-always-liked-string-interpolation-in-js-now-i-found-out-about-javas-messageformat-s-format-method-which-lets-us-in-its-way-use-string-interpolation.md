+++
category = ["Java", "100DaysOfJava"]
date = 2021-07-03T00:00:00Z
description = "I always liked string interpolation in JS. Now i found out about Javas MessageFormat's format method which lets us in its way use string interpolation."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day8"
summary = "I always liked string interpolation in JS. Now i found out about Javas MessageFormat's format method which lets us in its way use string interpolation."
title = "Day 8: I always liked string interpolation in JS. Now i found out about Javas MessageFormat's format method which lets us in its way use string interpolation."
[cover]
alt = "Day8"
caption = "Day8"
image = ""
relative = false

+++

I always liked string interpolation in JS. Now i found out about Javas MessageFormat''s format method which lets us in its way use string interpolation.

Transcribed from the original LinkedIn image post.

```java
import java.text.MessageFormat;

public class Day08 {
    public static void main(String[] args) {
        String stringInterpolation = MessageFormat
            .format(
                "MessageFormat.format makes {0} {1} happen",
                "string",
                "interpolation"
            );
        System.out.println(stringInterpolation);
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 8 LinkedIn post](/images/100daysofjava/linkedin/day08.png)](https://www.linkedin.com/feed/update/urn:li:share:6817126165766111232/)


