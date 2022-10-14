+++
category = []
date = 2022-10-13T00:00:00Z
description = "Understanding details and compare use cases  of Random, ThreadLocalRandom and SecureRandom"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day57"
summary = "Understanding details and compare use cases  of Random, ThreadLocalRandom and SecureRandom"
title = "Day 57: Understand and compare use case of Random, ThreadLocalRandom and SecureRandom"
[cover]
alt = "day57"
caption = "day57"
image = ""
relative = false

+++
Random class

ThreadLocalRandom

* how it works
* where to use

SecureRandom

* how it works
* where to use

To generate random numbers in java there are 4 given ways by the api. In java 17 new generic api and some other api's was introduced.

1. Random Class
2. ThreadLocalRandom Class
3. SecureRandom Class
4. SplitabbleRandom Class

![](https://www.baeldung.com/wp-content/uploads/2022/01/2022-01-02-09_17_03-rng_old_api.png-_-Fotografije.png)Fig: Java 17 new RandomGenerator Interface

### Random:

The Random Class of the java.util package is used for generating a stream of pseudorandom numbers. It uses a 48-bit seed, and using a `Linear Congruential Formula`.

If we create two instances of the Random class with the same seed value and call the same sequence of methods for each . They both will return identical sequences of numbers. This property is enforced by specific algorithms defined for this class. The algorithms use a protected utility method which upon invocation can give up to 32 pseudorandomly generated bits.

Instances of `Random are thread–safe`. Although, if the same instances are used across threads they may suffer from `contention` and result in poor performance. The Instances of Random are `not cryptographically safe`. So should not be used for security-sensitive applications.

```java
public class Day57 {
  public static void main(String[] args) {
  	  long seed = 5;
      
      Random rng1 = new Random(seed)
      System.out.println(rng.nextInt());
      Random rng2 = new Random(seed)
      System.out.println(rng.nextInt());
      
      
      new Random(seed).ints(5, 10, 100)
                  .forEach(System.out::println);
  }
}
```