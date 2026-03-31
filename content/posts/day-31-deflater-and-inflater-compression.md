+++
category = ["Java", "100DaysOfJava"]
date = 2021-11-10T00:00:00Z
description = "Compressing and decompressing text with Deflater and Inflater."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day31"
summary = "Compressing and decompressing text with Deflater and Inflater."
topics = ["I/O & Networking"]
title = "Day 31: Compressing and decompressing text with Deflater and Inflater"
[cover]
alt = "Day31"
caption = "Day31"
image = ""
relative = false

+++

Compressing and decompressing text with `Deflater` and `Inflater`.

Transcribed from the original LinkedIn image post. The original graphic used a longer novel excerpt as sample text; this version keeps the same compression flow with a neutral sample paragraph.

```java
import java.nio.charset.StandardCharsets;
import java.util.zip.DataFormatException;
import java.util.zip.Deflater;
import java.util.zip.Inflater;

class Day31 {
    public static void main(String[] args) {
        String message = "A sample paragraph that will be compressed and decompressed to show how Deflater and Inflater work in Java.";

        CompressedData compressedData = compressString(message);
        System.out.println("Original String length = " + message.length());
        String compressedString = new String(compressedData.compressedData, StandardCharsets.UTF_8);
        System.out.println("Compressed string length = " + compressedString.length());

        String deCompressedString = decompressString(compressedData);
        System.out.println("Compressed String:\n" + compressedString);
        System.out.println("Decompressed string:\n" + deCompressedString);
    }

    static class CompressedData {
        public byte[] compressedData;
        public int compressedSize;

        public CompressedData(byte[] compressedData, int compressedSize) {
            this.compressedData = compressedData;
            this.compressedSize = compressedSize;
        }
    }

    static CompressedData compressString(String contentPath) {
        Deflater deflater = new Deflater();
        byte[] content = contentPath.getBytes(StandardCharsets.UTF_8);
        deflater.setInput(content);
        deflater.finish();

        byte[] compressed = new byte[content.length];
        int compressedSize = deflater.deflate(compressed, 0, contentPath.length(), Deflater.NO_FLUSH);
        deflater.end();

        return new CompressedData(compressed, compressedSize);
    }

    static String decompressString(CompressedData compressedString) {
        Inflater inflater = new Inflater();
        inflater.setInput(compressedString.compressedData, 0, compressedString.compressedSize);

        byte[] original = new byte[compressedString.compressedData.length];
        int originalLength = 0;
        try {
            originalLength = inflater.inflate(original);
        } catch (DataFormatException e) {
            e.printStackTrace();
        }
        inflater.end();

        return new String(original, 0, originalLength, StandardCharsets.UTF_8);
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 31 LinkedIn post](/images/100daysofjava/linkedin/day31.png)](https://www.linkedin.com/feed/update/urn:li:share:6864167276724256768/)

