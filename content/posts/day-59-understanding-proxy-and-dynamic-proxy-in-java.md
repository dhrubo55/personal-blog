+++
category = []
date = 2022-11-04T00:00:00Z
description = "Understanding Proxy and Dynamic Proxy in Java"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day59"
summary = "Understanding Proxy and Dynamic Proxy in Java"
title = "Day 59: Understanding Proxy and Dynamic Proxy in Java"
[cover]
alt = "day59"
caption = "day59"
image = ""
relative = false

+++
### Proxy

Proxy is a design pattern. We create and use proxy objects when we want to add or change some functionality of an existing class. The proxy object is used instead of the original one. Usually, the proxy objects have the same methods as the original one. In Java proxy classes usually extend the original class. The proxy has a handle to the original object and can call the method on that.


A proxy, in its most general form, is a class functioning as an interface to something else. In layman’s term, a proxy class in java is a class that delegates responsibility “in-place of” or “on behalf of” another class. The object, a proxy imitates is called the implementation object.


What is Proxy design pattern.

Types of Proxy in java

There are mainly 2 types of Proxy in Java 

1. Static Proxy
2. Dynamic Proxy

#### Static Proxy

Proxies that are written manually are referred to as static proxies. The following example is for a statc proxy

At first we can create an interface to be shared among the proxy and the real class. 

```java
public interface User {
	String getType();
}
```
now that we have an interface we can have its implementation of a particular user.

```java
public class FreeUser implements User {
	public String getType() {
    	return "free";
    }
}
```

Now we can create a `Proxy` interface that will extend User interface to get its behaviors which can be proxied by its implementations. 

```java
public interface ProxyUser extends User {
}
```
So `FreeUserProxy` can be implemented by implementing `ProxyUser`

```java
public class FreeUserProxy implements ProxyUser {
	private FreeUser freeUser = new FreeUser();
    private static final Logger log = LoggerFactory.getLogger(FreeUserProxy.class);
    
    public String getType() {
    	log.info("getType() called");
        return freeUser.getType();
    }
}
```

Now running the code from main class

```java
public class Day59 {
	public static void main(String [] args) {
    	User user = new FreeUserProxy();
        System.out.println(user.getType());
    }
}
```

dynamic proxy and its use case