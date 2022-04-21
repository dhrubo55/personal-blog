+++
category = []
date = 2022-04-11T00:00:00Z
description = "A utility class to zip and unzip files and directories"
draft = true
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

Now to create a zip file of any particular file an utility class is created `ZipUtils` which will use `ZipInputStream` along with `ZipOutputStream` to zip and unzip any files.