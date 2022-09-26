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
## **Static Block**

## 

In Java, **a static block executes code before the object initialization**. A static block is a block of code with a _static_ keyword:

    static {
        // definition of the static block
    }

Static initializer block or static initialization block, or static clause are some other names for the static block. **Static block code executes only once during the class loading**. The static blocks always execute first before the _main()_ method in Java because the compiler stores them in memory at the time of class loading and before the object creation.

A class can have multiple static blocks, and they will execute in the same order as they appear in the class:

    public class StaticBlockExample {
    
        static {
            System.out.println("static block 1");
        }
        
        static {
            System.out.println("static block 2");
        }
    
        public static void main(String[] args) {
            System.out.println("Main Method");
        }
    }

## **Instance Initializer Block**

## 

As the name suggests, **the purpose of the instance initializer block is to initialize the instance data members.**

The instance initializer block looks just like the static initializer block, but without the [_static_](https://www.baeldung.com/java-static) keyword:

    {
         // definition of the Instance initialization block
    }

**Static initializer blocks always execute before the instance initialization blocks because static blocks run at the time of class loading. However, the instance block runs at the time of instance creation.** The Java compiler copies initializer blocks into every constructor. Therefore, multiple constructors can use this approach to share a block of code:

    public class InstanceBlockExample {
    
        {
            System.out.println("Instance initializer block 1");
        }
        
        {
            System.out.println("Instance initializer block 2");
        }
        
        public InstanceBlockExample() {
            System.out.println("Class constructor");
        }
    
        public static void main(String[] args) {
            InstanceBlockExample iib = new InstanceBlockExample();
            System.out.println("Main Method");
        }
    }