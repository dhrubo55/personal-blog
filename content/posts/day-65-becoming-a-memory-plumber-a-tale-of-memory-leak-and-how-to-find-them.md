+++
category = []
date = 2023-01-20T00:00:00Z
description = "A practical introduction to finding retained Java objects with heap dumps, VisualVM, Eclipse MAT, and bounded caches."
showtoc = false
slug = "/java/100DaysOfJava/day66"
summary = "How retained references create Java memory leaks, how heap tools expose them, and how cache bounds prevent one common failure mode."
topics = ["JVM & Performance"]
title = "Finding a Java memory leak with heap dumps and JMX"
featured = true
featuredOrder = 30
seriesLabel = "Day 66 of 100DaysOfJava"
[cover]
alt = "day65"
caption = "day65"
image = ""
relative = false

+++
### What a Java memory leak is

The garbage collector reclaims objects that are no longer reachable. It cannot reclaim an object while application code still holds a reference to it, even when the application no longer needs the object.

A Java memory leak is therefore a reachability problem. Retained objects accumulate, heap use grows across collection cycles, and the application eventually spends more time collecting garbage or runs out of memory. Heap dumps, VisualVM, Eclipse MAT, and JMX help identify which objects remain reachable and which references retain them.

As a software engineer, it’s important to understand the concept of memory leaks in Java. A memory leak is when an application continues to hold onto memory that it no longer needs and this can lead to performance issues or even system crashes. In Java, a common cause of such leaks is objects not being garbage collected as expected due to references still pointing at them from other parts of the code.

When an object is created in Java, the JVM (Java Virtual Machine) allocates space for it on the heap and then assigns a reference variable which points towards that allocated space. As long as there are any active references pointing towards this object, it will remain alive on heap until all these references are removed and GC (Garbage Collector) reclaims its resources back from Heap Memory Pool. If somehow some reference(s) remains active even after they have been used up by program logic then those objects become eligible for Garbage Collection but never get collected since their respective reference variables still point at them causing unnecessary accumulation of unused/unrequired Objects over time resulting into what we call “Memory Leak” issue with our Application Codebase leading into Performance Degradation & System Crashes eventually!

To avoid such problems one should keep track if their code has any potential chances where Object References might be left dangling without getting released explicitly using null assignments or try-catch blocks etc., so that GC can reclaim those resources back once they become eligible otherwise Memory Leaks would continue accumulating over time leading us into trouble!

### What problems it causes

Memory leaks in Java can be caused by a variety of factors such as incorrect garbage collection, resource leakage in APIs, unclosed streams or connections, poor coding practices etc. These issues can lead to decreased responsiveness from applications due to increased latency times; they may also result in OutOfMemoryError exceptions being thrown which causes applications to crash unexpectedly or become unstable over time due their inability handle large amounts of data efficiently anymore .

### Types of Memory Leaks

There are many ways memory leaks can occur in a java program. Some of them are

1. Static fields
2. Loitering objects
3. In memory cache not evicted
4. Unclosed resource
5. custom equals and hashcode implementation
6. Inner class that references outer classes
7. Finalization bug
8. Interned strings
9. Thread local

now let us understand these typical memory leak issues

#### static fields

heavy use of static variables can cause memory leaks. In Java, static fields have a lifetime that usually matches the entire lifetime of the running program / application (unless ClassLoader becomes eligible for garbage collection).

lets see a case

```java
public class Day65 {
    public static List<String> strings = new ArrayList<>();

    public void add() {
        for (int i = 0; i < 100000; i++) {
            list.add(new String());
        }
        System.out.println("check point add");
    }

    public static void main(String[] args) {
        System.out.println("Beforee calling add");
        new Day65().populateList();
        System.out.println("After calling add");
    }
}
```

here when observing with

#### Loitering Objects

These objects are allocated memory, but not used, and not garbage collected. These keep increasing the size of the JVM heap and represent memory leaks, which can cause an out-of-memory error or excessive overhead on the garbage collector.

Let's understand this scenario with an example, consider a stack backed by an array, and you implement pop this way:

```java
public T pop() {
    if (top == -1) {
        throw new NoSuchElementException();
    }
    T item = items[top--];
    return item;
}
```

Because the array holds a reference to the item at the former top of the stack, the item is still strongly reachable from the array and therefore won't be garbage collected. Furthermore, because of the way a stack works, the item is no longer externally accessible. Thus, the item is said to be "loitering". It hangs around for no reason.

The correct implementation of the pop method would be this:

```java
public T pop() {
    if (top == -1) {
        throw new NoSuchElementException();
    }
    T item = items[top];
    // Clear the reference to allow garbage collection
    items[top] = null;
    top--;
    return item;
}
```

By setting the array entry to null, the item is no longer reachable from the array. Therefore it is eligible for garbage collection.

Garbage collection isn't magic. It can do most of the work to clean up memory for you. But, you have to make sure you write your code correctly to eliminate unnecessary strong references. The garbage collector can't read your mind, and figure out that you didn't really mean to keep the strong reference.

#### In Memory Cache Eviction

when we build in memory cache (in this case Guava library) there is a possibility of memory leak when the cache get increased without clearing the cache. let us first understand what is cache eviction

##### Cache Eviction

Caches are small because cache memory is more expensive to produce and purchase. The small size of the cache limits the amount of data we can store. We need to consider what data we keep or remove over time. This dilemma is the core purpose behind cache eviction. It will depending on algorithms will remove some entries.

So by restricting the size or creating an eviction policy will ensure the cache doesn't grow uncontrollably.

In the below example we will see a cache without a size or eviction policy

```java
public class CustomCache<T> {
    private Cache<String, T> cache;

    //Constructor to build Cache Store
    public CustomCache() {
        cache = CacheBuilder.newBuilder().build();
    }


    public T get(String key) {
        return cache.getIfPresent(key);
    }

    //Method to put a new record in Cache Store with record key
    public void add(String key, T value) {
        if(key != null && value != null) {
            cache.put(key, value);
            System.out.println("Entry stored in "
                    + value.getClass().getSimpleName()
                    + " Cache with Key = " + key);
        }
    }
}
```

Now adding a size and cache eviction policy will help not to cause memory leak. In guava `CacheBuilder` by adding the properties `maximumSize` and `expireAfterAccess` will limit the size and when will be the entires will be deleted

```java
public CustomCache() {
        cache = CacheBuilder.newBuilder()
        					.maximumSize(100)
                            .expireAfterAccess(30, TimeUnit.MINUTES)
        					.build();
 }
```

Part 2 covers other causes of retained memory.

## Limitations

The cache example is intentionally small. It demonstrates one retention pattern, but it is not a production incident report. Heap growth can also come from expected load, large live data sets, native allocations, class loaders, threads, or an undersized heap. Confirm the retained path and object growth before changing code.
