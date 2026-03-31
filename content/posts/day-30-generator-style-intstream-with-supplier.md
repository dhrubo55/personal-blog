+++
category = ["Java", "100DaysOfJava"]
date = 2021-11-04T00:00:00Z
description = "Exploring a generator-style approach in Java with Supplier and IntStream.generate()."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day30"
summary = "Exploring a generator-style approach in Java with Supplier and IntStream.generate()."
topics = ["Language & APIs"]
title = "Day 30: Exploring a generator-style approach in Java with Supplier and IntStream"
[cover]
alt = "Day30"
caption = "Day30"
image = ""
relative = false

+++

Exploring a generator-style approach in Java with `Supplier` and `IntStream.generate()`.

Transcribed from the original LinkedIn image post.

```java
import java.util.function.Function;
import java.util.function.IntSupplier;
import java.util.stream.IntStream;

class Day30 {
    public static void main(String[] args) {
        Function<Integer, Integer> squareFunction = integer -> integer * integer;

        SupplierProvider squareSupplier = new SupplierProvider(squareFunction);

        IntStream myStream = IntStream.generate(squareSupplier);
        myStream.limit(10).forEach(System.out::println);
        System.out.println("---------------- INTERVAL ----------------");
        IntStream stream = IntStream.generate(squareSupplier);
        stream.limit(5).forEach(System.out::println);
    }

    static class SupplierProvider implements IntSupplier {
        int i = 0;
        Function<Integer, Integer> function;

        public SupplierProvider(Function<Integer, Integer> function) {
            this.function = function;
        }

        @Override
        public int getAsInt() {
            i++;
            return function.apply(i);
        }
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 30 LinkedIn post](/images/100daysofjava/linkedin/day30.png)](https://www.linkedin.com/feed/update/urn:li:share:6862015600714235905/)

