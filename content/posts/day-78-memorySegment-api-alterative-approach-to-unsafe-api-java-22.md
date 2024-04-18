+++
category = []
date = 2024-04-04T00:00:00Z
description = "Day 78: Java 22 - Embracing Safe Memory Allocation Using MemorySegment and Arena API - An alternative to Unsafe API"
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day78"
summary = "Day 78: Java 22 - Embracing Safe Memory Allocation Using FFM API - An alternative to Unsafe API"
title = "Day 78: Java 22 - Embracing Safe Memory Allocation Using FFM API - An alternative to Unsafe API"
[cover]
alt = "day78"
caption = "day78"
image = ""
relative = false

+++

In my previous blog post I talked about Java Unsafe API and how to use it to make a Memory Allocator. Now as Java 22 released new FFM API is here to provide safety that we didnt had while using Java Unsafe API to allocate off the heap memory. In this post I will discuss about the new api and how it works and how we can use this to create safe memory allocator.


## MemorySegment API and Arena in Java FFM

The Foreign Function and Memory (FFM) API introduced in Java 20 allows Java programs to interoperate with code and data outside of the Java runtime. This API provides a safer and more controlled way to interact with native code compared to JNI. One of the key components of the FFM API is the MemorySegment API, which provides a Java representation of off-heap memory. Arena, on the other hand, is a memory management construct that controls the lifecycle of memory segments.

### MemorySegment API

A MemorySegment object represents a contiguous block of off-heap memory. It provides methods to allocate, deallocate, access, and deallocate memory. Memory segments are language-agnostic, meaning they can be used to hold any type of data, not just Java objects.

Here are some of the key features of the MemorySegment API:

#### Allocation and Deallocation: 
Memory segments can be allocated in various ways, including fixed-size allocations and allocations that grow or shrink as needed.
####  Access: 
Memory segments can be accessed using Java byte buffers, which provide a familiar way to work with raw memory.
#### Deallocation: 
Memory segments can be explicitly deallocated when they are no longer needed. This helps to avoid memory leaks.

### Arena

An Arena is a memory management construct that simplifies the lifecycle management of memory segments. It provides a pool of memory that can be used to allocate memory segments. Arenas can be configured with different memory allocation strategies and deallocation behavior.

Here are some of the key benefits of using arenas:

#### Improved Memory Management: 
Arenas simplify memory management by providing a centralized pool of memory for allocation.
#### Reduced Memory Fragmentation: 
Arenas can help to reduce memory fragmentation by allocating memory segments from a contiguous block.
#### Thread Safety: 
Arenas are thread-safe, meaning that multiple threads can safely allocate and deallocate memory segments from the same arena.

An arena manages access to native memory and ensures that allocated memory blocks are released again and that we do not access memory that has already been released.

There are four types of arenas that we can create using static factory methods of the Arena class:

- Global arena
- Automatic arenas (managed by the garbage collector)
- Confined arenas
- Shared arenas


### Memory Allocator and De-allocator with Arena and MemorySegment

Here's an example of a simple memory allocator and de-allocator class that uses an Arena to allocate and deallocate memory segments for writing strings:

```java
import java.lang.foreign.*;

public class MemoryAllocator {

    private static final Arena arena = Arena.create();

    public static MemorySegment allocate(int size) {
        return arena.allocate(size);
    }

    public static void deallocate(MemorySegment segment) {
        segment.close();
    }
}
```

now using the `MemoryAllocator` class

```java
    public Class Day78 {
        public static void main(String[] args) {
        
        //Initialize
        MemorySegment segment = allocate(100);

        //write hello world to the initialized memory segment
        segment.getByteBuffer(0, 100).put("Hello, world!".getBytes());

        //read from the memory segment
        byte[] bytes = new byte[100];
        segment.getByteBuffer(0, 100).get(bytes);
        String message = new String(bytes);
        System.out.println(message);

        // deallocate the memorySegment
        deallocate(segment);
    }
}
```

Here `private static final Arena arena = Arena.create();` This line creates a single, static instance of Arena and assigns it to the arena field. An Arena is a memory pool used to allocate memory segments. Since this is declared static and final, only one Arena instance is created for the entire class and its behavior cannot be changed after initialization.

`public static MemorySegment allocate(int size)` This is a public static method named allocate. It takes an integer size as input and returns a MemorySegment object. This method delegates the allocation task to the arena instance by calling arena.allocate(size). It essentially requests a block of off-heap memory of the specified size from the Arena pool.

`public static void deallocate(MemorySegment segment)` This is another public static method named deallocate. It takes a MemorySegment object as input and doesn't return any value (void). This method calls segment.close() to release the memory segment back to the Arena pool. It signifies that the allocated memory is no longer needed.

For further learning you can visit this java documentation. https://docs.oracle.com/en/java/javase/20/core/foreign-function-and-memory-api.html#GUID-1CA5C639-6C65-45A7-85E5-7926DB0D6A32