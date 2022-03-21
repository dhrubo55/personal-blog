+++
category = []
date = 2022-03-16T00:00:00Z
description = "Implementing ObjectPool pattern to get any type object pooling"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day46"
summary = "Implementing ObjectPool pattern to get any type object pooling"
title = "Day 46: Writing a generic and thread safe ObjectPool to enable pooling for any type of class"
[cover]
alt = "Day46"
caption = "Day46"
image = ""
relative = false

+++
When objects are expensive to create and they are needed only for short periods of time it is advantageous to utilize the Object Pool pattern. The Object Pool provides a cache for instantiated objects tracking which ones are in use and which are available.

Here creating a `HttpClient` object pool to create `HttpClientPool` to get avaialbe and in use instances

To do that at first created a generic `ObjectPool<T>` where to create an Object pool we have to pass the type of the object and then extend a class to implement the abstraced behavior of the Object pools createing instance method `create()`.

`create()` method will create the instance and there are two sets to manage the instances. `available` set stores currently available instances from the pool and `in use` set stores in uses instances of the pool. By calling the `getInstance()` and `releaseInstance()` method we can get and release an instance to object pool.

```java
abstract class ObjectPool<T> {

        private final Set<T> available = new HashSet<>();
        private final Set<T> inUse = new HashSet<>();

        protected abstract T create();

        public synchronized T getInstance() {
            if (available.isEmpty()) {
                available.add(create());
            }
            var instance = available.iterator().next();
            available.remove(instance);
            inUse.add(instance);
            return instance;
        }

        public synchronized void releaseInstance(T instance) {
            inUse.remove(instance);
            available.add(instance);
        }

        @Override
        public synchronized String toString() {
            return String.format("Pool available=%d inUse=%d", available.size(), inUse.size());
        }
    }
```

when extending this abstract class, creating process should be implemented in the `create()` method.

```java
class HttpClientPool extends ObjectPool<HttpClient> {
        @Override
        protected HttpClient create() {
            return HttpClient.newHttpClient();
        }
    }
 ```
 