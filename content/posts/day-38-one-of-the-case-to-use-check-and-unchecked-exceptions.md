+++
category = []
date = 2022-01-05T00:00:00Z
description = "Checked exceptions and unchecked exceptions and use case"
showtoc = false
slug = "/java/100DaysOfJava/day38"
summary = "One of the case where to use checked and another for unchecked exceptions"
title = "Day 38: One of the case to use check and unchecked exceptions"
[cover]
alt = "Day38"
caption = "Day38"
image = ""
relative = false

+++
Checked Exceptions:

Exceptions that are checked during the compile time are called the checked exception. Basically compiler check for the exception to verify that a method or class that is throwing the exception have code that have given the code contingency. A way of handling with try-catch.

For example,

```java
File file = new File("/path/of/a/non/existing/file);
FileInputStream fileInputStream = new FileInputStream(file);
```


    In this case when a File object is tried to get initialized and the file does not exist it throws FileNotFoundException
Unchecked Exceptions:

![Java Exception Hierarchy](https://www.oracleimg.com/technetwork/articles/entarch/javaexceptions-107916.jpg)