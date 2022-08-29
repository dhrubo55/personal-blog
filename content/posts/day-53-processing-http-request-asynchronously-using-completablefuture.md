+++
category = []
date = 2022-08-17T00:00:00Z
description = "Using CompletableFuture's execution to process http request asynchronously"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day53"
summary = "Using CompletableFuture's execution to process http request asynchronously"
title = "Day 53: Processing Http Request Asynchronously using CompletableFutures"
[cover]
alt = "Day53"
caption = "Day53"
image = ""
relative = false

+++
Java HttpClient can send asynchronous request using `HttpClient.sendAsync()` which returns a `CompletableFuture<HttpResponse<T>>`. By collecting all the request and then executing them with with a stream to get list of `HttpResponse<T>` and partition the result with status code. 