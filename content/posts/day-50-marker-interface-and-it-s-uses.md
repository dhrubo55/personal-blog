+++
category = []
date = 2022-05-21T00:00:00Z
description = "Marker interface and it's uses"
draft = true
showtoc = false
slug = "/java/100daysofjava/day50"
summary = "Marker interface and it's uses"
title = "Day 50: Marker interface and it's uses"
[cover]
alt = "Day50"
caption = "Day50"
image = ""
relative = false

+++
At first lets understand what is an Interface in Java

### Interface:

An Interface in Java programming language is defined as an abstract type used to specify the behavior of a class. An interface in Java is a blueprint of a class. A Java interface contains static constants and abstract methods and from java 8 default implementations.

The interface in Java is a mechanism to achieve abstraction. There can be abstract methods in the Java interface, and method body for default methods. It is used to achieve abstraction and multiple inheritance in Java. In other words, you can say that interfaces can have abstract methods and variables. Java Interface also represents the IS-A relationship.

### Marker Interface:

Market Interface is an interface that has no method declarations or fields in it. It is used as a tag to let the compiler know it needs to add some special behavior to the class implementing the marker interface. That is why the marker interface is also known as the tag interface in Java. Some java interfaces have no members like

`java. lang.Cloneable`
`java.io.Serializable`

these both interfaces are Marker Interfaces because it has no members. Marker interfaces are used to mark a class for a purpose. Purpose does not require any additional functionality. 

`Use of Clonable & Serialization Marker interfaces are shown below.`

##### For Example

java.io.Serializable interface is defined into java.io classes

`ObjectInputStream`
`ObjectOutputStream`

Marker Interfaces provide runtime information about Object. So the compiler and the JVM have additional information about the Object.

**As we can see clonable and serialization implementes marker type interface so lets see example of both**

#### Clonable:

Cloneable interface is implemented by a class to make `Object.clone()` method valid thereby making field-for-field copy. This interface allows the implementing class to have its objects to be cloned instead of using a new operator.

```java
class Example implements Cloneable {
    int number;
    String str;
  
    // Example class constructor
    public Example(int i, String s)
    {
        this.number = number;
        this.str = str;
    }
  
    // Overriding clone() method
    // by simply calling Object class
    // clone() method.
    @Override
    protected Object clone()
        throws CloneNotSupportedException
    {
        return super.clone();
    }
}
  
public class Day50 {
    public static void main(String[] args)
        throws CloneNotSupportedException
    {
        Example anotherExample = new Example(20, "Example");
  
        // cloning 'anotherExample'is holding
        // new cloned object reference in example
  
        // down-casting as clone() return type is Object
        Example example = (Example) anotherExample.clone();
  
        System.out.println(example.number);
        System.out.println(example.str);
    }
}
```

#### Serializable:

It is a marker interface in Java that is defined in the `java.io` package. If we want to make the class serializable, we must implement the Serializable interface. If a class implements the Serializable interface, we can serialize or deserialize the state of an object of that class.

###### Serialization:

it is the action of converting an object into a byte stream. A mechanism in which the object state is read from the memory and written into a file or database. Deserialization (converting byte stream into an object) is the opposite of serialization means that object state reading from a file , database or over the network sending request and response and written back into memory is called deserialization of object.

**Serialization (writing) can be achieved with the ObjectOutputStream class and deserialization (reading) can be achieved with the ObjectInputStream class.**

Example:

```java
import java.io.Serializable;

public class User implements Serializable
{
    int id;
    String name;
    public User(int id, String name)
    {
        this.id = id;
        this.name = name;
    }
}
```
 now to write the user object in a file / database by serializing the data.
 
 ```java
 public class Day50 {

    public static void main(String args[])
    {
        try
        {
            //Creating the object
            User user = new User(000001,"Kasun");
            //Creating stream and writing the object
            FileOutputStream fos=new FileOutputStream("Users.txt");
            ObjectOutputStream out=new ObjectOutputStream(fos);
            out.writeObject(emp);
            out.flush();
            //closing the stream
            out.close();
            System.out.println("Data has been written to the file.");
        }
        catch(Exception e)
        {
            e.printStackTrace();
        }
    }
}
 ```
now to deserialize the object from the file

```java
public class Day50 {

    public static void main(String[] args) throws IOException, ClassNotFoundException {
        FileInputStream fis =  new FileInputStream("Users.txt");
        ObjectInputStream ois = new ObjectInputStream(fis);
        User user =  (User)ois.readObject();

        System.out.println("User Name: "+ user.name);
        System.out.println("User ID: "+ user.id);
        ois.close();
    }
}
```
reading data and deserialize the data to a `User` object from the **Users.txt** file.
