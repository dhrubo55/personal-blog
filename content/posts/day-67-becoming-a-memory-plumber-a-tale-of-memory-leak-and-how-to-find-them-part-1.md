+++
category = ["100DaysOfJava"]
date = 2023-01-21T00:00:00Z
description = "Finding memory leak by analyzing GC and memory dump using VisualVM and Eclipse MAT "
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
In my previous post  I briefly discussed about few types of memory leaks. In todays post going to further discuss about six other scenarios which can cause memory leaks. They are

1. Unclosed resource
2. custom equals and hashcode implementation
3. Inner class that references outer classes
4. Finalization bug
5. Thread local

### Unclosed Resources

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

### Custom .equals() and .hashCode() implementation

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

### Inner class that references outer classes

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

### ThreadLocal

ThreadLocal is a api that gives us the ability to store state to a particular thread, and thus allows us to achieve thread safety.

When using this construct, each thread will hold an implicit reference to its copy of a _ThreadLocal_ variable and will maintain its own copy, instead of sharing the resource across multiple threads, as long as the thread is alive.

Despite its advantages, the use of _ThreadLocal_ variables is controversial, as they're infamous for introducing memory leaks if not used properly. Joshua Bloch once commented on thread local usage that:

> “Can you cause unintended object retention with thread locals? Sure you can. But you can do this with arrays too. That doesn’t mean that thread locals (or arrays) are bad things. Merely that you have to use them with some care. The use of thread pools demands extreme care. Sloppy use of thread pools in combination with sloppy use of thread locals can cause unintended object retention, as has been noted in many places. But placing the blame on thread locals is unwarranted.” – Joshua Bloch

_ThreadLocals_ are supposed to be garbage collected once the holding thread is no longer alive. But the problem arises when we use _ThreadLocals_ along with modern application servers.

Modern application servers use a pool of threads to process requests, instead of creating new ones (for example, [the _Executor_](https://tomcat.apache.org/tomcat-7.0-doc/config/executor.html) in the case of Apache Tomcat). Moreover, they also use a separate `classloader`. Since ThreadPools in application servers work on the concept of thread reuse, they're never garbage collected; instead, they're reused to serve another request.

If any class creates a _ThreadLocal_ variable, but doesn't explicitly remove it, then a copy of that object will remain with the worker _Thread_ even after the web application is stopped, thus preventing the object from being garbage collected.

#### How does ThreadLocal Creates memory leak

* Each `Thread` has a private field `threadLocals`, which actually stores the thread-local values.
* Each _key_ in this map is a weak reference to a `ThreadLocal` object, so after that `ThreadLocal` object is garbage-collected, its entry is removed from the map.
* But each _value_ is a strong reference, so when a value (directly or indirectly) points to the `ThreadLocal` object that is its _key_, that object will neither be garbage-collected nor removed from the map as long as the thread lives.

In this example, the chain of strong references looks like this:

`Thread` object → `threadLocals` map → instance of example class → example class → static `ThreadLocal` field → `ThreadLocal` object.

Lets see an example of this

```java
public class Day67 {

    private static final ThreadLocal<List<String>> threadLocal = new ThreadLocal<>();

    public static void main(String[] args) throws InterruptedException {
        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            Thread thread = new Thread(() -> {
                List<String> list = new ArrayList<>();
                threadLocal.set(list);
                // add a lot of data to the thread-local list
                for (int j = 0; j < 100000; j++) {
                    list.add("This is a string that will consume some memory.");
                }
            });
            threads.add(thread);
            thread.start();
        }
        for (Thread thread : threads) {
            thread.join();
        }
        // At this point, all threads have completed execution.
        // However, the thread-local lists have not been cleared,
        // and will continue to consume memory until the program terminates.
    }
}
```

In this program, we define a ThreadLocal variable called threadLocal which stores a list of strings. We then create 10 threads and in each thread, we create a new list and add a lot of data to it. We then set this list as the value of the thread-local variable using threadLocal.set(list).

Because the ThreadLocal variable is thread-local, each thread has its own list and the lists are not shared between threads. However, since we are adding a lot of data to each list, they consume a significant amount of memory.

The problem is that once each thread has completed execution, the lists are not cleared. Because the ThreadLocal variable still holds a reference to each list, they will not be garbage collected and will continue to consume memory until the program terminates. This can lead to a memory leak, as the program's memory usage will continue to grow over time.

To avoid this, we should always make sure to clear the thread-local variables once we are done with them, by calling `threadLocal.remove()` at the end of each thread's execution.