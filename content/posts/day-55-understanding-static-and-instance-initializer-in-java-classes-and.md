+++
category = []
date = 2022-09-26T00:00:00Z
description = "Understanding java classe's static and instance initializer "
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day55"
summary = "Understanding java classe's static and instance initializer "
title = "Day 55: Understanding static and instance initializer in java classes and"
[cover]
alt = "day55"
caption = "day55"
image = ""
relative = false

+++
## **Static** initializer **Block**

## 

In Java, **a static initializer block executes code before the object instance initialization**. A static block is a block of code with a _static_ keyword

    static {
        // definition of the static block
    }

Static initializer block or static initialization block, or static clause are some other names for the static block. **Static block code executes only once during the class loading**. The static blocks always **execute first** before the **_main() _** in Java because the compiler stores them in memory at the time of class loading and before the object creation.

A class can have multiple static blocks, and they will execute in the same order as they appear in the class:

    public class Day55 {
    
        static {
            System.out.println("block 1");
        }
        
        static {
            System.out.println("block 2");
        }
    
        public static void main(String[] args) {
            System.out.println("Main Method");
        }
    }

## **Instance Initializer Block**

## 

As the name suggests, **the purpose of the instance initializer block is to initialize the instance data members.**

The instance initializer block looks just like the static initializer block, but without the _static_ keyword:

    {
         // definition of the Instance initialization block
    }

**Static initializer blocks always execute before the instance initialization blocks because static blocks run at the time of class loading. However, the instance block runs at the time of instance creation.** The Java compiler copies initializer blocks into every constructor. Therefore, multiple constructors can use this approach to share a block of code:

    public class Day55 {
    
        {
            System.out.println("Instance initializer block 1");
        }
        
        {
            System.out.println("Instance initializer block 2");
        }
        
        public Day55() {
            System.out.println("Class constructor");
        }
    
        public static void main(String[] args) {
            Day55 iib = new Day55();
            System.out.println("Main Method");
        }
    }

So now using both to create a `DateTimeFormatter` for `DateTimeFormatterBuilder()` to get a customized `DateTimeFormatter` intance and initialize it in static block and then use it to calculate today's date in the instance initializer block and printing todays date just by creating an instance of the class.

```java
class Day56 {


    private final static DateTimeFormatter DATE_TIME_FORMATTER;

    private static Day55 instance;

    public String today;

    // static initializer
    static {
        DATE_TIME_FORMATTER = new DateTimeFormatterBuilder()
                .appendLiteral("Day value -> ")
                .appendValue(ChronoField.DAY_OF_MONTH)
                .appendLiteral(" Month value -> ")
                .appendValue(ChronoField.MONTH_OF_YEAR)
                .appendLiteral(" Year value -> ")
                .appendValue(ChronoField.YEAR)
                .toFormatter();
        instance = new Day55();

    }

    // Instance Initializer
    {
        today = DATE_TIME_FORMATTER.format(LocalDateTime.now());

    }

    public static Day55 getInstance() {
        return instance;
    }
}
```

now the main method

```java
   public static void main(String[] args) {
        Day55 day55FromStaticInitialization = Day55.getInstance();
        System.out.println(day55FromStaticInitialization.today);
    }
```