+++
category = []
date = 2021-12-06T00:00:00Z
description = "Pair behavior in java"
showtoc = false
slug = "/java/100DaysOfJava/day35"
summary = "Pair behavior in java"
title = "Day 35: Emulating Pair in java using AbstractMap.SimpleEntry<>() and new Object() {} implementation"
[cover]
alt = "Day35"
caption = "Day35"
image = ""
relative = false

+++
While working need a structure like Pair in java so tired to emulate the behavior using AbstractMap.SimpleEntry<>() and a technique shared by [@starbuxman ](https://twitter.com/starbuxman/status/1449685459492212740)in his tweet about creating tuple using new Object(){} implementation.

```java
class Day35 {
    public static void main(String[] args) {
        DoubleStream doubleStream = DoubleStream.iterate(1.0 , d -> d+0.5);

        List<AbstractMap.SimpleEntry<Double, Double>> pairs =  doubleStream
                .limit(10)
                .mapToObj(number -> new AbstractMap.SimpleEntry<>(new Random().nextDouble(), number))
                .collect(Collectors.toList());

        pairs.forEach(pair -> {
          System.out.println(pair.getKey());
          System.out.println(pair.getValue());
        });

        Stream.generate(() -> new Random().nextDouble())
              .limit(10)
              .map(lon -> new Object() {
                 double lattitude = new Random().nextDouble();
                 double longitude = lon;
              }).forEach(tuple -> {
                  System.out.println(tuple.lattitude);
                  System.out.println(tuple.longitude);
              });

    }
}
```