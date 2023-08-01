+++
category = []
date = 2023-07-26T00:00:00Z
description = "Can a HashMap Take Null or Empty String as a Key in Java? Lets see if it can or not and how does it impact serialization."
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day72"
summary = "Can a HashMap Take Null as a Key in Java?"
title = "Day 72: Can a HashMap Take Null or Empty String as a Key in Java?"
[cover]
alt = "day72"
caption = "day72"
image = ""
relative = false

+++

While working with a problem I came upon an intriguing question. Can a HashMap Take Null or Empty String as a Key in Java?. If possible how does it translate to the serialization and how popular libraries will handle this situation.

Before starting let us understand how does HashMap works in java. Sepcifically we will focus on the part of how it creates a hash for the hashmap.


### What is a Hashmap 

At the core of HashMap is the concept of hashing. When you put a key-value pair into a HashMap, the key is first hashed to determine its storage location within the underlying array. The hash code is an integer value computed from the key's contents using the key's `hashCode()` method.

>Now a question arises. Do null have a hashcode?

Lets see

```java
System.out.println(Objects.hashCode(null));
```

here I am using the native Objects class which havea hashCode(). It can create hash for the given object. In this case this method will return 0 for null. 

In jdk source code for HashMap class one can see that below method is implemented with the hashCode() method.

```java
        public final int hashCode() {
            return Objects.hashCode(key) ^ Objects.hashCode(value);
        }
```

this method calculates the hash code for a key-value pair by combining the hash codes of both the key and the value using the bitwise XOR (^) operation. The `Objects.hashCode()` method is used to obtain the hash codes for the key and value, and then they are XORed together to produce a single hash code.

So its returning a valid integer that will point to the bucket where the value will be stored. In this case what is a bucket? A bucket is a position in the underlying array, and multiple key-value pairs with the same hash code are stored in the same bucket as a linked list (known as a collision chain).

Now let us understand a little bit more about how this hash and storing works.

### HashMap Internal Array
Internally, a HashMap uses an array to store its elements. The size of this array is initially set to a default capacity, but it dynamically resizes and rehashes its elements as necessary to maintain efficient performance.

When a key-value pair is added to the HashMap, the key's hash code is used to compute an index in the array. If the bucket at that index is empty, the key-value pair is stored there. If there is already a key-value pair(s) in the bucket due to a hash code collision, the new key-value pair is linked to the existing ones as a part of the linked list.

### Hash Collision Handling
Hash collisions occur when two different keys have the same hash code. In such cases, multiple key-value pairs are stored in the same bucket as a linked list. To find the correct value associated with a key during retrieval, the HashMap traverses the linked list (collision chain) until it finds the key or reaches the end of the chain.

To improve performance and minimize the impact of hash collisions, it's crucial to have a good hash function that evenly distributes hash codes across the array. The ideal hash function produces distinct hash codes for distinct keys while avoiding excessive collisions.

>So back to the question from this we can understand that null can be a valid key for an Hashmap

Also its mention in the documenation of [https://github.com/openjdk/jdk/blob/c22cadf32fbfa206f089c9d73c3b7f3db069d47a/src/java.base/share/classes/java/util/HashMap.java#L43][jdk]. Now lets see can empty string can be a valid key. 

As an empty string still and String object in java so it will generate a valid hashcode when we do 

```java
System.out.println("".hashCode());
```
Similar to null it will generate a valid hashcode. By the way if you run both "" and null in `Objects.hashCode()` it will return 0 as int. From the code of `Objects.hashCode()` we can see why.

```java
public static int hashCode(Object o) {
        return o != null ? o.hashCode() : 0;
    }
```

Also from the hashCode implementation of string we can see

```java
    public int hashCode() {
        int h = hash; // hash by default 0
        if (h == 0 && value.length > 0) {
            char val[] = value;

            for (int i = 0; i < value.length; i++) {
                h = 31 * h + val[i];
            }
            hash = h;
        }
        return h;
    }
```
when the string is empty then it will return 0.

[def]: jdk