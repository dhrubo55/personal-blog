+++
category = ["Java", "100DaysOfJava"]
date = 2021-06-29T00:00:00Z
description = "try with resource helps to close open resources that uses .close() method to close."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day4"
summary = "try with resource helps to close open resources that uses .close() method to close."
topics = ["I/O & Networking"]
title = "Day 4: try with resource helps to close open resources that uses .close() method to close."
[cover]
alt = "Day4"
caption = "Day4"
image = ""
relative = false

+++

try with resource helps to close open resources that uses .close() method to close.

Transcribed from the original LinkedIn image post.

```java
/*
Try with resource is basically closing the resources where a programmer
would have to manually close FileWriter and BufferedWriter
*/
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

public class Day04 {
    public static void main(String[] args) throws IOException {
        File file = new File("/home/mohibulhasan/Documents/example.txt");

        // try with resource
        try (
            FileWriter fileWriter = new FileWriter(file);
            BufferedWriter bufferedWriter = new BufferedWriter(fileWriter)
        ) {
            bufferedWriter.write("Found about try with resource.");
            bufferedWriter.newLine();
        }
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 4 LinkedIn post](/images/100daysofjava/linkedin/day04.png)](https://www.linkedin.com/feed/update/urn:li:share:6815666266473418752/)


