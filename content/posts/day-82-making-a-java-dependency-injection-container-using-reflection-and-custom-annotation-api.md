+++
category = []
date = 2024-07-04T00:00:00Z
description = "Day 82: Reflection in Java: Building a Simple DI Container in 100 Lines of Code"
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day82"
summary = "making a minimal spring like java dependency injection container using java reflection and annotation api"
title = "Day 82: Reflection in Java: Building a Simple DI Container in 100 Lines of Code"
[cover]
alt = "day82"
caption = "day82"
image = ""
relative = false

+++



Reflection in Java is a powerful concept that serves as the backbone for numerous Java and J2EE frameworks [1]. This feature allows an executing Java program to examine or **introspect** upon itself, and manipulate its internal properties at runtime [2]. While it's of limited use in everyday programming, reflection plays a crucial role in various frameworks that lack direct access to user-defined classes, interfaces, and their methods.

### What is this introspect
Imagine giving a program a magic mirror that lets it see and understand itself. That's what introspection does in Java. It's like the code is able to figure out what it is and what it can do, all while it's running.

This self-examination superpower is super handy. It helps debuggers peek inside code, powers those handy autocompletions in your IDE, and even helps convert data between different formats. It's all thanks to some clever Java tools that let programs ask themselves questions like "What am I?" or "What can I do?"
While it's a cool trick, it needs to be used carefully. Overdo it, and your program might slow down or accidentally reveal things meant to be secret. But when used right, it's like giving your code X-ray vision – a powerful tool that opens up a world of possibilities for flexible, dynamic programming.

### Understanding Reflection API
The Reflection API provides developers with the ability to analyze and modify class fields and methods during runtime [1]. It offers several methods to examine Class fields, invoke methods, and create new instances of classes by invoking constructors [1]. To use reflection, developers typically follow three steps:

- Obtain a `java.lang.Class` object for the class to manipulate.
- Use the Class object to gather information about the class.
- Utilize reflection classes like Method from `java.lang.reflect` to perform operations.

One practical application of reflection is in JavaBeans, where software components can be manipulated visually via builder tools [2]. These tools use reflection to obtain the properties of Java components as they are dynamically loaded. Reflections another practical application

### Reflection for Runtime Type Introspection
Reflection enables runtime type introspection, allowing programs to examine and interact with objects whose types may not be known at compile time. This capability is particularly useful in scenarios where dynamic behavior is required. 

For instance, reflection can be used to:
- Simulate the instanceof operator using Class.isInstance method [2].
- Discover methods defined within a class [2].
- Examine constructors and data fields of a class [2].
- Invoke methods dynamically, even when the method name is specified during execution [2].
- Modify values of data fields in objects at runtime [2].

These capabilities make reflection a powerful tool for creating flexible and adaptable software systems. However, it's important to use reflection judiciously, as it can impact performance and potentially break encapsulation principles.

### Security Considerations with Reflection
While reflection offers significant flexibility, it also introduces security considerations that developers must address:
Potential for Code Injection: Unsafe use of reflection mechanisms can create unexpected control flow paths through an application, potentially bypassing security checks [3]. This vulnerability may allow attackers to create limited forms of code injection.

### Access Control Risks: 
Reflection can be used to access private fields and methods, potentially breaking encapsulation and leaking sensitive data [4]. This capability can lead to various malicious exploits, such as modifying supposedly immutable strings or revealing sensitive information from objects [4].

### Classloader Hierarchy Concerns: 
In shared hosting environments like Google App Engine, reflection could potentially be used to enumerate classes and methods from different users' WAR files if not properly restricted [4].

To mitigate these risks, developers should consider the following precautions:

#### Install and configure a SecurityManager to enforce access controls
Use the setAccessible() method judiciously, as it's subject to security checks governed by the setAccessChecks reflection permission [4].
Be cautious when using reflection to instantiate objects or invoke methods, especially with user-supplied input [3].
By understanding both the power and the potential risks of reflection, developers can leverage this feature effectively while maintaining the security and integrity of their applications.


### Exploring Dependency Injection Patterns
Dependency Injection (DI) is a design pattern in Java that aims to decouple classes from their dependencies, making code more flexible, testable, and maintainable [5]. It allows developers to move the dependency resolution from compile-time to runtime, resulting in loosely coupled and extendable applications [6]. There are several patterns for implementing dependency injection in Java, each with its own advantages and use cases.

