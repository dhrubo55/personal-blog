+++
category = ["Java", "100DaysOfJava"]
date = 2021-09-06T00:00:00Z
description = "Using stream of streams and flatmapping it to concat multiple streams"
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day22"
summary = "Using stream of streams and flatmapping it to concat multiple streams"
topics = ["Language & APIs"]
title = "Day 22: Using stream of streams and flatmapping it to concat multiple streams"
[cover]
alt = "Day22"
caption = "Day22"
image = ""
relative = false

+++

Using stream of streams and flatmapping it to concat multiple streams

Transcribed from the original LinkedIn image post.

```java
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Stream;

class Day22 {
    public static void main(String[] args) {
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        List<String> publicHolidaysOfBD = List.of("16/02/2021", "21/02/2021", "14/04/2021", "17/03/2021");
        List<String> publicHolidaysOfUS = List.of("01/01/2021", "17/03/2021", "04/07/2021", "14/02/2021");
        List<String> publicHolidaysOfCA = List.of("01/01/2021", "20/04/2021", "01/07/2021", "17/03/2021");

        Stream<Stream<String>> streamConcat = Stream.of(
            publicHolidaysOfCA.stream(),
            publicHolidaysOfBD.stream(),
            publicHolidaysOfUS.stream()
        );

        streamConcat
            .flatMap(Function.identity())
            .map(convertToLocalDate(dateTimeFormatter))
            .forEach(System.out::println);
    }

    static Function<String, LocalDate> convertToLocalDate(DateTimeFormatter dateTimeFormatter) {
        return (date -> LocalDate.parse(date, dateTimeFormatter));
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 22 LinkedIn post](/images/100daysofjava/linkedin/day22.png)](https://www.linkedin.com/feed/update/urn:li:share:6840665221946843136/)


