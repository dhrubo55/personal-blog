+++
category = []
date = 2022-07-26T00:00:00Z
description = "Async Processing HttpRequest's using ExecutorCompletionService"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day52"
summary = "Async Processing HttpRequest's using ExecutorCompletionService"
title = "Day 52: Async Processing HttpRequest's using ExecutorCompletionService"
[cover]
alt = "Day52"
caption = "Day52"
image = ""
relative = false

+++
1. Synchronous and Async
2. ExecutorCompletionService to do http request among 3 threads
3. CompletableFuture to do http request among 3 threads

### What is Synchronous and Asynchronous:

Java code executes line by line."**Synchronously"** means "using the same clock" so when two instructions are synchronous they use the same clock and must happen one after the other. "Asynchronous" means "not using the same clock" so the instructions are not concerned with being in step with each other. That's why it looks backwards, the term is not referring to the instructions relationship to each other. It's referring to each instructions relationship to the clock

![Koyeb - Introduction to Synchronous and Asynchronous Processing](https://www.koyeb.com/static/images/blog/sync-vs-async-schema.png)

There are a couple of ways in which you can make asynchronous calls in Java depending upon your requirement. (But controlling them well is extremely important and tricky at times.)

In addition to `Runnable` interface (which is used to just execute tasks but doesn't return anything to caller) ,you can read about `Callable` interface and Future objects in java. (Which can return data to the caller)

### CompletionService:

A `CompletionService` can be used to manage asynchronous IO, in which tasks that perform reads are submitted in one part of a program or system, and then acted upon in a different part of the program when the reads complete, possibly in a different order than they were requested(in the order of completion).

\**CompletionService manages an internal completion queue.

Let’s understand in layman language.

Suppose you want to execute n number of tasks in parallel, you will think of using threads, now how will you manage all threads execution? okay one may say with the help of **Executor Service** we can handle those threads.
\**Completion service also solves the same thing for you but give you a advantage when tasks are completed.

With ExecutorService, once you have submitted the tasks to run, you need to manually code for efficiently getting the results of the tasks completed.

With CompletionService, this is pretty much automated. Imagine you have a list of tasks to be subdraftmitted. Then, instead of trying to find out which task has completed (to get the results), it just asks the CompletionService instance to return the results as they become available.

Completion service provides functions to get completed tasks from its internal queue in the order they have completed.

### ExecutorCompletionService:

A CompletionService that **uses a supplied Executor** to execute tasks. This class arranges that submitted tasks are, upon completion, placed on a queue accessible using take. The class is lightweight enough to be suitable for transient use when processing groups of tasks.

Using a `ExecutorCompletionService` to call http get requests to a jokes api to get response concurrently and completes each request as it completes and then we poll from the service to take the outputs of the get request.

Firstly creating a custom `HttpCallable` class to send, process http get response

```java
class HttpCallable implements Callable<String> {

        HttpClient httpClient;
        HttpRequest httpRequest;

        HttpCallable(HttpClient httpClient, HttpRequest request) {
            this.httpClient = httpClient;
            this.httpRequest = request;
        }

       public String call() throws IOException, InterruptedException {
               return httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString()).body()+ "\n" + "Thread " + Thread.currentThread().getName() + " current time " + System.currentTimeMillis();
        }
    }
```

this classes `call()` method executes httpclient sendAsync method, which takes HttpRequest object. `httpClient.send().body()` returns a string body as the response is handled with BodyHandlers.ofString()

Now to use this callable

```java
static void httpDispatcherExecutionCompletion(HttpClient httpClient, List<HttpRequest> requests) {
        final ExecutorService pool = Executors.newFixedThreadPool(3);
        final CompletionService<String> service = new ExecutorCompletionService<>(pool);


        final List<? extends Callable<String>> callables = requests.stream().map(request -> new HttpCallable(httpClient,request)).collect(Collectors.toList());

        for (final Callable<String> callable : callables) {
            service.submit(callable);
        }
        pool.shutdown();
        try {
            while (!pool.isTerminated()) {
                final Future<String> future = service.take();
                System.out.println(future.get());
            }
        } catch (ExecutionException | InterruptedException ex) { }
    }
```
here to process the request's first create a `ExecutorService`. Passing that pool to `ExecutorCompletionService`