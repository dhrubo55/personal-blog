+++
category = ["Java", "100DaysOfJava"]
date = 2021-07-09T00:00:00Z
description = "Supplier, Consumer functional interface and httpclient to get and output Bitcoin info"
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day11"
summary = "Supplier, Consumer functional interface and httpclient to get and output Bitcoin info"
topics = ["I/O & Networking"]
title = "Day 11: Supplier, Consumer functional interface and httpclient to get and output Bitcoin info"
[cover]
alt = "Day11"
caption = "Day11"
image = ""
relative = false

+++

Supplier, Consumer functional interface and httpclient to get and output Bitcoin info

Transcribed from the original LinkedIn image post.

```java
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.function.Consumer;
import java.util.function.Supplier;

class Day11 {
    public static void main(String[] args) throws IOException, InterruptedException {
        Supplier<String> jsonStringSupplier = () -> getBitcoinInfoAsString();
        String str = jsonStringSupplier.get();

        Consumer<String> consumeString = s -> System.out.println(s);
        consumeString.accept(str);
    }

    public static String getBitcoinInfoAsString() {
        HttpClient httpClient = HttpClient.newHttpClient();

        HttpRequest httpRequest = HttpRequest
            .newBuilder()
            .uri(URI.create("https://api.coindesk.com/v1/bpi/currentprice.json"))
            .header("Accept", "application/json")
            .build();

        HttpResponse<String> httpResponse = null;
        try {
            httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            e.printStackTrace();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return httpResponse.body().toString();
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 11 LinkedIn post](/images/100daysofjava/linkedin/day11.png)](https://www.linkedin.com/feed/update/urn:li:share:6819288877371662337/)


