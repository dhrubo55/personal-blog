+++
category = ["Java", "100DaysOfJava"]
date = 2021-06-30T00:00:00Z
description = "Getting stream of char from string.chars()"
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day5"
summary = "Getting stream of char from string.chars()"
title = "Day 5: Getting stream of char from string.chars()"
[cover]
alt = "Day5"
caption = "Day5"
image = ""
relative = false

+++

Getting stream of char from string.chars()

Transcribed from the original LinkedIn image post.

```java
/**
 * Getting a stream of characters from String.chars()
 */
public class Day05 {
    public static void main(String[] args) {
        String fileNameWithExtension = "a-very-large-file-name.docx";

        // this will give an IntStream where the int's are character code
        // Getting characters by mapping to char
        fileNameWithExtension.chars()
            .mapToObj(ch -> (char) ch)
            .forEach(System.out::println);
    }
}
```

The original LinkedIn graphic is preserved below.

![Day 5 LinkedIn post](/images/100daysofjava/linkedin/day05.png)

