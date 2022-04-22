+++
category = []
date = 2022-04-11T00:00:00Z
description = "A utility class to zip and unzip files and directories"
showtoc = false
slug = "/java/100DaysOfJava/day48"
summary = "A utility class to zip and unzip files and directories"
title = "Day 48: A utility class for Zip and Unzip files using java Zip api (Part 1)"
[cover]
alt = "Day48"
caption = "Day48"
image = ""
relative = false

+++
In java there is api for Zip (archiving) and Unzip a file or a set of files and directory and then place its contents or the zip file in the directory.

In java there are two ways of zipping and unzipping file

1. Using `ZipInputStream` and `ZipOutputStream` with `ZipEntry`
2. Using [Zip File System Provider](https://docs.oracle.com/javase/8/docs/technotes/guides/io/fsp/zipfilesystemprovider.html "Zip File System Provider")

For `part 1` i will write a utility class using `ZipInputStream` and `ZipOutputStream` class to zip and unzip file and folder. In the subsequent part i will write about zip file system provider api

#### What is an archive in context of computer filesystem :

an archive file is **a computer file that is composed of one or more files along with metadata**. Archive files are used to collect multiple data files together into a single file for easier portability and storage, or simply to compress files to use less storage space.

#### ZIP File:

ZIP is an archive file format that supports lossless data compression.

A ZIP file may contain one or more files or directories that may have been compressed. The ZIP file format permits a number of compression algorithms.

In java when used ZipInputStream and ZipOutputStream we  can create zip file and by using ZipEntry to entry the file in the `.zip` file. To better understand ZipEntry a picture of files and its zip file and what are ZipEntry regarding that file is given below.

![](https://s1.o7planning.com/en/10195/images/18542.png)

#### Zip Single File:

Now to create a zip file of any particular file an utility class is created `ZipUtils` which will use `ZipInputStream` along with `ZipOutputStream` to zip and unzip any files. In this `ZipUtils` class the `zipSingleFile()` method will take the file path for

```java
 public static class ZipUtils {

        public static void zipSingleFile(Path source, Path zipFileName) throws IOException {

            if (!Files.isRegularFile(source)) {
                System.err.println("Please provide a file.");
                return;
            }

            try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipFileName.toString())); FileInputStream fis = new FileInputStream(source.toFile())) {

                ZipEntry zipEntry = new ZipEntry(source.getFileName().toString());
                zos.putNextEntry(zipEntry);

                byte[] buffer = new byte[1024];
                int len;
                while ((len = fis.read(buffer)) > 0) {
                    zos.write(buffer, 0, len);
                }
                zos.closeEntry();
            }
        }
    }
```

this `zipSingleFile()` takes two arguments one is the source file path and another is for where to store the created zip file and its name.

```java
class Day48 {
    public static void main(String[] args) throws IOException {
        final Path OUTPUT_ZIP_FILE = Path.of("/home/mohibulhasan/Documents/Folder.zip");
        final Path SOURCE_FILE = Path.of("/home/mohibulhasan/Documents/example.txt");
        
        ZipUtils.zipSingleFile(Path.of("/home/mohibulhasan/Documents/example.txt"),OUTPUT_ZIP_FILE);
       }
    }
```

in this case the new zip file that will be created would be inside /home/mohibulhasan/Documents/ and as Folder.zip

#### Zip a folder:

In case of a directory in ZipUtils class there is a method `zipFolder()` which will use a source directory as path to zip all the contents of that directory

```java
public static void zipFolder(Path source) throws IOException {

            // get folder name as zip file name
            String zipFileName = source.toFile().getAbsolutePath() + ".zip";

            try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipFileName))) {

                Files.walkFileTree(source, new SimpleFileVisitor<>() {
                    @Override
                    public FileVisitResult visitFile(Path file, BasicFileAttributes attributes) {

                        // only copy files, no symbolic links
                        if (attributes.isSymbolicLink()) {
                            return FileVisitResult.CONTINUE;
                        }

                        try (FileInputStream fis = new FileInputStream(file.toFile())) {

                            Path targetFile = source.relativize(file);
                            zos.putNextEntry(new ZipEntry(targetFile.toString()));

                            byte[] buffer = new byte[1024];
                            int len;
                            while ((len = fis.read(buffer)) > 0) {
                                zos.write(buffer, 0, len);
                            }

                            // if large file, throws out of memory
                            //byte[] bytes = Files.readAllBytes(file);
                            //zos.write(bytes, 0, bytes.length);

                            zos.closeEntry();

                            System.out.printf("Zip file : %s%n", file);

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

        }
```

in this method `Files.walkFileTree()` is used for to visit all the files in the directory and take each file and put them inside the zipEntry. Then ZipOutputStream is used to create the zipEntry's and the added.

#### Unzip a .zip File:

If need to unzip a `.zip` file and extract the files and folder of that zip file, we need to give the zip file path and destiantion path where the .zip file will be extracted.

```java
public static void unzipIt(Path sourceFilePath, Path destFilePath) {
            try (ZipInputStream zis = new ZipInputStream(new FileInputStream(sourceFilePath.toFile()))) {

                // list files in zip
                ZipEntry zipEntry = zis.getNextEntry();

                while (zipEntry != null) {

                    boolean isDirectory = false;
                    // some zip stored files and folders separately
                    // e.g data/
                    //     data/folder/
                    //     data/folder/file.txt
                    if (zipEntry.getName().endsWith(File.separator)) {
                        isDirectory = true;
                    }

                    Path newPath = zipSlipProtect(zipEntry, destFilePath);

                    if (isDirectory) {
                        Files.createDirectories(newPath);
                    } else {

                        // some zip stored file path only, need create parent directories
                        // e.g data/folder/file.txt
                        if (newPath.getParent() != null) {
                            if (Files.notExists(newPath.getParent())) {
                                Files.createDirectories(newPath.getParent());
                            }
                        }

                        // copy files, nio
                        Files.copy(zis, newPath, StandardCopyOption.REPLACE_EXISTING);

                        // copy files, classic
                    /*try (FileOutputStream fos = new FileOutputStream(newPath.toFile())) {
                        byte[] buffer = new byte[1024];
                        int len;
                        while ((len = zis.read(buffer)) > 0) {
                            fos.write(buffer, 0, len);
                        }
                    }*/
                    }

                    zipEntry = zis.getNextEntry();

                }
                zis.closeEntry();

            } catch (IOException e) {

            }
        }
```

while doing the unzip all the zipEntry are checked and until all of them are processed the mehtod will check if that zip entry is a file or a folder and if its a folder it will create a folder in the desitantion folder for that particular entry. Some file will have `relative path` so it will also make the parent folders.

While trying to unzip a `.zip` in this case the zip file it may cause ZipSlip Attack,

#### Zip Slip Attack:

The [zip slip attack](https://www.infoq.com/news/2018/06/zip-slip/ "Zip Slip attack") is  an attack that adds entries to a zip file that will be unzipped, entries consisting relative file paths with one or more `/..` sections in the path the final path of the file could end up being outside the directory into which the ZipFile is requested unzipped to. Let's look at an example:

Zip file to be unzipped to the directory `/apps/example/data/unzipped-file`. An entry in the Zip file has the relative path `../../../../etc/hosts` . The final path of that entry becomes: `/apps/example/data/unzipped-file/../../../../etc/hosts` which is equivalent of `/etc/hosts` .

In the case of linux  based systems unzipping this file could potentially overwrite our hosts file,enabling the attacker to point e.g. www.facebook.com to an IP address of their own choice. The next time you try to access Facebook from that computer, it won't be the real Facebook you are accessing, but the attacker's spoofed version. Once you login, the attacker now has your username and password, and your Facebook account can be hacked.

To avoid this a method `zipSlipProtect()` method is implemented which will check if the path of the zip entry is outside of the destination directory or not.

```java
 private static Path zipSlipProtect(ZipEntry zipEntry, Path destinationDirectory) throws IOException {

            // test zip slip vulnerability
            // Path targetDirResolved = targetDir.resolve("../../" + zipEntry.getName());

            Path targetDirResolved = destinationDirectory.resolve(zipEntry.getName());

            // make sure normalized file still has targetDir as its prefix
            // else throws exception
            Path normalizePath = targetDirResolved.normalize();
            if (!normalizePath.startsWith(destinationDirectory)) {
                throw new IOException("Bad zip entry: " + zipEntry.getName());
            }

            return normalizePath;
        }
```

in this method by using the [Path.resolve()](https://www.geeksforgeeks.org/path-resolve-method-in-java-with-examples/ "Path resolve")  and [Path.normalize()](https://www.geeksforgeeks.org/path-normalize-method-in-java-with-examples/) to check if the normalize file path still has the destiantion direcotry as its prefix or not.