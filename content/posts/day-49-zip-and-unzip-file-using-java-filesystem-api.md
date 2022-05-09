+++
category = []
date = 2022-05-06T00:00:00Z
description = "Zip and Unzip file using Java FileSystem api"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day49"
summary = "Zip and Unzip file using Java FileSystem api"
title = "Day 49: A utility class for Zip and Unzip files using java FileSystem api (Part 2)"
[cover]
alt = "Day49"
caption = "Day49"
image = ""
relative = false

+++
In previous post we have explored and wrote a utility class for zipping and unzipping files and folders using java Zip api. Now we will see another api provided by java named `FileSystem` under `java.nio.file`.

#### FileSystem:

FileSystem api of java non-blocking io's file is an interface to underlying file system. It's the factory for object to access `File` and other objects in the file system.

The default file system, obtained by invoking the `FileSystems.getDefault()` method, provides access to the file system that is accessible to the Java virtual machine. The `FileSystems` class defines methods to create file systems that provide access to other types of (custom) file systems.

In java there are 3 file system providers.

A provider is a factory for one or more [`FileSystem`](https://docs.oracle.com/javase/7/docs/api/java/nio/file/FileSystem.html "class in java.nio.file") instances. Each file system is identified by a `URI` where the URI's scheme matches the provider's [`scheme`](https://docs.oracle.com/javase/7/docs/api/java/nio/file/spi/FileSystemProvider.html#getScheme()). The default file system, for example, is identified by the URI `"file:///"`. A memory-based file system, for example, may be identified by a URI such as `"memory:///?name=logfs"`. The [`newFileSystem`](https://docs.oracle.com/javase/7/docs/api/java/nio/file/spi/FileSystemProvider.html#newFileSystem(java.net.URI,%20java.util.Map)) method may be used to create a file system, and the [`getFileSystem`](https://docs.oracle.com/javase/7/docs/api/java/nio/file/spi/FileSystemProvider.html#getFileSystem(java.net.URI)) method may be used to obtain a reference to an existing file system created by the provider. Where a provider is the factory for a single file system then it is provider dependent if the file system is created when the provider is initialized, or later when the `newFileSystem` method is invoked. In the case of the default provider, the `FileSystem` is created when the provider is initialized.

#### FileSystemProviders:

A Service-provider class for file systems. A file system provider is a concrete implementation of this class that implements the abstract methods defined by this class. A provider is identified by a `URI` [`scheme`](https://docs.oracle.com/javase/7/docs/api/java/nio/file/spi/FileSystemProvider.html#getScheme()). The default provider is identified by the URI scheme "file". It creates the [`FileSystem`](https://docs.oracle.com/javase/7/docs/api/java/nio/file/FileSystem.html "class in java.nio.file") that provides access to the file systems accessible to the Java virtual machine. The [`FileSystems`](https://docs.oracle.com/javase/7/docs/api/java/nio/file/FileSystems.html "class in java.nio.file") class defines how file system providers are located and loaded. The default provider is typically a system-default provider but may be overridden if the system property `java.nio.file.spi.DefaultFileSystemProvider` is set. In that case, the provider has a one argument constructor whose formal parameter type is `FileSystemProvider`. All other providers have a zero argument constructor that initializes the provider.

#### ZipFileSystemProvider:
The zip file system provider treats a zip or JAR file as a file system and provides the ability to manipulate the contents of the file. The zip file system provider creates multiple file systems — one file system for each zip or JAR file.

ZipFileSystemProvider to create a `Folder.zip` and archive a single file and a direcotry/folder


##### Single File to Zip file

```java
public static void ZipSingleFile(Path source, String fileName) {
            if (!Files.isRegularFile(source)) {
                System.err.println("Please provide a file.");
                return;
            }

            Map<String, String> env = new HashMap<>();
            // Create the zip file if it doesn't exist
            env.put("create", "true");

            URI uri = URI.create("jar:file:/home/mohibulhasan/Documents/" + fileName);

            try (FileSystem zipFileSystem = FileSystems.newFileSystem(uri, env)) {
                Path pathInZipfile = zipFileSystem.getPath(source.getFileName().toString());

                // Copy a file into the zip file path
                Files.copy(source, pathInZipfile, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }

        }
```

##### Folder to Zip:

```java
public static void zipFolder(Path source) throws IOException {

    // get current working directory
    String currentPath = System.getProperty("user.dir") + File.separator;

    // get folder name as zip file name
    // can be other extension, .foo .bar .whatever
    String zipFileName = source.getFileName().toString() + ".zip";
    URI uri = URI.create("jar:file:" + currentPath + zipFileName);

    Files.walkFileTree(source, new SimpleFileVisitor<>() {
        @Override
        public FileVisitResult visitFile(Path file, BasicFileAttributes attributes) {

            // don't copy symboliclink as its not supported
            if (attributes.isSymbolicLink()) {
                return FileVisitResult.CONTINUE;
            }

            Map<String, String> env = new HashMap<>();
            env.put("create", "true");

            try (FileSystem zipfs = FileSystems.newFileSystem(uri, env)) {

                Path targetFile = source.relativize(file);
                Path pathInZipfile = zipfs.getPath(targetFile.toString());

                // NoSuchFileException, need create parent directories in zip path
                if (pathInZipfile.getParent() != null) {
                    Files.createDirectories(pathInZipfile.getParent());
                }

                // copy file attributes
                CopyOption[] options = {StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.COPY_ATTRIBUTES, LinkOption.NOFOLLOW_LINKS};
                // Copy a file into the zip file path
                Files.copy(file, pathInZipfile, options);

            } catch (IOException e) {
                e.printStackTrace();
            }

            return FileVisitResult.CONTINUE;
        }

        @Override
        public FileVisitResult visitFileFailed(Path file, IOException exc) {
            System.err.printf("Unable to zip : %s%n%s%n", file, exc);
            return FileVisitResult.CONTINUE;
        }

    });

}
```

In this case by accessing and then copying the file from the `Folder,zip` file to and external folder will behave like unzip.