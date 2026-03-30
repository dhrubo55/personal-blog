+++
category = ["Java", "100DaysOfJava"]
date = 2021-08-17T00:00:00Z
description = "Stream.peek to get debug information and log it."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day19"
summary = "Stream.peek to get debug information and log it."
title = "Day 19: Stream.peek to get debug information and log it."
[cover]
alt = "Day19"
caption = "Day19"
image = ""
relative = false

+++

Stream.peek to get debug information and log it.

Transcribed from the original LinkedIn image post.

```java
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Date;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class Day19 {
    public static final Logger logger = LoggerFactory.getLogger(Day19.class);

    private static void logFileMetadata(File file) {
        Path path = Path.of(file.getAbsolutePath());
        BasicFileAttributes basicFileAttributes = null;
        try {
            basicFileAttributes = Files.readAttributes(path, BasicFileAttributes.class);
        } catch (IOException e) {
            e.printStackTrace();
        }

        logger.info(
            "File Name is {}\n Creation Time {}\n Size {}\n Last modified {}",
            file.getName(),
            new Date(basicFileAttributes.creationTime().toMillis()),
            basicFileAttributes.size() / 1024,
            new Date(basicFileAttributes.lastModifiedTime().toMillis())
        );
    }

    public static void main(String[] args) {
        List<File> selectedFilesForUpload = getFileList("/home/mohibulhasan/Downloads");
        selectedFilesForUpload.stream()
            .filter(File::exists)
            .map(File::getAbsoluteFile)
            .peek(Day19::logFileMetadata)
            .forEach(file -> FileUploadService.upload(file));
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 19 LinkedIn post](/images/100daysofjava/linkedin/day19.png)](https://www.linkedin.com/feed/update/urn:li:share:6833411009718435840/)