#### Constructor Injection
Constructor injection involves passing dependencies as arguments to a class's constructor. This method ensures that all required dependencies are available upon object creation, making it ideal for mandatory dependencies [5]. Constructor injection supports immutability and state safety, as the object is either instantiated with a full state or not instantiated at all [7].

public class Car {
    private final Engine engine;
    private final Steering steering;

    @Autowired //Spring like
    @inject //JAX-RS
    public Car(Engine engine, Steering steering) {
        thisותs.engine = engine;
        this.steering = steering;
    }
}

This pattern is particularly useful when dealing with components that are essential for an object's functionality, such as a car needing an engine and steering [8].

#### Setter Injection
Setter injection utilizes setter methods to inject dependencies after object creation. This approach offers more flexibility but can make the class mutable [5]. It's preferred for optional dependencies that are not mandatorily required but can assist in some ways [8].
public class User {
    private String phoneNumber;

    @Autowired
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
}

Setter injection is suitable for scenarios where dependencies may change during the object's lifecycle or when dealing with optional components [7].

### Method Injection
Method injection involves injecting dependencies directly into methods where they are needed. This pattern is less common but can be useful in specific scenarios where dependencies are required only for certain operations.
public class MessageSender {
    @Autowired
    public void sendMessage(MessageService messageService, String message) {
        messageService.send(message);
    }
}

### Field Injection
Field injection directly injects dependencies into class fields, typically using annotations. While it results in less boilerplate code and can improve readability, it doesn't support immutability and can make testing more challenging [7].
public class EmailService {
    @Autowired
    private EmailClient emailClient;
}

When choosing a dependency injection pattern, developers should consider factors such as immutability, state safety, and the nature of the dependencies (mandatory vs. optional). Constructor injection is generally recommended for its support of immutability and clear dependency declaration, while setter injection offers more flexibility for optional dependencies [7].

To implement these patterns effectively, developers can use frameworks like Spring, which provide powerful dependency injection containers. These containers manage the creation and injection of dependencies, inverting the control flow and allowing for more modular and maintainable code [5].

## Designing a Lightweight DI Container
Designing a lightweight Dependency Injection (DI) container involves creating a framework that manages the creation and lifecycle of objects in an application. This approach allows developers to implement Inversion of Control (IoC), a design principle that separates the responsibility of creating and managing dependencies from the client classes [9]. A well-designed DI container enhances modularity, reusability, and testability of code by promoting loose coupling between components [10].

### Container Initialization
The first step in designing a lightweight DI container is to create an initialization mechanism. This process typically involves:
Defining an `AbstractBinder` or similar class to specify how dependencies should be created and managed [11].
Registering the binder with the application, often through a configuration file or programmatically [11].
Implementing a class that extends a framework-specific class (e.g., ResourceConfig in JAX-RS) to register the binder and specify the packages to scan for injectable components [11].

For example, in a JAX-RS application, the initialization might look like this:
public class MyApplication extends ResourceConfig {
    public MyApplication() {
        register(new MyApplicationBinder());
        packages(true, "com.mypackage.rest");
    }
}

This initialization sets up the container to manage dependencies within the specified package and its subpackages.

### Dependency Scanning and Registration
Once the container is initialized, it needs to scan for and register dependencies. This process involves:
- Scanning all clients under the root package and subpackages [9].
- Creating instances of client classes [9].
- Identifying services used in client classes, including member variables, constructor parameters, and method parameters [9].
- Recursively scanning for nested dependencies within services [9].
- Creating a map of all client classes and their dependencies [9].

During this phase, the container should also handle special cases, such as:

1. Validating if there are multiple implementations of an interface or no implementation at all [9].
2. Managing qualifiers for services or implementing autowiring by type when multiple implementations exist [9].
3. Resolving and Injecting Dependencies

The final step in the DI process is resolving and injecting dependencies. This involves:
- Creating instances of services identified during the scanning phase [9].
- Injecting (initializing) each service with its required dependencies [9].
- Providing methods to retrieve beans or services, such as getBean(Class classz) or getService(Class classz) [9].
- The injection process follows a specific order as defined by JSR330 [12]:
    1. Constructor injection
    2.Field injection
    3.Method injection

It's important to note that the order in which methods or fields annotated with @Inject are called is not defined by `JSR330`, so developers should not assume a specific order of injection [12].
To implement this lightweight DI container, developers can use annotations like @Inject to mark injection points [13]. For example:
public class Payroll {
    private EmployeeDatabase employeeDatabase;

