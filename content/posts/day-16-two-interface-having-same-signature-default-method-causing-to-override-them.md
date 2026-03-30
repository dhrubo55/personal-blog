+++
category = ["Java", "100DaysOfJava"]
date = 2021-08-03T00:00:00Z
description = "Two interface having same signature default method causing to override them."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day16"
summary = "Two interface having same signature default method causing to override them."
title = "Day 16: Two interface having same signature default method causing to override them."
[cover]
alt = "Day16"
caption = "Day16"
image = ""
relative = false

+++

Two interface having same signature default method causing to override them.

Transcribed from the original LinkedIn image post.

```java
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

interface FileUploadExternalDevice {
    default void upload(File file, String path) throws IOException {
        Files.move(file.toPath(), Paths.get(path));
    }
}

interface FileUploadAPIEndpoint {
    default void upload(File file, String path) throws IOException {
        MultipartFile multiPartFile = multiPart(file);
        fileUploadService.storeFile(multiPartFile);
    }
}

class Day015 implements FileUploadExternalDevice, FileUploadAPIEndpoint {

    @Override
    public void upload(File file, String path) throws IOException {
        /*
        implementation
        or
        FileUploadExternalDevice.super.upload(file, path);
        or
        FileUploadAPIEndpoint.super.upload(file, path);
        */
    }
}
```

The original LinkedIn graphic is preserved below.

![Day 16 LinkedIn post](/images/100daysofjava/linkedin/day16.png)

