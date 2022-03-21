+++
category = []
date = 2022-03-16T00:00:00Z
description = "Implementing ObjectPool pattern to get any type object pooling"
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

to see how the ObjectPool works now we use it in a class.

```java
class Day46 {
   public static void main(String[] args) {
       HttpClientPool httpClientPool = new HttpClientPool();

       System.out.println(httpClientPool.toString());
       HttpClient httpClient1 = httpClientPool.getInstance();
       String releaseInstance = "Release Instance ";
       String getInstance = "Get Instance ";
       System.out.println(getInstance+ httpClient1);
       System.out.println(httpClientPool.toString());

       HttpClient httpClient2 = httpClientPool.getInstance();
       System.out.println(getInstance+ httpClient2);
       System.out.println(httpClientPool.toString());

       HttpClient httpClient3 = httpClientPool.getInstance();
       System.out.println(getInstance+httpClient3);
       System.out.println(httpClientPool.toString());

       System.out.println(releaseInstance+httpClient1);
       httpClientPool.releaseInstance(httpClient1);
       System.out.println(httpClientPool.toString());

       System.out.println(releaseInstance+httpClient2);
       httpClientPool.releaseInstance(httpClient2);
       System.out.println(httpClientPool.toString());

       HttpClient httpClient4 = httpClientPool.getInstance();
       System.out.println(getInstance+ httpClient4);
       System.out.println(httpClientPool.toString());

       HttpClient httpClient5 = httpClientPool.getInstance();
       System.out.println(getInstance+ httpClient5);
       System.out.println(httpClientPool.toString());
   }
}
```

here the output is
```Pool available=0 inUse=0
Get Instance jdk.internal.net.http.HttpClientImpl@75c072cb(1)
Pool available=0 inUse=1
Get Instance jdk.internal.net.http.HttpClientImpl@e50a6f6(2)
Pool available=0 inUse=2
Get Instance jdk.internal.net.http.HttpClientImpl@53ca01a2(3)
Pool available=0 inUse=3
Release Instance jdk.internal.net.http.HttpClientImpl@75c072cb(1)
Pool available=1 inUse=2
Release Instance jdk.internal.net.http.HttpClientImpl@e50a6f6(2)
Pool available=2 inUse=1
Get Instance jdk.internal.net.http.HttpClientImpl@e50a6f6(2)
Pool available=1 inUse=2
Get Instance jdk.internal.net.http.HttpClientImpl@75c072cb(1)
Pool available=0 inUse=3
```
at first pool does not have any instances then it creates and tag it as a in use instance1. then it does the same for instance2 and instance3 then it releases instance and thus the available set shows it have one instance then instance2 is released

so inuse = 1 and available = 2 and then again calling `etInstance()` gives instance from the `available` set, thus not creating any new instances of HttpClient