    @Inject
    public Payroll(EmployeeDatabase employeeDatabase) {
        this.employeeDatabase = employeeDatabase;
    }
    // ... rest of the class implementation
}

This design allows for flexible configuration and easy testing, as dependencies can be easily mocked or stubbed [10]. It also promotes the use of immutable objects and makes dependencies explicit, which enhances code maintainability [10].
By implementing these components, developers can create a lightweight DI container that provides the benefits of dependency injection without the complexity of larger frameworks. This approach is particularly useful for standalone Java applications or when retrofitting legacy systems as part of major refactoring efforts [14].

Now lets implement a DI container 

At first we will see how the container is made up and then will create the services and load them in the container and use them to see.

![day82](https://res.cloudinary.com/dlsxyts6o/image/upload/v1723899273/images-from-blog/simple-di-in-java-day-82_umso8i.png)

```java
public class DIContainer {
    private final Map<Class<?>, Object> singletons = new ConcurrentHashMap<>();
    private final Map<Class<?>, Class<?>> implementations = new ConcurrentHashMap<>();

    public <T> void bindImplementation(Class<T> interfaceClass, Class<? extends T> implementationClass) {
        implementations.put(interfaceClass, implementationClass);
    }

    public <T> T getInstance(Class<T> clazz) {
        try {
            return getOrCreateInstance(clazz);
        } catch (Exception e) {
            throw new RuntimeException("Error creating instance of " + clazz.getName(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private <T> T getOrCreateInstance(Class<T> clazz) throws Exception {
        Class<?> targetClass = implementations.getOrDefault(clazz, clazz);

        if (targetClass.isAnnotationPresent(Singleton.class)) {
            return (T) singletons.computeIfAbsent(targetClass, this::createInstance);
        }

        return createInstance(targetClass);
    }

    @SuppressWarnings("unchecked")
    private <T> T createInstance(Class<?> clazz) {
        try {
            Constructor<?> constructor = findInjectableConstructor(clazz);
            T instance = (T) (constructor != null ?
                    createInstanceWithConstructor(constructor) :
                    clazz.getDeclaredConstructor().newInstance());

            injectFields(clazz, instance);
            injectMethods(clazz, instance);

            return instance;
        } catch (Exception e) {
            throw new RuntimeException("Error creating instance of " + clazz.getName(), e);
        }
    }

    private Constructor<?> findInjectableConstructor(Class<?> clazz) {
        return Arrays.stream(clazz.getDeclaredConstructors())
                .filter(c -> c.isAnnotationPresent(Inject.class))
                .findFirst()
                .orElse(null);
    }

    private Object createInstanceWithConstructor(Constructor<?> constructor) throws Exception {
        Object[] params = Arrays.stream(constructor.getParameterTypes())
                .map(this::getInstance)
                .toArray();
        return constructor.newInstance(params);
    }

    private void injectFields(Class<?> clazz, Object instance) throws Exception {
        for (Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(Inject.class)) {
                Object fieldInstance = getInstance(field.getType());
                field.setAccessible(true);
                field.set(instance, fieldInstance);
            }
        }
    }

    private void injectMethods(Class<?> clazz, Object instance) throws Exception {
        for (Method method : clazz.getDeclaredMethods()) {
            if (method.isAnnotationPresent(Inject.class)) {
                Object[] params = Arrays.stream(method.getParameterTypes())
                        .map(this::getInstance)
                        .toArray();
                method.setAccessible(true);
                method.invoke(instance, params);
            }
        }
    }
}
```
now let us break this class down. The DIContainer class is the core of our DI framework. It uses two main data structures:

- singletons: A thread-safe map to store singleton instances
- implementations: A map to store interface-to-implementation bindings

I use annotations and reflection to make the core features of the DI.

The bindImplementation method allows users to specify which implementation should be used for a given interface: This is useful when you want to inject an interface but use a specific implementation.

```java
public <T> void bindImplementation(Class<T> interfaceClass, Class<? extends T> implementationClass) {
    implementations.put(interfaceClass, implementationClass);
}
```


The public getInstance method is the entry point for retrieving instances: It delegates to getOrCreateInstance, wrapping any exceptions in a RuntimeException.

```java
public <T> T getInstance(Class<T> clazz) {
    try {
        return getOrCreateInstance(clazz);
    } catch (Exception e) {
        throw new RuntimeException("Error creating instance of " + clazz.getName(), e);
    }
}
```

The getOrCreateInstance method is where the magic happens: It first checks if there's a registered implementation for the requested class. If the target class is annotated with @Singleton, it uses computeIfAbsent to ensure thread-safe lazy initialization. Otherwise, it creates a new instance each time.

```java
private <T> T getOrCreateInstance(Class<T> clazz) throws Exception {
    Class<?> targetClass = implementations.getOrDefault(clazz, clazz);

    if (targetClass.isAnnotationPresent(Singleton.class)) {
        return (T) singletons.computeIfAbsent(targetClass, this::createInstance);
    }

    return createInstance(targetClass);
}
```


The createInstance method handles the actual object creation: It performs these steps:

1. Find an @Inject-annotated constructor
2. Create the instance using the constructor or default constructor
3. Inject fields
4. Inject methods
```java
private <T> T createInstance(Class<?> clazz) {
    try {
        Constructor<?> constructor = findInjectableConstructor(clazz);
        T instance = (T) (constructor != null ?
                createInstanceWithConstructor(constructor) :
                clazz.getDeclaredConstructor().newInstance());

        injectFields(clazz, instance);
        injectMethods(clazz, instance);

        return instance;
    } catch (Exception e) {
        throw new RuntimeException("Error creating instance of " + clazz.getName(), e);
    }
}
``

6. Constructor Injection

findInjectableConstructor looks for a constructor annotated with @Inject: If found, createInstanceWithConstructor handles the dependency injection: This method searches for a constructor annotated with @Inject. Here's what's happening:

1. We get all declared constructors of the class using clazz.getDeclaredConstructors() a reflection method that gets declared constructors.
2. We create a stream from this array of constructors
3. We filter the stream to keep only constructors annotated with @Inject
4. We take the first matching constructor (findFirst())
5. If no constructor is found, we return null (orElse(null))

This approach allows us to specify which constructor should be used for dependency injection. If no @Inject-annotated constructor is found, we'll fall back to using the default constructor.

```java
private Constructor<?> findInjectableConstructor(Class<?> clazz) {
    return Arrays.stream(clazz.getDeclaredConstructors())
            .filter(c -> c.isAnnotationPresent(Inject.class))
            .findFirst()
            .orElse(null);
}
```
`createInstanceWithConstructor()` This method creates an instance using the provided constructor. Here's the process:

- We get the parameter types of the constructor
- We create a stream of these types
- For each type, we call getInstance() to get or create an instance of that type
- We collect these instances into an array
Finally, we invoke the constructor with these parameters.This recursive approach ensures that all dependencies (and their dependencies) are properly instantiated.

```java
private Object createInstanceWithConstructor(Constructor<?> constructor) throws Exception {
    Object[] params = Arrays.stream(constructor.getParameterTypes())
            .map(this::getInstance)
            .toArray();
    return constructor.newInstance(params);
}
```

Field Injection The injectFields method handles field injection: 

We iterate over all declared fields of the class for each field annotated with @Inject

- We get an instance of the field's type using getInstance()
- We make the field accessible (in case it's private)
- We set the field's value on the instance to our newly created fieldInstance

This allows for dependency injection on fields, which can be useful for optional dependencies or when constructor injection isn't feasible.

```java
private void injectFields(Class<?> clazz, Object instance) throws Exception {
    for (Field field : clazz.getDeclaredFields()) {
        if (field.isAnnotationPresent(Inject.class)) {
            Object fieldInstance = getInstance(field.getType());
            field.setAccessible(true);
            field.set(instance, fieldInstance);
        }
    }
}
```

8. Method Injection

This method performs method injection: We iterate over all declared methods of the class

For each method annotated with @Inject:

- We get the parameter types of the method
- We create instances for each parameter type using getInstance()
- We make the method accessible
- We invoke the method on the instance with the created parameters



Method injection can be useful for optional dependencies or for performing post-construction initialization.

```java
private void injectMethods(Class<?> clazz, Object instance) throws Exception {
    for (Method method : clazz.getDeclaredMethods()) {
        if (method.isAnnotationPresent(Inject.class)) {
            Object[] params = Arrays.stream(method.getParameterTypes())
                    .map(this::getInstance)
                    .toArray();
            method.setAccessible(true);
            method.invoke(instance, params);
        }
    }
}
```

This DIContainer implementation provides a flexible and powerful dependency injection framework. It supports constructor, field, and method injection, as well as singleton management and interface-to-implementation binding. The use of reflection allows for a clean and non-invasive way to manage dependencies in your application.

Now let us see the Main class and how to use it. 


```java
interface MessageService {
    void sendMessage(String message);
}

@Singleton
class EmailService implements MessageService {
    public void sendMessage(String message) {
        System.out.println("Sending email: " + message);
    }
}

class UserService {
    private final MessageService messageService;

    @Inject
    public UserService(MessageService messageService) {
        this.messageService = messageService;
    }

    public void notifyUser(String message) {
        messageService.sendMessage(message);
    }
}

public class Main {
    public static void main(String[] args) {
        DIContainer container = new DIContainer();
        container.bindImplementation(MessageService.class, EmailService.class);

        UserService userService = container.getInstance(UserService.class);
        userService.notifyUser("Hello from, DI!");
    }
}
```

This example demonstrates a basic Dependency Injection (DI) setup using a custom container:

1. Component structure:
   - `MessageService`: An interface defining the contract for messaging.
   - `EmailService`: A concrete `@Singleton` implementation of `MessageService`.
   - `UserService`: A service with a dependency on `MessageService`.

2. DI configuration:
   - `UserService` uses constructor injection, marked with `@Inject`.
   - The DI container is configured to bind `MessageService` to `EmailService`.

3. Runtime behavior:
   - An `DIContainer` instance is created and configured.
   - When `getInstance(UserService.class)` is called, the container:
     a. Recognizes the `MessageService` dependency.
     b. Instantiates `EmailService` (or reuses the singleton instance).
     c. Injects the `EmailService` into `UserService`.
     d. Returns the constructed `UserService`.

4. Key DI principles demonstrated:
   - Inversion of Control (IoC): `UserService` doesn't create its dependencies.
   - Loose coupling: `UserService` depends on the `MessageService` interface, not the concrete `EmailService`.
   - Single Responsibility Principle: The DI container manages object creation and wiring.

5. Benefits:
   - Improved testability: Dependencies can be easily mocked.
   - Flexibility: Changing implementations (e.g., to an `SMSService`) requires only container reconfiguration.
   - Separation of concerns: Business logic is separated from object construction and wiring.

This setup showcases core DI concepts, illustrating how it promotes loosely coupled, modular, and easily maintainable code architecture.

To wrap up, reflection in Java proves to be a game-changer for building flexible and adaptable applications. Its ability to enable runtime introspection and modification has a profound impact on the development of frameworks and tools, particularly in the realm of dependency injection. The creation of a lightweight DI container showcases the practical application of reflection, demonstrating how it can be harnessed to implement sophisticated design patterns and improve code modularity.
The exploration of various dependency injection patterns and the design considerations for a DI container highlight the power of reflection to create more maintainable and testable code. By leveraging annotations and reflection, developers can craft systems that are not only more flexible but also easier to extend and modify over time. This approach to software design opens up new possibilities for creating robust and scalable applications, ultimately leading to more efficient development processes and higher-quality software products.

### References
[1] - https://www.digitalocean.com/community/tutorials/java-reflection-example-tutorial
[2] - https://www.oracle.com/technical-resources/articles/java/javareflection.html
[3] - https://owasp.org/www-community/vulnerabilities/Unsafe_use_of_Reflection
[4] - https://stackoverflow.com/questions/3002904/what-is-the-security-risk-of-object-reflection
[5] - https://www.geeksforgeeks.org/dependency-injection-di-design-pattern/
[6] - https://www.digitalocean.com/community/tutorials/java-dependency-injection-design-pattern-example-tutorial
[7] - https://www.javacodegeeks.com/2019/02/field-setter-constructor-injection.html
[8] - https://www.geeksforgeeks.org/spring-setter-injection-vs-constructor-injection/
[9] - https://dev.to/jjbrt/how-to-create-your-own-dependency-injection-framework-in-java-4eaj
[10] - https://www.geeksforgeeks.org/what-is-the-best-way-to-inject-dependency-in-java/
[11] - https://stackoverflow.com/questions/16216759/dependency-injection-with-jersey-2-0
[12] - https://www.vogella.com/tutorials/DependencyInjection/article.html
[13] - https://www.objc.io/issue-11/dependency-injection-in-java.html
[14] - https://stackoverflow.com/questions/1333438/is-there-a-simple-framework-allowing-for-dependency-injection-in-a-stand-alone-p

