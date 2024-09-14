+++
category = []
date = 2024-09-14T00:00:00Z
description = "Day 83: Java Object Cloning: Exploring Shallow and Deep Copy Techniques"
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day83"
summary = "Exploring shallow and deep copying of object in java"
title = "Day 83: Java Object Cloning: Exploring Shallow and Deep Copy Techniques"
[cover]
alt = "day83"
caption = "day83"
image = ""
relative = false

+++



When working with Java objects, it's crucial to understand how objects can be copied. Objects can be copied either shallowly or deeply, and grasping these concepts is essential when you need to duplicate an object's state without affecting the original object.

In this article, we'll explore various methods of creating deep and shallow copies of objects in Java, including some optimized approaches and potential pitfalls to avoid.

### Shallow Copy

A shallow copy creates a new object but references the same elements as the original object. In other words, the new object contains copies of the values of the original object's fields, but any references to other objects remain the same.

Here's an example of creating a shallow copy in Java:

```java
public class Person {
    private String name;
    private int age;
    private List<PhoneNumber> phoneNumbers;

    public Person(String name, int age, List<PhoneNumber> phoneNumbers) {
        this.name = name;
        this.age = age;
        this.phoneNumbers = phoneNumbers;
    }
    // getters & setters
}
```

Now let's see how shallow copying works:

```java
@Test
void givenPersonObject_whenShallowCopied_thenCopyHasSameDataButDifferentReference() {
    List<PhoneNumber> phoneNumbers = new ArrayList<>();
    phoneNumbers.add(new PhoneNumber("123-456-7890"));

    Person person1 = new Person("John Doe", 30, phoneNumbers);
    Person person2 = DeepCopyUtil.shallowCopy(person1);

    assertNotEquals(person1, person2);
    assertEquals("John Doe", person1.getName());
    assertEquals("John Doe", person2.getName());
    person2.setName("Jane Doe");
    assertEquals("John Doe", person1.getName());
    assertNotEquals("John Doe", person2.getName());

    person2.getPhoneNumbers().add(new PhoneNumber("456-789-0123"));
    assertEquals(2, person1.getPhoneNumbers().size());
}
```

In this example, when we assign `person1` to `person2`, we're creating a shallow copy. As a result, both `person1` and `person2` refer to the same `Person` object in memory. Modifying the `phoneNumbers` property of `person2` also affects the `phoneNumbers` property of `person1`.

###  Shallow Copy Methods

There are several ways to create shallow copies in Java:

1. **Assignment Operator**: The simplest form of shallow copy.
   ```java
   Person person2 = person1; // Shallow copy
   ```

2. **Object.clone() method**: Requires implementing the `Cloneable` interface.
   ```java
   public class Person implements Cloneable {
       // ... fields and other methods ...

       @Override
       public Object clone() throws CloneNotSupportedException {
           return super.clone();
       }
   }
   ```

3. **Copy Constructor**: Can be used for shallow copying if it only copies references.
   ```java
   public Person(Person other) {
       this.name = other.name; // Shallow copy of reference
       this.age = other.age;
   }
   ```

### Does Using Clone() make a Deep Copy?

The `clone()` method typically creates a shallow copy, not a deep copy. This means that while it creates a new object, it doesn't create new instances of the mutable objects contained within the original object.

Here's an example using the `Cloneable` interface:

```java
public class PersonCloneable implements Cloneable {
    private String name;
    private int age;
    private List<PhoneNumber> phoneNumbers;

    public PersonCloneable(String name, int age, List<PhoneNumber> phoneNumbers) {
        this.name = name;
        this.age = age;
        this.phoneNumbers = phoneNumbers;
    }

    @Override
    public PersonCloneable clone() throws CloneNotSupportedException {
        return (PersonCloneable) super.clone();
    }

    // Getters & setters
}
```

Now let's look at a test to understand it better:

