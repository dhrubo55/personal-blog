+++
category = ["100DaysOfJava"]
date = 2023-01-21T00:00:00Z
description = "Finding memory leak by analyzing GC and memory dump using VisualVM and Eclipse MAT "
draft = true
showtoc = true
slug = "/java/100DaysOfJava/day67"
summary = "Understanding and finding the causes and types of memory leaks and tools and suggestions to fix them"
title = "Day 67: Becoming a memory plumber; A tale of Memory Leak and how to find them ( part 2)"
[cover]
alt = "day67"
caption = "day67"
image = ""
relative = false

+++
1. What is memory leak
2. What problems it causes
3. Types
4. Analyzing tools
5. What to analyze and how
6. What can we do to prevent it
7. conclusion with example

previous post breifly discussed about few types of memory leaks. In todays post going to further discuss about six other scenarios which can cause memory leaks. They are

1. Unclosed resource
2. custom equals and hashcode implementation
3. Inner class that references outer classes
4. Finalization bug
5. Interned strings
6. Thread local

#### Unclosed Resources

Unclosed resource memory leak in Java occurs when an application fails to release resources such as file handles, sockets, and database connections after they are no longer needed. These unclosed resources can remain allocated for extended periods of time resulting in a gradual buildup of system memory. This type of leak is particularly dangerous because it often goes unnoticed until the system runs out of available RAM or disk space.

```java
public void getSaleResults() {
    try {
        URL url = new URL("http://api.com/saleResutlts");
        URLConnection urlConnection = url.openConnection();
        InputStream is = urlConnection.getInputStream();
        byte[] bytes = is.readAllBytes();
    } catch (IOException ioe) {
        ioe.printStackTrace();
    }
}
```

so to resolve this we should use `try-with-resource`

Java developers must be aware that any code which opens external resources such as files or databases should ensure that these are properly closed once their use has concluded. Failure to do so will result in a slow but steady increase in the amount of used memory on the system over time which can eventually lead to performance issues or even complete failure due to lack of available RAM and/or disk space on the machine hosting your application's process(es).

#### Custom .equals() and .hashCode() implementation

Custom .equals() and .hashCode() implementation can cause memory leaks in Java due to the way they are used. When a class implements these methods, it is responsible for managing its own state and ensuring that all objects of the same type have unique references. If this is not done properly, an object can be created but never garbage collected because it will always exist as a reference from another object or collection. This leads to more objects staying in memory than necessary which causes a gradual increase in system resources over time until eventually there is no longer enough available for other tasks leading to poor performance or even crashing of the application.

Let's see an example scenario, In HashSet and HashMap `.equals()` and `.hashCode()`uses these methods in many operations, and if they're not overridden correctly, they can become a source for potential memory leak problems.

```java
class SaleResult {
	int saleCount;
    boolean isSuccess;
    
    public SaleResult(int saleCount, boolean isSuccess) {
    	this.saleCount = saleCount;
        this.isSuccess = isSuccess;
    }
}
```

now if we set this object as key in a hashmap or hashset and if a string id for value of the cusomterId we would need to ensure they are unique as HashMap and HashSet dont allow duplicate keys.

```java
Map<SaleResult, Long> map = new HashMap<>();
for(int i=0; i<10000; i++) {
	map.put(new Person("jon"), 1);
}
System.out.println(map.size());
```

here we will see 1000 objects are being inserted and thus the size of the map is 1000. Here we're using SaleReuslt as a key. Since Map doesn't allow duplicate keys, the numerous duplicate SaleResult objects that we inserted as a key shouldn't increase the memory.

But since we haven't defined the proper equals() method, the duplicate objects pile up and increase the memory, which is why we see more than one object in the memory.

However, if we'd overridden the equals() and hashCode() methods properly, then only one Person object would exist in this Map. Let's take a look at the proper implementations of equals() and hashCode() for our SaleResult class:

```java
class SaleResult {
        int id;
        boolean isSuccess;

        public SaleResult(int id, boolean isSuccess) {
            this.id = id;
            this.isSuccess = isSuccess;
        }

      @Override
      public boolean equals(Object o) {
          if (o == this) return true;
          if (!(o instanceof SaleResult)) {
              return false;
          }
          SaleResult result = (SaleResult) o;
          return result.id == this.id;
      }

      @Override
      public int hashCode() {
          int hash = 7;
          hash = 31 * hash + id;
          return hash;
      }
}
```

now after this there will be only 1 instance of `SaleResult` in the hashmap after insert.

#### Inner class that references outer classes

This happens in the case of non-static inner classes (anonymous classes). For initialization, these inner classes always require an instance of the enclosing class. This type of leak occurs when the inner class holds a reference to the outer class. which prevents the garbage collector from reclaiming any memory associated with outer instance. This causes significant performance degradation and even application crashes if not addressed properly.

```java
 class SaleResult {
        long saleCount;

        public SaleResult(long saleCount) {
            this.saleCount = saleCount;
        }

        class SaleData {

        }

        SaleData getSaleData() {
            return new SaleData();
        }
    }
```

now if we run this program like this

```java
public class Day67 {
	public static void main(String args[]) {
    	List<SaleResult.SaleData> saleResults = new ArrayList<>();
        
        while(infiniteLoopFlag) { // for analyzing the program
        	saleResults.add(new SaleResult(10).getSaleData()):
        }
    }
}
```
the inner class `SaleData` will keep the reference of the Outer class `SaleResult` thus causing memory not to be GC.

Inner classes are useful for organizing code better, but it is important to consider their impact on memory management when using them in your program design. The best way to prevent this type of issue is through `proper usage of weak references` within the inner class implementation or using `static` classes. so that it does not maintain a strong reference back up into its parent or containing object graph structure while still providing access as needed at runtime.

### Using finalization

Sometimes using `finalize()` can cause memory leaks. Whenever a classes `finalize()` method is overridden, then objects of that class aren't instantly garbage collected. Instead, the GC queues them for finalization, which occurs at a later point in time. 

Additionally, if the code written in the finalize() method isn't optimal, and if the finalizer queue can't keep up with the Java garbage collector, then sooner or later our application is destined to meet an OutOfMemoryError.

### Interning String Manually

Though we dont do manual String interning

### Analyze for finding Memory leaks

In order analyze whether your program contains any potential Memory Leaks you will need some kind specialized tools like HeapHero , JProfiler , VisualVM etc., these allow you view what exactly happening under hood during runtime & identify problematic areas ahead time before problems start manifesting themselves on production environment

### Steps to prevent Memory leaks

To prevent Memory Leaks occurring its important ensure all resources get closed properly at end each operation ; try avoid creating too many temporary variables unnecessarily & keep track object lifetime create them only necessary basis then dispose off quickly once done with it ; finally make sure Garbage Collector running correctly so old unused objects get cleared up regularly thus freeing up valuable system resources

### Memory leak issue i faced in my work