+++
category = []
date = 2022-10-06T00:00:00Z
description = "What is zero length Array and why its in java and how its used"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day56"
summary = "What is zero length Array and why its in java and how its used"
title = "Day 56: Zero length Array and Its use "
[cover]
alt = "day56"
caption = "day56"
image = ""
relative = false

+++
Recently from one of my senior colleagues LinkedIn post I learned about zero sized array in java. This raised some curiosity. So in this post I am going to share about the learning and findings i have found about zero length array in java. 

#### Zero Sized Array:

Not only java but also many other languages have zero sized array. In C its call variable length array as the array can have initialization using zero length. In the struct it can have the size initialized.

A zero length array is simply an array with nothing in it. It is an advantage to have such an array, especially in Java. So you can return a valid array and guarantee that your length check never fails. 

In Java, an array even of primitive types (i.e. int[]) is still an object. It has a length property. An array in Java can be null and it is easier to return null. But to have a method return a null and then checking it from the method caller is cumbersome. 

Thus a zero length array guarantees non-null returns. Which will also insure the call to `array.length` doesnt creates null pointer exception.

#### Use of Zero Sized Array:

There are many uses of zero length array. Few of them are listed below

1. String.getBytes() return
2. Calling a method of varargs parameter
3. Null object pattern ( Sending a empty object rather than null)
4. Empty Array from an empty  list

##### String.getBytes() return:

When calling getBytes() which will return a `byte[]` on empty string `""` what should be it's output? It will return a zero sized byte array.

```java
System.out.println(("".getBytes(StandardCharsets.UTF_8)).length);
```

##### Calling a method of vargargs parameter:

When calling a method who have a varargs parameter if we dont provide the varargs parameter with any value what will happen? It will still work. In this case the compiler is implicitly passing a zero sized array. For example the method is 

```java
    public static void printer(String s1, String ... s2) {
        System.out.println(s1);
        Arrays.stream(s2).forEach(System.out::println);
    }
```

and when calling the caller is passing a single argument.

```java
        printer("bar");
        printer("foo", new String[0]); // here passing the new String[0] will show a redundant warning
```

##### Null Object Pattern:

Instead of using a null reference to convey absence of an object (for instance, a non-existent file), one uses an object which implements the expected interface, but whose method body is empty. The advantage of this approach over a working default implementation is that a null object is very predictable and has no side effects: it does nothing.

For example, a function may retrieve a list of files in a folder and perform some action on each. In the case of an empty folder, one response may be to throw an exception or return a null reference rather than a list. Thus, the code which expects a list must verify that it in fact has one before continuing, which can complicate the design.


```java
    public static File[] getFileNames(String path) {
        File folder = Paths.get(path).toFile();
        return folder.listFiles() == null ? new File[0] : folder.listFiles();
    }
```

when executed from main 

```java
        //Replacement of nulls
        File[] files = getFileNames("/home/mohibulhassan/Downloads");
        System.out.println(files.length);
```