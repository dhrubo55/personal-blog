+++
category = ["Java", "100DaysOfJava"]
date = 2021-08-06T00:00:00Z
description = "Unicode decoding side effect. Application throws exception when a comment is removed."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day17"
summary = "Unicode decoding side effect. Application throws exception when a comment is removed."
title = "Day 17: Unicode decoding side effect. Application throws exception when a comment is removed."
[cover]
alt = "Day17"
caption = "Day17"
image = ""
relative = false

+++

Unicode decoding side effect. Application throws exception when a comment is removed.

Transcribed from the original LinkedIn image post.

```java
/*
/u000d in unicode is new line so when unicode decoding happens
the code is in new line and becomes valid java code.

Unicode decoding is a process for decoding unicode characters
then converting it to ASCII

while java code compiles it, first unicode decoding happens then
lexical translation
*/
class Day17 {
    public static void main(String[] args) {
        int number = 0;
        // Please don't remove below comment. Program will crash
        // \u000d number = 10;
        System.out.println(10 / number);
    }
}
```

The original LinkedIn graphic is preserved below.

![Day 17 LinkedIn post](/images/100daysofjava/linkedin/day17.png)

