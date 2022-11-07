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


### Types of Proxy in java

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


#### Usage 

Proxy pattern is used when we need to create a wrapper to cover the main object’s complexity from the client. Furthermore we can add additional behavior on the proxy object that can augment the proxied object.

#### Advantages 

1. A proxy can hide complex tasks such as making network communication, transaction management without changing the implementation.

2. Proxies can be used to insert custom behaviour/code on top of and without changing the implementation object. Sometimes the code of an external library is inaccessible to edit, custom behaviour can be inserted pre/post-execution of the method provided by such library. For example, you can write a proxy for java.net.HttpUrlConnection class to log all the external service call request without changing the implementation of HttpUrlConnection.

3. One of the other advantages of the proxy pattern is security. A remote proxy can be used to provide a proxy stub in client and call the implementation on the server.

#### Disadvantages

Sometimes static proxy can violate the dry principle, e.x The static proxy class defined is very specific to an implementation which means for every implementation a proxy needs to be explicitly defined and is a repeated work.

Consider a scenario where you have to implement a proxy to count method invocation for multiple class. If you are using a static proxy you will be defining multiple proxy class with duplicate logic over and over again.

In the example above through proxy, we are counting method invocation using a single line. If a proxy had 100 lines of code to persist a data in the database, and a bug was found in just one line, you would have to remember to change that line in each bit of duplicated code, throughout tens, or even hundreds, of additional proxies.


### Dynamic proxy 

Dynamic proxy is the proxy design pattern, in which the proxy object is created dynamically during runtime.

Proxy design pattern uses a proxy. which acts as a mediator between client and underlying real object. Programmer can perform access control, validation and additional action in proxy before delegating the request to real object.

Form the disadvantages of the `static` proxy, if we somehow at runtime we are able to create a proxy object based on the client's call and then perform generic action(logging action in our case) before delegating the call to the real object? Well, that is what dynamic proxies does.

The process in case of dynamic proxy is as following:

1. client calls some action on an object.
2. system creates a proxy object at runtime based on client's call.
3. proxy object calls a generic method to perform a generic action in case of each call.
4. after the action, proxy object delegates the call to real object.

So in a nutshell, if you have some generic action to perform, use dynamic proxy, but if you want each class to be treated differenlty (in some classes perform logging, in some don't, in some access control etc.) use simple proxy.

Now to create a dynamic proxy in java we can use Java Reflection to create dynamic implementations of interfaces at runtime. By using the class `java.lang.reflect.Proxy`.

Dynamic proxies can be used for many different purposes, e.g. database connection and transaction management, dynamic mock objects for unit testing, and other AOP-like method intercepting purposes.

We create dynamic proxies using the `Proxy.newProxyInstance()` method. The newProxyInstance() methods takes 3 parameters:

1. The ClassLoader that is to **load** the dynamic proxy class.
2. An array of interfaces to implement.
3. An InvocationHandler to forward all methods calls on the proxy to.