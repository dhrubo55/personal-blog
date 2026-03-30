+++
category = ["Java", "100DaysOfJava"]
date = 2021-07-02T00:00:00Z
description = "Today i found out that string declared with \"\" are placed in string constant pool while with new keyword its in heap. String.intern() return string if defined in string pool otherwise creates the string and then returns it."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day7"
summary = "Today i found out that string declared with \"\" are placed in string constant pool while with new keyword its in heap. String.intern() return string if defined in string pool otherwise creates the string and then returns it."
title = "Day 7: Today i found out that string declared with \"\" are placed in string constant pool while with new keyword its in heap. String.intern() return string if defined in string pool otherwise creates the string and then returns it."
[cover]
alt = "Day7"
caption = "Day7"
image = ""
relative = false

+++

Today i found out that string declared with "" are placed in string constant pool while with new keyword its in heap. String.intern() return string if defined in string pool otherwise creates the string and then returns it.

Transcribed from the original LinkedIn image post.

```java
public class Day07 {
    public static void main(String args[]) {
        // String is created in heap
        String file1 = new String("docx");
        String file2 = new String("docx");

        // checking for memory location
        System.out.println(file1 == file2); // false

        // String is created in String constant pool
        String file3 = "rs";
        String file4 = "rs";
        System.out.println(file3 == file4); // true

        // now using intern() getting a copy of docx in String pool
        String file5 = file2.intern();
        String file6 = "docx";

        // first check file2 and file5
        System.out.println(file2 == file5);
        // next check file5 and file6
        System.out.println(file5 == file6);
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 7 LinkedIn post](/images/100daysofjava/linkedin/day07.png)](https://www.linkedin.com/feed/update/urn:li:share:6816780345023832064/)


