+++
category = []
date = 2022-08-17T00:00:00Z
description = "Using CompletableFuture's allOf() method to combine all http request and process them asynchronously using custom Executor"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day53"
summary = "Using CompletableFuture's allOf() method to combine all http request and process them asynchronously"
title = "Day 53: Processing Http Request Asynchronously using CompletableFutures"
[cover]
alt = "Day53"
caption = "Day53"
image = ""
relative = false

+++
Java HttpClient can send asynchronous request using HttpClient.sendAsync() which returns a CompletableFuture. By collecting all the request and then executing them with `CompletableFuture.allOf()` also using Stream