```java
@Test
void givenPersonCloneableObject_whenCloned_thenShallowCopyIsCreated() throws CloneNotSupportedException {
    List<PhoneNumber> phoneNumbers = new ArrayList<>();
    phoneNumbers.add(new PhoneNumber("123-456-7890"));
    PersonCloneable original = new PersonCloneable("John Doe", 30, phoneNumbers);

    PersonCloneable clone = original.clone();

    clone.setName("Jane Doe");
    clone.setAge(25);
    clone.getPhoneNumbers().add(new PhoneNumber("987-654-3210"));

    assertEquals("John Doe", original.getName());
    assertEquals(30, original.getAge());

    assertEquals(2, original.getPhoneNumbers().size());
    assertEquals(2, clone.getPhoneNumbers().size());
}
```

In this example, we use the `clone()` method to create a shallow copy of the `PersonCloneable` object. This creates a new `PersonCloneable` object with its own memory location, independent of the original `person1` object.

However, modifying the `phoneNumbers` property of the clone affects the `phoneNumbers` of the original. That's one of the potential issues of using `clone()`, as it makes shallow copies, not deep copies.

### Potential Issues with Clone()

While the `clone()` method can be used to create copies of objects, it has some significant issues:

1. **Needs Cloneable interface**: To use the `clone()` method, a class must explicitly implement the `Cloneable` interface. By default, the `clone()` method is protected in the `Object` class, and if a class doesn't implement it, trying to use `clone()` will result in a `CloneNotSupportedException`.

2. **Default Shallow Copy**: The default `clone()` method in the `Object` class creates a shallow copy. This means that if the object contains references to other mutable objects, the cloned object will still share those references with the original, rather than duplicating the referenced objects themselves.

3. **Security Concerns**: Overriding the `clone()` method allows for custom cloning behavior, but it also introduces potential security risks. Here's a more detailed explanation:

Imagine you're at a copy machine in an office. You're supposed to make an exact copy of a document, but someone has tampered with the machine. Instead of making a true copy, it might add or remove pages, or even worse, send a copy to someone else! That's similar to what can happen with the `clone()` method if it's not implemented correctly.

Here's why:

- **Unexpected Behavior**: When you override `clone()`, you're in charge of deciding exactly how the copying happens. If you're not careful, you might accidentally expose private data or create inconsistent objects.

- **The "Fake Copy" Problem**: A malicious subclass could override `clone()` to return a reference to itself instead of creating a new object. This could trick other parts of the code into thinking they have a fresh copy when they don't.

- **Bypassing Security Checks**: Normally, when you create an object, its constructor runs and can perform important security checks. But `clone()` bypasses the constructor, potentially creating objects in an insecure state.

- **Inconsistent State**: If `clone()` is interrupted (like by an exception), it might leave the new object half-created. This could lead to bugs or vulnerabilities if the code isn't prepared to handle partially-cloned objects.

Here's a simple example to illustrate:

```java
class SecretKeeper implements Cloneable {
    private String secretPassword = "1234";

    @Override
    public SecretKeeper clone() {
        try {
            SecretKeeper cloned = (SecretKeeper) super.clone();
            // Oops! We forgot to create a new String for secretPassword
            // Now the clone shares the same String reference as the original
            return cloned;
        } catch (CloneNotSupportedException e) {
            return null;
        }
    }

    public void changePassword(String newPassword) {
        this.secretPassword = newPassword;
    }
}

// In some other part of the code...
SecretKeeper original = new SecretKeeper();
SecretKeeper cloned = original.clone();

// The programmer thinks this only changes the clone's password
cloned.changePassword("5678");

// But surprise! It changed the original's password too
// because both objects are sharing the same String reference
```

In this example, a programmer using the `SecretKeeper` class might think they're safely changing only the cloned object's password, but they're actually changing the original object's password too. This could lead to serious security issues in a real application.

To avoid these pitfalls, many Java developers prefer to use copy constructors or factory methods for object copying. These approaches give you more control and make it easier to ensure that you're creating secure, consistent copies of objects.

### Deep Copy Methods

To perform a deep copy in Java, we have multiple options such as using a custom copy method or a copy constructor. Furthermore, we can leverage serialization and third-party libraries for this purpose. Below, we'll discuss deep copy methods including custom copy methods and serialization.

#### Custom Copy Method

One way to create a deep copy is to manually create new instances of all mutable objects. Here's an example:

