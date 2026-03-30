+++
category = ["Java", "100DaysOfJava"]
date = 2021-08-13T00:00:00Z
description = "using Scanner.findAll to get all the download links from a json file."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day18"
summary = "using Scanner.findAll to get all the download links from a json file."
title = "Day 18: using Scanner.findAll to get all the download links from a json file."
[cover]
alt = "Day18"
caption = "Day18"
image = ""
relative = false

+++

using Scanner.findAll to get all the download links from a json file.

Transcribed from the original LinkedIn image post.

```java
import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;
import java.util.regex.MatchResult;

class Day18 {
    public static void main(String[] args) {
        File file = new File("/home/mohibulhasan/Downloads/data.json");

        String urlRegex = "\"(https?|ftp|file)://[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]\"";
        String propertyName = "\"downloadLink\":\"";

        try (Scanner scanner = new Scanner(file)) {
            scanner.findAll(propertyName + urlRegex)
                .map(MatchResult::group)
                .forEach(System.out::println);
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }
    }
}
```

The original LinkedIn graphic is preserved below.

![Day 18 LinkedIn post](/images/100daysofjava/linkedin/day18.png)

