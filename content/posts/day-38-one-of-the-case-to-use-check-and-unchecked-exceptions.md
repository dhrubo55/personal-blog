+++
category = []
date = 2022-01-05T00:00:00Z
description = "Checked exceptions and unchecked exceptions and use case"
showtoc = false
slug = "/java/100DaysOfJava/day38"
summary = "One of the case where to use checked and another for unchecked exceptions"
title = "Day 38: One of the cases to use check and unchecked exceptions"
[cover]
alt = "Day38"
caption = "Day38"
image = ""
relative = false

+++
#### Checked Exceptions:

Exceptions that are checked during the compile time are called the checked exception. Basically compiler check for the exception to verify that a method or class that is throwing the exception have code that have given the code contingency. A way of handling with try-catch.

```java
File file = new File("/path/of/a/non/existing/file);
FileInputStream fileInputStream = new FileInputStream(file);
```

For example, here when instantiating `File` object if the file is not present then it throws `FileNotFoundException` and its super class is `Exception` class which is checked at compile time.

#### Unchecked Exceptions:

Exceptions that are not checked during compile time are called unchecked exceptions. These exceptions occurs in run time.Furthermore, we don't have to declare unchecked exceptions in a method with the throws keyword. Some common unchecked exceptions in Java are `NullPointerException`, `ArrayIndexOutOfBoundsException` and `IllegalArgumentException`.

```java
private static void divideByZero() {
    int numerator = 1;
    int denominator = 0;
    int result = numerator / denominator;
}
```

For example, here when result is calculated it casues `ArithmaticException` which is a runtime exception.

![Java Exception Hierarchy](https://www.oracleimg.com/technetwork/articles/entarch/javaexceptions-107916.jpg)

#### When to use Checked and Unchecked:

From Oracle Java Documentation provides guidance on when to use checked exceptions and unchecked exceptions:

`“If a client can reasonably be expected to recover from an exception, make it a checked exception. If a client cannot do anything to recover from the exception, make it an unchecked exception.”`