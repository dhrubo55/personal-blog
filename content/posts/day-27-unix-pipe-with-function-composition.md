+++
category = ["Java", "100DaysOfJava"]
date = 2021-10-14T00:00:00Z
description = "Implementing a Unix pipe-like class in Java with Function composition."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day27"
summary = "Implementing a Unix pipe-like class in Java with Function composition."
title = "Day 27: Implementing a Unix pipe-like class in Java with Function composition"
[cover]
alt = "Day27"
caption = "Day27"
image = ""
relative = false

+++

Implementing a Unix pipe-like class in Java with `Function` composition.

Transcribed from the original LinkedIn image post.

```java
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

class Day27 {
    public static void main(String[] args) {
        Function<String, String> awk1 = commandLine -> {
            final String regex = "(\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2})";
            final Pattern pattern = Pattern.compile(regex, Pattern.MULTILINE);
            final Matcher matcher = pattern.matcher(commandLine);
            if (matcher.find()) {
                return matcher.group(0);
            }
            return "";
        };

        Function<List<String>, String> grepFirstOccurrence = history -> history.stream()
            .filter(str -> str.contains("docker"))
            .findFirst()
            .orElse("");

        Function<String, LocalDateTime> dateTimeToLocalDateTime = dateTimeText -> {
            DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            return LocalDateTime.parse(dateTimeText, dateTimeFormatter);
        };

        List<String> history = new ArrayList<>();
        history.add("876 2021-10-12 15:59:47 docker ps");
        history.add("877 2021-10-12 13:33:18 docker volume ls");

        LocalDateTime filteredResult = new Pipeline<>(grepFirstOccurrence)
            .pipeableCommand(awk1)
            .pipeableCommand(dateTimeToLocalDateTime)
            .execute(history);

        System.out.println(filteredResult);
    }

    static class Pipeline<input, output> {
        private final Function<input, output> function;

        Pipeline(Function<input, output> function) {
            this.function = function;
        }

        <intermediate> Pipeline<input, intermediate> pipeableCommand(Function<output, intermediate> anotherFunction) {
            return new Pipeline<>(input -> anotherFunction.apply(function.apply(input)));
        }

        output execute(input input) {
            return function.apply(input);
        }
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 27 LinkedIn post](/images/100daysofjava/linkedin/day27.png)](https://www.linkedin.com/feed/update/urn:li:share:6854420697683492864/)

