+++
category = ["Java", "100DaysOfJava"]
date = 2021-10-28T00:00:00Z
description = "Using ParameterizedTest and MethodSource to run the same file-presence test with different inputs."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day29"
summary = "Using ParameterizedTest and MethodSource to run the same file-presence test with different inputs."
topics = ["Metaprogramming"]
title = "Day 29: ParameterizedTest and MethodSource for repeated test inputs"
[cover]
alt = "Day29"
caption = "Day29"
image = ""
relative = false

+++

Using `ParameterizedTest` and `MethodSource` to run the same file-presence test with different inputs.

Transcribed from the original LinkedIn image post.

```java
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class Day29 {
    final static String PATH = "/home/mohibulhasan/Downloads";

    public boolean isFileAvailable(String relativeFilePath) {
        List<String> fileNames = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(Paths.get(PATH))) {
            fileNames = paths
                .filter(Files::isRegularFile)
                .map(Path::toAbsolutePath)
                .map(Path::toString)
                .collect(Collectors.toList());
        } catch (IOException e) {
            e.printStackTrace();
        }
        return fileNames.contains(relativeFilePath);
    }

    @ParameterizedTest(name = "{index} - Test with fileName : {0}")
    @MethodSource("fileNameProvider")
    public void testFilePresentOrNot(String fileName, boolean expectedResult) {
        assertEquals(expectedResult, isFileAvailable(fileName));
    }

    public static Stream<Arguments> fileNameProvider() {
        return Stream.of(
            Arguments.of(PATH + "/data.json", true),
            Arguments.of(PATH + "/404.txt", false)
        );
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 29 LinkedIn post](/images/100daysofjava/linkedin/day29.png)](https://www.linkedin.com/feed/update/urn:li:share:6859503859304407040/)

