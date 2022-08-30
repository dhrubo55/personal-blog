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


### CompletableFuture:


The Future interface was added in Java 5 to serve as a result of an asynchronous computation, but it did not have any methods to combine computations or handle possible errors.

Java 8 introduced the CompletableFuture class. Along with the `Future` interface, it also implemented the `CompletionStage` interface. This interface defines the contract for an asynchronous computation step that we can combine with other steps.

CompletableFuture is used for composing, combining, and executing asynchronous computation steps and handling errors.

### HttpClient.sendAsync():

Sends the given request asynchronously using this client with the given response body handler. Returns a CompletableFuture<HttpResponse<T>> 
  

