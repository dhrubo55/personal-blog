+++
category = ["Java", "100DaysOfJava"]
date = 2021-11-25T00:00:00Z
description = "Getting a programmer joke asynchronously with CompletableFuture, HttpClient, and Jackson."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day33"
summary = "Getting a programmer joke asynchronously with CompletableFuture, HttpClient, and Jackson."
title = "Day 33: Getting a programmer joke asynchronously with CompletableFuture, HttpClient, and Jackson"
[cover]
alt = "Day33"
caption = "Day33"
image = ""
relative = false

+++

Getting a programmer joke asynchronously with `CompletableFuture`, `HttpClient`, and Jackson.

Transcribed from the original LinkedIn image post.

```java
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

class Day33 {
    private static final Logger logger = Logger.getLogger(Day33.class.getName());

    public static void main(String[] args) {
        try {
            String webSite = CompletableFuture.supplyAsync(Day33::getWebSite)
                .completeOnTimeout("Emptiness itself is a joke", 5, TimeUnit.SECONDS)
                .get();

            System.out.println("Joke of the day: \n");
            System.out.println(webSite);
        } catch (ExecutionException | InterruptedException e) {
            logger.severe("Couldnt execute or got interrupted cause " + e);
        }
    }

    private static String getWebSite() {
        try {
            HttpClient httpClient = HttpClient.newHttpClient();
            HttpRequest httpRequest = HttpRequest
                .newBuilder()
                .uri(new URI("https://v2.jokeapi.dev/joke/Programming?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single"))
                .GET()
                .header("Accept", "application/json")
                .build();

            HttpResponse<String> response = httpClient.send(
                httpRequest,
                HttpResponse.BodyHandlers.ofString()
            );

            String joke = response.body();
            ObjectMapper mapper = new ObjectMapper();
            Joke jokeObj = mapper.readValue(joke, new TypeReference<Joke>() {});
            return jokeObj.joke;
        } catch (InterruptedException | URISyntaxException | IOException e) {
            throw new RuntimeException(e);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Joke {
        @JsonProperty("joke")
        public String joke;
    }
}
```

The original LinkedIn graphic is preserved below.

![Day 33 LinkedIn post](/images/100daysofjava/linkedin/day33.png)
