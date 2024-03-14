+++
category = []
date = 2024-03-14T00:00:00Z
description = "Explore Something Unsafe : Crafting a Memory allocator using Java Unsafe API"
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day77"
summary = "Explore Something Unsafe : Crafting a Memory allocator using Java Unsafe API"
title = "Day 77: Explore Something Unsafe : Crafting a Memory allocator using Java Unsafe API"
[cover]
alt = "day77"
caption = "day77"
image = ""
relative = false

+++

In the realm of Java development, the `sun.misc.Unsafe` API stands as both a powerful tool and a notorious enigma. It offers a direct interface to native memory and low-level operations, granting developers unprecedented control over memory management and object manipulation. While officially designated as "unsafe" due to its potential for misuse, this API remains indispensable in certain scenarios, enabling performance optimizations and facilitating the implementation of critical functionality in numerous Java libraries and frameworks.

## Understanding the Intricacies of Unsafe API

At its core, the `Unsafe` API provides a means to perform operations typically restricted by the Java Virtual Machine (JVM) for safety reasons. These operations include direct memory access, object allocation and manipulation, thread synchronization, and more. By bypassing the usual safeguards of the JVM, developers can achieve performance gains and implement functionalities that would otherwise be impossible or impractical within the confines of standard Java.

One of the primary use cases of the `Unsafe` API is for off-heap memory management. Unlike Java's managed heap, which is subject to garbage collection and automatic memory management, off-heap memory managed via `Unsafe` offers greater control and reduced overhead. This is particularly beneficial in scenarios requiring predictable memory allocation and deallocation, such as high-performance computing, networking, and database systems.

`sun.misc.Unsafe` API in Java provides access to low-level, unsafe operations typically reserved for the JVM. It exposes methods that allow direct manipulation of memory, objects, and threads, bypassing some of Java's built-in safety mechanisms. Here's how it works and what it enables:

1. Memory Operations
2. Object Manipulation
3. Array Operations
4. Synchronization
5. Class and Native memory operations


## Unsafe: Bypassing the Guardrails

Java enforces memory safety through garbage collection and automatic memory management. The Unsafe API circumvents these mechanisms, allowing direct manipulation of memory addresses. This capability unlocks several functionalities:

- **Memory Allocation and Deallocation:** You can allocate off-heap memory (outside the JVM's managed heap) for performance-critical tasks. This is useful for large data structures or handling native data types.
- **Field and Array Manipulation:** The Unsafe API allows direct access and modification of fields and array elements, even if they are declared private or final. This can be helpful for performance optimization or implementing custom data structures.
- **Thread Management:** Unsafe provides low-level control over thread scheduling and synchronization. This is rarely used in practice due to the complexity and potential for race conditions.

## Unsafe and Native Memory: A Delicate Dance

The Unsafe API interacts with native memory (memory managed by the operating system) through pointers. These pointers hold memory addresses that the Unsafe API can use to:

- **Access Native Data Structures:** You can interact with C libraries or legacy code that relies on native data structures. The Unsafe API allows you to convert Java objects to their corresponding native memory representation for seamless data exchange.
- **Memory-Mapped Files:** Memory-mapped files allow you to work with a file as if it were part of your program's virtual memory. The Unsafe API facilitates this by creating mappings between file regions and memory addresses.

we will dive deep on the `Native memory operations` by writing a memory allocator and deallocator and using it to write something directly to the memory.

```java
import sun.misc.Unsafe;

public class CustomMemoryAllocator {
    private static final Unsafe unsafe = Unsafe.getUnsafe();
    private static final long BASE_OFFSET = unsafe.arrayBaseOffset(byte[].class);

    public static long allocateMemory(long bytes) {
        return unsafe.allocateMemory(bytes);
    }

    public static void freeMemory(long address) {
        unsafe.freeMemory(address);
    }

	public static void writeData(long address, byte[] data) { 
		for (int i = 0; i < data.length; i++) { 
			unsafe.putByte(address + i, data[i]); 
			} 
		}
	public static byte[] readData(long address, int length) { 
		byte[] data = new byte[length]; 
		for (int i = 0; i < length; i++) { 
			data[i] = unsafe.getByte(address + i); 
		} 
		return data; 
	}
}

```

Here we are  acquiring a static reference to the Unsafe object, the gateway for direct memory operations. - `private static final long BASE_OFFSET = unsafe.arrayBaseOffset(byte[].class);`: Determines the starting offset of byte arrays within memory, crucial for efficient manipulation. 

The `unsafe.arrayBaseOffset(byte[].class)`This is a method call on the `unsafe` object. The `arrayBaseOffset` method retrieves the base offset of the given array type. In this case, it's finding the base offset for `byte[]` arrays.

Then `allocateMemory(long bytes)` - Requests a memory block of the specified size from the operating system, bypassing JVM's heap. It returns a memory address representing the allocated block's start.

Then `freeMemory(long address)`: Deallocates the memory block associated with the given address, relinquishing it back to the OS. 
Crucial for preventing memory leaks in custom allocation scenarios.

Now let us use this to write string into an allocated memory and then free the memory 

```java
public class Day77 {

    public static void main(String[] args) {
        long address = CustomMemoryAllocator.allocateMemory(1024); // Allocate 1 KB of memory
        
        if (address != 0) { // Ensure memory allocation was successful
            System.out.println("Memory allocated successfully at address: " + address);
            
            // Write data to the allocated memory
            CustomMemoryAllocator.writeData(address, "Hello, World!".getBytes());
            
            // Read data from the allocated memory
            byte[] data = CustomMemoryAllocator.readData(address, 13); // Read 13 bytes
            System.out.println("Data read from memory: " + new String(data));
            
            // Free the allocated memory
            CustomMemoryAllocator.freeMemory(address);
            System.out.println("Memory freed successfully.");
        } else {
            System.err.println("Failed to allocate memory.");
        }
    }
}

```

In the above code we can see that we are storing the data and getting an address and if the memory allocation is successful then we write the data in the given address and then after reading it and printing it we deallocate the memory and clean it. This all are maintained by the run time and garbage collector.