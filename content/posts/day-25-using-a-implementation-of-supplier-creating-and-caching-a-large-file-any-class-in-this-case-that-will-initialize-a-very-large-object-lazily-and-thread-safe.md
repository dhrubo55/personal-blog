+++
category = ["Java", "100DaysOfJava"]
date = 2021-09-21T00:00:00Z
description = "Using a implementation of supplier creating and caching a large file (any Class in this case that will initialize a very large object) lazily and thread-safe."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day25"
summary = "Using a implementation of supplier creating and caching a large file (any Class in this case that will initialize a very large object) lazily and thread-safe."
title = "Day 25: Using a implementation of supplier creating and caching a large file (any Class in this case that will initialize a very large object) lazily and thread-safe."
[cover]
alt = "Day25"
caption = "Day25"
image = ""
relative = false

+++

Using a implementation of supplier creating and caching a large file (any Class in this case that will initialize a very large object) lazily and thread-safe.

Transcribed from the original LinkedIn image post.

```java
import java.io.File;
import java.io.FileNotFoundException;
import java.util.Optional;
import java.util.function.Supplier;

class Day25 {
    public static void main(String[] args) throws Exception {
        FileLoader largeFileLoader = new FileLoader();
        File largeFile = largeFileLoader
            .getLargeFile()
            .orElseThrow(FileNotFoundException::new);
        System.out.println(largeFile.getName());
    }

    static class FileLoader {

        private Supplier<Optional<File>> largeFile =
            () -> createAndCacheFile("/home/mohibulhasan/Downloads/data.json");

        public FileLoader() {
            System.out.println("File Loader created");
        }

        public Optional<File> getLargeFile() {
            return largeFile.get();
        }

        private synchronized Optional<File> createAndCacheFile(String path) {
            class LargeFileFactory implements Supplier<Optional<File>> {
                private final File largeFileInstance = new File(path);

                @Override
                public Optional<File> get() {
                    return largeFileInstance.exists()
                        ? Optional.of(largeFileInstance) : Optional.empty();
                }
            }

            if (!(largeFile instanceof LargeFileFactory)) {
                largeFile = new LargeFileFactory();
            }

            return largeFile.get();
        }
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 25 LinkedIn post](/images/100daysofjava/linkedin/day25.png)](https://www.linkedin.com/feed/update/urn:li:share:6846070390435921922/)