```java
public Person deepCopy() {
    return new Person(new String(this.name), this.age);
}
```

#### Serialization

Java serialization is one of the most efficient ways of creating deep copies of an object. This approach works well for serializable objects (those that implement the `Serializable` interface). Using third-party libraries like Jackson and Gson, you can also do this.

For example, let's modify the `Person` class to make it serializable:

```java
public class PersonSerializable implements Serializable {
    private String name;
    private int age;
    private List<PhoneNumber> phoneNumbers;

    public PersonSerializable(String name, int age, List<PhoneNumber> phoneNumbers) {
        this.name = name;
        this.age = age;
        this.phoneNumbers = phoneNumbers;
    }
}
```

Now our custom `deepCopy()` method will use serialization-deserialization to copy an object:

```java
public static <T extends Serializable> T deepCopy(T object) {
    try {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(baos);
        oos.writeObject(object);
        ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(baos.toByteArray()));
        return (T) ois.readObject();
    } catch (IOException | ClassNotFoundException e) {
        throw new IllegalArgumentException(e);
    }
}
```

Here we are making deep copies of an object by serializing it into a byte array and then deserializing it from that byte array. This approach works well for creating a deep copy but requires that all objects in the graph are `Serializable`.

Now let's see its use:

```java
@Test
void givenPersonSerializableObject_whenDeepCopied_thenCopyIsIndependentOfOriginal() {
    List<PhoneNumber> phoneNumbers = new ArrayList<>();
    phoneNumbers.add(new PhoneNumber("123-456-7890"));
    PersonSerializable original = new PersonSerializable("John Doe", 30, phoneNumbers);
    PersonSerializable copy = DeepCopyUtil.deepCopy(original);

    assertNotSame(original, copy);
    assertEquals(original.getName(), copy.getName());
    assertEquals(original.getAge(), copy.getAge());

    copy.setName("Jane Doe");
    copy.setAge(25);
    copy.getPhoneNumbers().add(new PhoneNumber("987-654-3210"));

    assertEquals("John Doe", original.getName());
    assertEquals(30, original.getAge());

    assertEquals(1, original.getPhoneNumbers().size());
    assertEquals(2, copy.getPhoneNumbers().size());
}
```

This method serializes the object to a byte array and then deserializes it to create a new instance. From the test, we can see that it can effectively create a deep copy of the `PersonSerializable` object.

#### Other Deep Copy Methods

1. **JSON Serialization/Deserialization**: Use libraries like Jackson or Gson.
   ```java
   ObjectMapper mapper = new ObjectMapper();
   Person copy = mapper.readValue(mapper.writeValueAsString(original), Person.class);
   ```

2. **Cloning Libraries**: Use third-party libraries like Apache Commons Lang.
   ```java
   Person copy = SerializationUtils.clone(original);
   ```
3. **Using Reflection**:

Another powerful technique for creating deep copies is using reflection. This method allows you to create a deep copy of an object without the need for implementing `Cloneable` or writing custom constructors. It works by recursively copying the fields of an object, even if the fields are private or inaccessible. 

Here's an example of how to implement deep copying using reflection:


```java
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

public class DeepCopyUtil {

    // A map to track objects and their deep copies to handle cyclic dependencies
    private static Map<Object, Object> visited = new HashMap<>();

    public static Object deepCopy(Object object) throws IllegalAccessException, InstantiationException {
        // Check if the object is already copied (to handle cyclic dependencies)
        if (visited.containsKey(object)) {
            return visited.get(object); // Return the already-copied object
        }

        // If the object is null, no need to copy
        if (object == null) {
            return null;
        }

        Class<?> clazz = object.getClass();
        Object copy = clazz.newInstance(); // Create a new instance of the object
        visited.put(object, copy); // Register the object and its copy in the map

        // Copy each field of the object
        for (Field field : clazz.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(object);

            // Check if a deep copy is required
            if (value != null && isDeepCopyRequired(value)) {
                // Recursively copy the field, ensuring cyclic dependencies are handled
                field.set(copy, deepCopy(value));
            } else {
                // Directly copy the field if it's a primitive, string, or number
                field.set(copy, value);
            }
        }
        return copy;
    }

    private static boolean isDeepCopyRequired(Object value) {
        return !(value.getClass().isPrimitive() || value instanceof String || value instanceof Number);
    }

    public static void clearVisitedMap() {
        visited.clear(); // Clear the map after deep copying to avoid memory leaks
    }
}
```

This method works by:

1. Creating a new instance of the object's class.
2. Iterating through all declared fields of the object.
3. For each field, if it's not a primitive, String, or Number (which are immutable), it recursively applies the deep copy method.
Otherwise, it simply copies the value. Here the method might produce cyclic dependencies which can be resolved by checking if we already created the object. Thats why we have a `visited` map in the example to resolve that.

Let's see how we can use this method:

```java
public class Person {
    String name;
    Person friend; // Cyclic reference possible

    public Person(String name) {
        this.name = name;
    }
}

@Test
public void testDeepCopyWithCyclicDependency() throws Exception {
    Person john = new Person("John");
    Person jane = new Person("Jane");

    // Create cyclic dependency
    john.friend = jane;
    jane.friend = john;

    // Deep copy the object
    Person johnCopy = (Person) DeepCopyUtil.deepCopy(john);

    // Ensure deep copy is successful and cyclic references are handled
    Assertions.assertNotSame(john, johnCopy);
    Assertions.assertNotSame(jane, johnCopy.friend);
    Assertions.assertSame(johnCopy, johnCopy.friend.friend);

    // Clear the visited map to avoid memory leak
    DeepCopyUtil.clearVisitedMap();
}

```

This reflection-based deep copying technique has several advantages and disadvantages:

##### Pros:

It works without modifying your class or implementing interfaces.
It can copy private and protected fields.
It's a generic solution that can work with any object.

##### Cons:

This approach can be slower due to the use of reflection.
It might require handling some special cases, such as cyclic dependencies.
It may not work correctly with final fields or certain complex objects.

When using this method, be aware of its limitations and test thoroughly with your specific object structures. Also, consider the performance implications, especially when dealing with large object graphs or in performance-critical sections of your code.

### Optimized Approaches

1. **Copy-on-Write**: For collections, Java provides copy-on-write implementations like `CopyOnWriteArrayList`.
   ```java
   CopyOnWriteArrayList<Person> list = new CopyOnWriteArrayList<>();
   // Adding elements doesn't create a copy
   list.add(new Person("John", 30));
   // But modifying operations do
   list.set(0, new Person("Jane", 28));
   ```

2. **Immutable Objects**: If objects are immutable, shallow copying is effectively the same as deep copying.
   ```java
   public final class ImmutablePerson {
       private final String name;
       private final int age;

       public ImmutablePerson(String name, int age) {
           this.name = name;
           this.age = age;
       }

       // Only getters, no setters
   }
   ```

3. **Lazy Copying**: Implement a copy-on-write mechanism for individual fields.
   ```java
   public class LazyPerson {
       private String name;
       private int age;
       private LazyPerson original;

       public LazyPerson(String name, int age) {
           this.name = name;
           this.age = age;
       }

       public LazyPerson(LazyPerson other) {
           this.original = other;
       }

       public String getName() {
           if (original != null) {
               return original.getName();
           }
           return name;
       }

       public void setName(String name) {
           if (original != null) {
               this.name = original.name;
               this.age = original.age;
               original = null;
           }
           this.name = name;
       }

       // Similar for age
   }
   ```

### Conclusion

In this article, we've covered what shallow and deep copy means in Java. Shallow copies create new objects but maintain references to the same nested objects, while deep copies create entirely new objects with independent states, including nested objects.

We've explored various methods for creating both shallow and deep copies, including the `clone()` method, custom copy methods, serialization, and some optimized approaches. We've also discussed the potential security issues with using `clone()` and why many developers prefer alternative methods.

When choosing a copying method, consider the specific requirements of your application, including performance needs, object complexity, and maintenance considerations. Always profile your application to determine the most efficient method for your specific scenario.

Remember, the "best" approach often depends on the specific requirements of your application. Shallow copying might be sufficient for simple objects or when performance is critical, while deep copying is necessary when you need to create truly independent copies of complex object graphs.
