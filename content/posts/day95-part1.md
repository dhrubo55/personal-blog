+++
category = ["Java", "100DaysOfJava"]
date = 2025-11-21T00:00:00Z
description = "Master the foundation of Java concurrency - Executor, ExecutorService, ScheduledExecutorService, Future, CompletableFuture, and CountDownLatch with production patterns, trade-offs, and debugging techniques."
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day95"
summary = "Part 1: Foundation & Execution - Deep dive into 6 essential concurrency tools with real-world patterns, performance characteristics, and common pitfalls"
title = "Day 95: Java Concurrency Toolkit Part 1 - Foundation & Execution Patterns"
[cover]
alt = "day95"
caption = "day95"
image = ""
relative = false
+++

> **Series Navigation:** [Part 1 (You are here)](#) • [Part 2: Core Synchronization](/posts/java/100DaysOfJava/day96) • [Part 3: Advanced Patterns](/posts/java/100DaysOfJava/day97)

**"Concurrency is not parallelism. Concurrency is about dealing with lots of things at once. Parallelism is about doing lots of things at once."** - Rob Pike

I've worked with `Executor`, `ScheduledExecutorService`, `Future`, `CompletableFuture`, `CountDownLatch`, `ReentrantLock` in production, and they've helped me develop various multi-threaded features. But I realized I was barely scratching the surface of what `java.util.concurrent` offers.

**Primary References:**
- Goetz, B., et al. (2006). *Java Concurrency in Practice*. Addison-Wesley.
- Oracle. (2023). *Java SE API Specification*: [`java.util.concurrent` package](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
- Lea, D. (2000). "A Java Fork/Join Framework", *Science of Computer Programming*, 37(1-3). 

This is **Part 1 of 3** where we'll explore the **foundation and execution patterns**: the core building blocks that power modern concurrent Java applications.

## Series Overview

This is a **3-part series** on Java Concurrency:

**Part 1 (Today - Day 95):** Foundation & Execution
- Executor
- ExecutorService  
- ScheduledExecutorService
- Future
- CompletableFuture
- CountDownLatch

**Part 2 (Day 96):** Core Synchronization Patterns
- CyclicBarrier
- Semaphore
- ThreadFactory
- BlockingQueue

**Part 3 (Day 97):** Advanced Patterns & Production Readiness
- DelayQueue
- ReentrantLock
- Phaser
- Debugging, Monitoring, Production Patterns

---

## Quick Reference: Part 1 Tools at a Glance

| Tool | TL;DR | Key Gotcha |
|------|-------|------------|
| **Executor** | Simplest interface - just `execute(Runnable)`. No lifecycle, no results. | No way to retrieve results or manage lifecycle |
| **ExecutorService** | Managed thread pool with lifecycle control. Returns `Future` for results. | Must call `shutdown()` - thread pools leak otherwise |
| **ScheduledExecutorService** | Schedules tasks for future or periodic execution. | Exceptions cancel all future executions - wrap in try-catch! |
| **Future** | Represents eventual completion. **Always use `get(timeout)`** - never without. | Blocking API - blocks calling thread until complete |
| **CompletableFuture** | Non-blocking async composition (Java's Promises). Chain, combine, handle errors. | Complex API - use `thenCompose` not `thenApply(join())` |
| **CountDownLatch** | One-shot countdown. Wait at `await()` until `countDown()` reaches zero. | Can't reset. Always countDown in `finally` to avoid deadlock |

---

## When NOT to Use Concurrency

Before we dive in, let's talk about when concurrency is **overkill**:

**Don't use concurrency when:**
- Your dataset fits in memory and processes in < 100ms sequentially
- The overhead of thread coordination exceeds the benefit
- Your task is inherently sequential (step B depends on step A's result)
- You're processing < 1000 items and each takes microseconds
- Debugging complexity isn't worth the performance gain

**Do use concurrency when:**
- You have independent tasks that can run in parallel
- You're doing I/O (network, disk, database) where threads spend time waiting
- You need to keep your application responsive while background work happens
- You're processing large datasets where parallel processing yields measurable gains
- You need to handle multiple concurrent requests (web servers, message processors)

**Rule of thumb:** Measure first. Add concurrency only when sequential processing is proven to be a bottleneck.

**The Cost Model:** Concurrency introduces coordination overhead. By Amdahl's Law, speedup is limited by the sequential fraction of your program (Goetz et al., 2006, Ch. 11). If synchronization overhead exceeds the parallelizable benefit, you'll make things slower. Always profile before parallelizing.

---

## Performance Characteristics Reference

| Tool                         | CPU Overhead | Memory Characteristics                                  | Behavioral Notes                               | Best For                       |
| ---------------------------- | ------------ | ------------------------------------------------------- | ---------------------------------------------- | ------------------------------ |
| **Executor**                 | Low          | Minimal; delegates to provided threads                  | Submits tasks without lifecycle management     | Fire-and-forget tasks          |
| **ExecutorService**          | Low–Medium   | Thread-pool backed; scales with pool size and queue bounds | Manages worker threads, queues, and shutdown   | Managed task execution         |
| **ScheduledExecutorService** | Medium       | Thread-pool plus heap-based delay queues (priority queue) | Time-based and periodic task execution         | Delayed and recurring tasks    |
| **Future**                   | Very Low     | Single object reference (~40-60 bytes) per task         | Represents eventual completion; blocking get() | Simple result retrieval        |
| **CompletableFuture**        | Low–Medium   | Base object + callback chain (~200-400 bytes per composition) | Non-blocking composition, async pipelines      | Async workflow chains          |
| **CountDownLatch**           | Very Low     | ~32 bytes via AbstractQueuedSynchronizer                | One-shot coordination of thread arrival        | Release-on-countdown scenarios |

*Memory characteristics based on HotSpot JVM defaults. Thread stack size typically 1MB per thread (configurable via `-Xss`). See Oracle JVM documentation for platform-specific values.*


---

## The Foundation: Understanding What We're Building

Before we dive into the tools, let's get one thing straight. Concurrency in Java isn't about making everything parallel. It's about **structuring your code to handle multiple concerns efficiently**. Sometimes that means parallel execution. Sometimes it means coordinating sequential tasks across threads. Sometimes it's about protecting shared state from chaos.


Think of it like a busy restaurant kitchen:
- A head chef coordinating tasks (Executor)
- Managed cooking stations (ExecutorService)
- Timer-based prep work (ScheduledExecutorService)
- Order tickets (Future)
- Complex recipe flows (CompletableFuture)
- Waiting for all dishes before serving (CountDownLatch)

---

## 1. Executor: The Fire-and-Forget Pattern

**TL;DR:** Simplest interface - just `execute(Runnable)`. No lifecycle, no results. Perfect for async side effects like logging or metrics where you don't need to wait for completion.

**The Problem:** Your request thread is too precious to waste on side tasks like logging or metrics.

This is one pattern I've used extensively. When you're processing API requests, offloading non-critical work like logging enrichment to background threads can significantly improve response times.

**The Solution:** Offload non-critical work to background threads.

```java
import java.util.concurrent.Executor;
import java.time.Instant;
import java.util.concurrent.Executors;

public class AsyncLogger {
    private final Executor logExecutor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r);
        t.setName("async-logger");
        t.setDaemon(true); // Won't prevent JVM shutdown
        return t;
    });
    
    public void logRequestAsync(String userId, String endpoint, int statusCode) {
        // Request thread returns immediately
        logExecutor.execute(() -> {
            // Background thread does the heavy lifting
            String enrichedLog = enrichLog(userId, endpoint, statusCode);
            writeToElasticsearch(enrichedLog);
        });
    }
    
    private String enrichLog(String userId, String endpoint, int statusCode) {
        // Fetch user details, geo-location, etc.
        return String.format("[%s] User: %s | Endpoint: %s | Status: %d", 
                             Instant.now(), userId, endpoint, statusCode);
    }
    
    private void writeToElasticsearch(String log) {
        System.out.println("Writing to ES: " + log);
    }
}
```

**Key Insight:** `Executor` is the simplest interface—just `execute(Runnable)`. No lifecycle management, no result handling. Perfect for fire-and-forget side effects.

### Trade-offs and Limitations

**Pros:**
- Minimal overhead
- Simple API
- Request thread returns immediately

**Cons:**
- No result retrieval mechanism
- No lifecycle management (can't shut down gracefully)
- No built-in error handling
- Can't limit concurrent task count

**When it goes wrong:**
```java
//  DANGER: Unbounded task submission
Executor executor = Executors.newCachedThreadPool();
for (int i = 0; i < 1_000_000; i++) {
    executor.execute(() -> {
        // If tasks take longer than submission rate,
        // you'll create 1 million threads = OOM!
    });
}
```

*Reference: Oracle Java SE API - [`Executors.newCachedThreadPool()`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html#newCachedThreadPool()): "Creates a thread pool that creates new threads as needed, but will reuse previously constructed threads when they are available." - No upper bound documented.*

**Common Mistakes:**
1. Using daemon threads for critical work (logs might be lost on JVM shutdown) - *Reference: Java Language Specification §12.8: The JVM exits when all non-daemon threads terminate.*
2. No backpressure mechanism (can overwhelm the executor)
3. Losing exceptions (they're swallowed unless you add explicit handling)

---

## 2. ExecutorService: When You Need Control

**TL;DR:** Managed thread pool with lifecycle control. Returns `Future` for results. Use `invokeAll()` for batch processing. Always shutdown: `shutdown()` → `awaitTermination()` → `shutdownNow()`. Size pool based on workload (CPU vs I/O).

**The Problem:** Processing a large product catalog where each item needs enrichment from multiple services—pricing, inventory, and reviews. Sequential processing is too slow.

This is a classic scenario where parallel processing *can* provide speedup—**if I/O wait time dominates compute time**. Concurrency benefit depends on latency distribution and CPU contention (Goetz et al., 2006, Ch. 8). Instead of waiting for each item to complete before starting the next, we can process multiple items concurrently.

**The Solution:** Parallel processing with controlled thread pool and result collection.

```java
import java.util.concurrent.*;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

public class ProductEnrichmentService {
    private final ExecutorService pool;
    
    public ProductEnrichmentService(int threadCount) {
        this.pool = Executors.newFixedThreadPool(threadCount);
    }
    
    public List<Product> enrichProducts(List<Product> products) throws InterruptedException {
        System.out.println("Enriching " + products.size() + " products using " + 
                         Runtime.getRuntime().availableProcessors() + " threads");
        
        // Convert products to Callable tasks
        List<Callable<Product>> tasks = products.stream()
                .map(product -> (Callable<Product>) () -> enrichSingleProduct(product))
                .collect(Collectors.toList());
        
        long startTime = System.currentTimeMillis();
        
        // Execute all tasks and wait for completion
        List<Future<Product>> futures = pool.invokeAll(tasks);
        
        // Collect results
        List<Product> enriched = new ArrayList<>();
        for (Future<Product> future : futures) {
            try {
                enriched.add(future.get());
            } catch (ExecutionException e) {
                System.err.println("Failed to enrich product: " + e.getCause().getMessage());
            }
        }
        
        long duration = System.currentTimeMillis() - startTime;
        System.out.println("Enrichment completed in " + duration + "ms");
        
        return enriched;
    }
    
    private Product enrichSingleProduct(Product product) {
        // Simulate calling multiple services
        String pricing = fetchPricing(product.id());
        String inventory = fetchInventory(product.id());
        String reviews = fetchReviews(product.id());
        
        return new Product(
            product.id(),
            product.name(),
            pricing,
            inventory,
            reviews
        );
    }
    
    private String fetchPricing(String id) {
        sleep(50); // Simulate API call
        return "$99.99";
    }
    
    private String fetchInventory(String id) {
        sleep(30);
        return "In Stock";
    }
    
    private String fetchReviews(String id) {
        sleep(40);
        return "4.5 stars";
    }
    
    public void shutdown() {
        pool.shutdown();
        try {
            if (!pool.awaitTermination(60, TimeUnit.SECONDS)) {
                pool.shutdownNow();
            }
        } catch (InterruptedException e) {
            pool.shutdownNow();
        }
    }
    
    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) {}
    }
}

record Product(String id, String name, String pricing, String inventory, String reviews) {}
```

### Trade-offs and Limitations

**Pros:**
- Lifecycle management (shutdown, awaitTermination)
- Result collection via Future
- Controlled parallelism
- Can batch submit tasks

**Cons:**
- Fixed thread pool size (need to tune)
- Blocking result retrieval
- No built-in composition
- Manual error handling

**Sizing Your Thread Pool:**

```java
// For CPU-bound tasks:
int cpuBoundPoolSize = Runtime.getRuntime().availableProcessors();

// For I/O-bound tasks (rule of thumb):
int ioBoundPoolSize = Runtime.getRuntime().availableProcessors() * 2;

// More precise I/O formula (derived from Little's Law):
// ThreadCount = NumCores * (1 + WaitTime/ComputeTime)
// Example: 8 cores, 90% wait time, 10% compute
// = 8 * (1 + 0.9/0.1) = 8 * 10 = 80 threads
```

*Reference: Goetz et al., 2006, Chapter 8 ("Applying Thread Pools"): Thread pool sizing using Little's Law and utilization analysis.*

**Common Mistakes:**

```java
// MISTAKE 1: Forgetting to shutdown
public void process() {
    ExecutorService pool = Executors.newFixedThreadPool(10);
    pool.submit(() -> doWork());
    // Pool never shuts down = thread leak!
}

// CORRECT: Always shutdown
public void process() {
    ExecutorService pool = Executors.newFixedThreadPool(10);
    try {
        pool.submit(() -> doWork()).get();
    } finally {
        pool.shutdown();
        pool.awaitTermination(60, TimeUnit.SECONDS);
    }
}

// MISTAKE 2: Wrong pool type
ExecutorService pool = Executors.newCachedThreadPool();
// For I/O: Can create unlimited threads = OOM

// MISTAKE 3: Ignoring RejectedExecutionException
pool.shutdown();
pool.submit(() -> doWork()); // Throws RejectedExecutionException
```

**Modern Java Note:** `Executors` factory methods are convenient but lack configurability. For production systems, consider direct `ThreadPoolExecutor` construction with explicit queue bounds and rejection policies. Java 21+ introduces Structured Concurrency (JEP 453) and Scoped Values (JEP 446) for safer concurrent patterns.

*Reference: OpenJDK JEP 453: Structured Concurrency (Preview) - [https://openjdk.org/jeps/453](https://openjdk.org/jeps/453)*

---

## 3. ScheduledExecutorService: Time-Based Automation

**TL;DR:** Schedules tasks for future or periodic execution. Use `scheduleAtFixedRate()` for fixed intervals, `scheduleWithFixedDelay()` for guaranteed gaps. Wrap tasks in try-catch - exceptions cancel future executions!

**The Problem:** OAuth tokens expire every hour. If we don't refresh them, API calls start failing. Can't rely on manual intervention.

This is another pattern I've implemented in production. Scheduled tasks are perfect for periodic maintenance work like token refresh, health checks, or cache cleanup.

**The Solution:** Automated token refresh with scheduled tasks.

```java
import java.util.concurrent.*;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

public class TokenRefreshService {
    private final ScheduledExecutorService scheduler;
    private final AtomicReference<String> currentToken;
    
    public TokenRefreshService() {
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r);
            t.setName("token-refresher");
            t.setDaemon(false); // Important: ensure refresh completes before shutdown
            return t;
        });
        this.currentToken = new AtomicReference<>("");
    }
    
    public void startRefreshCycle() {
        System.out.println("Starting token refresh cycle at " + Instant.now());
        
        // Initial refresh
        refreshToken();
        
        // Schedule periodic refresh every 50 minutes (tokens expire in 60)
        scheduler.scheduleAtFixedRate(
            this::refreshToken,
            50,              // initial delay
            50,              // period
            TimeUnit.MINUTES
        );
        
        System.out.println("Token will refresh every 50 minutes");
    }
    
    private void refreshToken() {
        try {
            System.out.println("[" + Instant.now() + "] Refreshing token...");
            
            // Simulate OAuth flow
            String newToken = callAuthServer();
            currentToken.set(newToken);
            
            System.out.println("Token refreshed successfully");
        } catch (Exception e) {
            System.err.println("Token refresh failed: " + e.getMessage());
            // In production: alert ops team, retry with exponential backoff
        }
    }
    
    private String callAuthServer() {
        // Simulate network delay
        try { Thread.sleep(200); } catch (InterruptedException e) {}
        return "token_" + System.currentTimeMillis();
    }
    
    public String getCurrentToken() {
        return currentToken.get();
    }
    
    public void shutdown() {
        scheduler.shutdown();
    }
}
```

### scheduleAtFixedRate vs scheduleWithFixedDelay


```java
// scheduleAtFixedRate: Next task starts at T + period (can overlap!)
scheduler.scheduleAtFixedRate(task, 0, 1, TimeUnit.SECONDS);
// If task takes 2 seconds, tasks will queue up!

// scheduleWithFixedDelay: Next task starts after (task completion + delay)
scheduler.scheduleWithFixedDelay(task, 0, 1, TimeUnit.SECONDS);
// Guarantees 1 second gap between task completion and next start
```

### Trade-offs and Limitations

**Pros:**
- Built-in timing mechanism
- Periodic execution
- One-shot delayed execution
- Multiple scheduled tasks on same scheduler

**Cons:**
- If task takes longer than period, tasks queue up (scheduleAtFixedRate)
- Exceptions cancel future executions - *Reference: Oracle Java SE API - [`ScheduledExecutorService`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ScheduledExecutorService.html): "If any execution of the task encounters an exception, subsequent executions are suppressed."*
- No built-in retry logic
- Clock drift not handled

**Common Mistakes:**

```java
// MISTAKE: Long-running task with scheduleAtFixedRate
scheduler.scheduleAtFixedRate(() -> {
    Thread.sleep(5000); // 5 seconds
}, 0, 1, TimeUnit.SECONDS); // Every 1 second
// Tasks pile up! Queue grows indefinitely

// CORRECT: Use scheduleWithFixedDelay for long tasks
scheduler.scheduleWithFixedDelay(() -> {
    Thread.sleep(5000);
}, 0, 1, TimeUnit.SECONDS);
// Next task starts 1 second AFTER previous completes

// MISTAKE: Not handling exceptions
scheduler.scheduleAtFixedRate(() -> {
    if (Math.random() > 0.5) {
        throw new RuntimeException("Boom!");
    }
    doWork();
}, 0, 1, TimeUnit.SECONDS);
// First exception silently cancels ALL future executions!

// CORRECT: Wrap in try-catch
scheduler.scheduleAtFixedRate(() -> {
    try {
        if (Math.random() > 0.5) {
            throw new RuntimeException("Boom!");
        }
        doWork();
    } catch (Exception e) {
        System.err.println("Task failed: " + e.getMessage());
        // Task continues running
    }
}, 0, 1, TimeUnit.SECONDS);
```

---

## 4. Future: Timeouts Save Lives

**TL;DR:** Represents eventual completion of async task. **Always use `get(timeout)`** - never `get()` without timeout. Can cancel running tasks (if they respect interruption). Blocking API - use CompletableFuture for non-blocking.

**The Problem:** Calling external services that might hang or respond slowly. Without timeouts, your application threads get stuck waiting indefinitely.

Timeout enforcement is critical for resilient systems. Whether it's a payment gateway, external API, or database query, you need a way to fail fast and recover gracefully.

**The Solution:** Strict timeout enforcement with Future.

```java
import java.util.concurrent.*;

public class PaymentGateway {
    private final ExecutorService pool;
    private final long timeoutMs;
    
    public PaymentGateway(long timeoutMs) {
        this.pool = Executors.newFixedThreadPool(10);
        this.timeoutMs = timeoutMs;
    }
    
    public PaymentResult processPayment(PaymentRequest request) {
        System.out.println("Processing payment for $" + request.amount());
        
        Future<PaymentResult> future = pool.submit(() -> {
            return callExternalGateway(request);
        });
        
        try {
            // Enforce strict timeout
            PaymentResult result = future.get(timeoutMs, TimeUnit.MILLISECONDS);
            System.out.println("Payment successful: " + result.transactionId());
            return result;
            
        } catch (TimeoutException e) {
            // Cancel the stuck task
            future.cancel(true);
            
            System.err.println("Payment timed out after " + timeoutMs + "ms");
            return new PaymentResult("TIMEOUT", "Payment gateway timeout");
            
        } catch (ExecutionException e) {
            System.err.println("Payment failed: " + e.getCause().getMessage());
            return new PaymentResult("FAILED", e.getCause().getMessage());
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new PaymentResult("INTERRUPTED", "Payment interrupted");
        }
    }
    
    private PaymentResult callExternalGateway(PaymentRequest request) {
        // Simulate variable latency
        try {
            Thread.sleep(ThreadLocalRandom.current().nextInt(100, 2000));
        } catch (InterruptedException e) {
            throw new RuntimeException("Gateway call interrupted");
        }
        
        return new PaymentResult("TXN_" + System.currentTimeMillis(), "SUCCESS");
    }
    
    public void shutdown() {
        pool.shutdown();
    }
}

record PaymentRequest(String userId, double amount) {}
record PaymentResult(String transactionId, String status) {}
```

### Trade-offs and Limitations

**Pros:**
- Simple timeout enforcement
- Can cancel running tasks
- Works with any ExecutorService
- Exception handling built-in

**Cons:**
- Blocking API (future.get() blocks)
- No composition (can't chain Futures)
- Cancellation may not work (task must respect interruption)
- One result only, no streaming

**Critical Lesson:** Always set timeouts on external calls. A slow dependency without timeout protection can create cascading failures throughout your system.

**Common Mistakes:**

```java
// MISTAKE: future.get() without timeout
Future<String> future = pool.submit(() -> callExternalApi());
String result = future.get(); // Blocks FOREVER if API hangs!

// CORRECT: Always use timeout
Future<String> future = pool.submit(() -> callExternalApi());
String result = future.get(5, TimeUnit.SECONDS);

// MISTAKE: Assuming cancel() stops the task
Future<?> future = pool.submit(() -> {
    while (true) {
        // Ignores interruption!
        doWork();
    }
});
future.cancel(true); // Task keeps running!

// CORRECT: Respect interruption
Future<?> future = pool.submit(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        doWork();
        if (Thread.interrupted()) break; // Check interruption
    }
    System.out.println("Task gracefully stopped");
});
future.cancel(true); // Task stops
```

*Reference: Goetz et al., 2006, Chapter 7 ("Cancellation and Shutdown"): Proper interruption handling patterns.*

---

## 5. CompletableFuture: Async Pipelines

**TL;DR:** Non-blocking async composition (Java's answer to Promises). Chain with `thenApply/thenCompose`, combine with `allOf/anyOf`, handle errors with `exceptionally/handle`. Powerful but complex - practice required. Always specify executor pool.

**The Problem:** You need to call multiple services in a chain, handle errors at each step, and compose results—all without blocking threads.

CompletableFuture is Java's way to JavaScript Promises. It's powerful, composable, and non-blocking when used correctly.

**The Solution:** Build async pipelines with proper error handling.

```java
import java.util.concurrent.*;
import java.time.Duration;

public class OrderProcessingService {
    private final ExecutorService pool;
    
    public OrderProcessingService() {
        this.pool = Executors.newFixedThreadPool(
            Runtime.getRuntime().availableProcessors() * 2
        );
    }
    
    // Example 1: Sequential async chain
    public CompletableFuture<OrderConfirmation> processOrder(String orderId) {
        return CompletableFuture
            // Step 1: Validate order
            .supplyAsync(() -> validateOrder(orderId), pool)
            
            // Step 2: Check inventory (depends on validation)
            .thenCompose(order -> 
                CompletableFuture.supplyAsync(() -> checkInventory(order), pool)
            )
            
            // Step 3: Process payment (depends on inventory)
            .thenCompose(order ->
                CompletableFuture.supplyAsync(() -> processPayment(order), pool)
            )
            
            // Step 4: Ship order (depends on payment)
            .thenApply(order -> shipOrder(order))
            
            // Handle any errors in the chain
            .exceptionally(ex -> {
                System.err.println("Order processing failed: " + ex.getMessage());
                return new OrderConfirmation("FAILED", ex.getMessage());
            })
            
            // Add timeout
            .orTimeout(10, TimeUnit.SECONDS)
            
            // Fallback if timeout
            .exceptionally(ex -> {
                if (ex instanceof TimeoutException) {
                    return new OrderConfirmation("TIMEOUT", "Processing timed out");
                }
                return new OrderConfirmation("ERROR", ex.getMessage());
            });
    }
    
    // Example 2: Parallel async calls
    public CompletableFuture<ProductDetails> getProductDetails(String productId) {
        // Make three independent API calls in parallel
        CompletableFuture<String> pricingFuture = 
            CompletableFuture.supplyAsync(() -> fetchPricing(productId), pool);
        
        CompletableFuture<String> inventoryFuture = 
            CompletableFuture.supplyAsync(() -> fetchInventory(productId), pool);
        
        CompletableFuture<String> reviewsFuture = 
            CompletableFuture.supplyAsync(() -> fetchReviews(productId), pool);
        
        // Combine all results
        return CompletableFuture.allOf(pricingFuture, inventoryFuture, reviewsFuture)
            .thenApply(v -> new ProductDetails(
                productId,
                pricingFuture.join(),    // Safe: already completed
                inventoryFuture.join(),
                reviewsFuture.join()
            ));
    }
    
    // Example 3: Race multiple services (use fastest)
    public CompletableFuture<String> getQuote(String symbol) {
        CompletableFuture<String> exchange1 = 
            CompletableFuture.supplyAsync(() -> callExchange1(symbol), pool);
        
        CompletableFuture<String> exchange2 = 
            CompletableFuture.supplyAsync(() -> callExchange2(symbol), pool);
        
        CompletableFuture<String> exchange3 = 
            CompletableFuture.supplyAsync(() -> callExchange3(symbol), pool);
        
        // Return whichever completes first
        return CompletableFuture.anyOf(exchange1, exchange2, exchange3)
            .thenApply(result -> (String) result);
    }
    
    // Example 4: Complex error handling
    public CompletableFuture<String> robustServiceCall(String request) {
        return CompletableFuture
            .supplyAsync(() -> callUnreliableService(request), pool)
            
            // Handle specific exceptions differently
            .handle((result, ex) -> {
                if (ex != null) {
                    if (ex.getCause() instanceof TimeoutException) {
                        return "TIMEOUT_FALLBACK";
                    } else if (ex.getCause() instanceof ConnectException) {
                        return "OFFLINE_FALLBACK";
                    } else {
                        throw new CompletionException(ex);
                    }
                }
                return result;
            })
            
            // Retry logic with delay
            .exceptionallyCompose(ex -> {
                System.out.println("Retrying after failure...");
                return CompletableFuture
                    .delayedExecutor(1, TimeUnit.SECONDS, pool)
                    .execute(() -> {})
                    .thenCompose(v -> 
                        CompletableFuture.supplyAsync(
                            () -> callUnreliableService(request), 
                            pool
                        )
                    );
            });
    }
    
    // Helper methods (simulated)
    private Order validateOrder(String orderId) {
        sleep(100);
        return new Order(orderId, "VALIDATED");
    }
    
    private Order checkInventory(Order order) {
        sleep(150);
        return new Order(order.id(), "INVENTORY_OK");
    }
    
    private Order processPayment(Order order) {
        sleep(200);
        return new Order(order.id(), "PAID");
    }
    
    private OrderConfirmation shipOrder(Order order) {
        sleep(100);
        return new OrderConfirmation("SUCCESS", "Order shipped");
    }
    
    private String fetchPricing(String id) {
        sleep(50);
        return "$99.99";
    }
    
    private String fetchInventory(String id) {
        sleep(75);
        return "In Stock";
    }
    
    private String fetchReviews(String id) {
        sleep(60);
        return "4.5 stars";
    }
    
    private String callExchange1(String symbol) {
        sleep(100);
        return "Exchange1: $150.25";
    }
    
    private String callExchange2(String symbol) {
        sleep(80);
        return "Exchange2: $150.30";
    }
    
    private String callExchange3(String symbol) {
        sleep(120);
        return "Exchange3: $150.20";
    }
    
    private String callUnreliableService(String request) {
        sleep(100);
        if (Math.random() > 0.7) {
            throw new RuntimeException("Service temporarily unavailable");
        }
        return "SUCCESS: " + request;
    }
    
    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) {}
    }
    
    public void shutdown() {
        pool.shutdown();
    }
}

record Order(String id, String status) {}
record OrderConfirmation(String status, String message) {}
record ProductDetails(String id, String pricing, String inventory, String reviews) {}
```

### CompletableFuture Key Methods:

| Method | Use Case | Returns |
|--------|----------|---------|
| `supplyAsync()` | Start async computation with result | CompletableFuture<T> |
| `runAsync()` | Start async computation without result | CompletableFuture<Void> |
| `thenApply()` | Transform result (sync) | CompletableFuture<U> |
| `thenApplyAsync()` | Transform result (async) | CompletableFuture<U> |
| `thenCompose()` | Chain dependent futures (flatMap) | CompletableFuture<U> |
| `thenCombine()` | Combine two independent futures | CompletableFuture<V> |
| `allOf()` | Wait for all to complete | CompletableFuture<Void> |
| `anyOf()` | Wait for first to complete | CompletableFuture<Object> |
| `exceptionally()` | Handle error, return fallback | CompletableFuture<T> |
| `handle()` | Handle both success and error | CompletableFuture<U> |
| `orTimeout()` | Add timeout | CompletableFuture<T> |
| `completeOnTimeout()` | Provide default on timeout | CompletableFuture<T> |

### Trade-offs and Limitations

**Pros:**
- Non-blocking composition
- Rich API for chaining
- Built-in error handling
- Timeout support (Java 9+)
- Can combine multiple futures

**Cons:**
- Complex API with many methods
- Easy to create memory leaks (uncompleted futures)
- Exception handling can be tricky
- Default pool (ForkJoinPool.commonPool()) might not be suitable

**Common Mistakes:**

```java
//  MISTAKE 1: Using join() instead of thenCompose()
CompletableFuture<User> userFuture = getUserAsync(userId);
CompletableFuture<Orders> ordersFuture = 
    getOrdersAsync(userFuture.join().getId()); // BLOCKS!

// CORRECT: Chain with thenCompose
CompletableFuture<Orders> ordersFuture = getUserAsync(userId)
    .thenCompose(user -> getOrdersAsync(user.getId())); // Non-blocking

// MISTAKE 2: Not handling errors
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> {
        throw new RuntimeException("Boom!");
    });
// Exception is swallowed until you call get() or join()

// CORRECT: Handle errors
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> {
        throw new RuntimeException("Boom!");
    })
    .exceptionally(ex -> {
        System.err.println("Error: " + ex.getMessage());
        return "FALLBACK";
    });


// MISTAKE 4: Blocking in async callbacks
CompletableFuture.supplyAsync(() -> step1())
    .thenApply(result -> {
        return expensiveBlockingCall(); // Blocks thread pool!
    });

// CORRECT: Use thenApplyAsync for blocking ops
CompletableFuture.supplyAsync(() -> step1())
    .thenApplyAsync(result -> {
        return expensiveBlockingCall(); // Runs on separate thread
    }, customPool);
```

---

## 6. CountDownLatch: Startup Coordination

**TL;DR:** One-shot countdown mechanism. Threads wait at `await()` until count reaches zero via `countDown()` calls. Can't reset (use CyclicBarrier for reusable). Always countDown in `finally` block to avoid deadlock.

**The Problem:** Starting a microservice that depends on multiple other services being healthy. If you start serving traffic before dependencies are ready, requests fail.

This pattern is essential for graceful application startup, especially in microservice architectures where you need to coordinate multiple async initialization tasks.

**The Solution:** Wait for all health checks before accepting traffic.

```java
import java.util.concurrent.*;
import java.util.List;

public class MicroserviceBootstrap {
    
    public void startApplication() throws InterruptedException {
        System.out.println("Starting application bootstrap...");
        
        List<String> dependencies = List.of(
            "user-service", 
            "payment-service", 
            "inventory-service"
        );
        
        CountDownLatch healthCheckLatch = new CountDownLatch(dependencies.size());
        
        ExecutorService pool = Executors.newCachedThreadPool();
        
        // Launch parallel health checks
        for (String service : dependencies) {
            pool.submit(() -> {
                boolean healthy = checkServiceHealth(service);
                if (healthy) {
                    System.out.println(service + " is healthy");
                    healthCheckLatch.countDown();
                } else {
                    System.err.println(service + " health check failed");
                    // In production: implement retry logic
                }
            });
        }
        
        System.out.println("Waiting for all health checks to complete...");
        
        // Block until all services are healthy or timeout
        boolean allHealthy = healthCheckLatch.await(30, TimeUnit.SECONDS);
        
        if (allHealthy) {
            System.out.println("All dependencies healthy. Starting HTTP server...");
            startHttpServer();
        } else {
            System.err.println("Health checks timed out. Application startup failed.");
            System.exit(1);
        }
        
        pool.shutdown();
    }
    
    private boolean checkServiceHealth(String service) {
        try {
            // Simulate HTTP health check
            Thread.sleep(ThreadLocalRandom.current().nextInt(500, 2000));
            return true; // Assume success for demo
        } catch (InterruptedException e) {
            return false;
        }
    }
    
    private void startHttpServer() {
        System.out.println("HTTP server started on port 8080");
    }
}
```

### Visualizing CountDownLatch

![](https://res.cloudinary.com/dlsxyts6o/image/upload/v1764302698/Untitled-2025-11-28-0958_l1wrub.png)

### Trade-offs and Limitations

**Pros:**
- Simple API (just countDown and await)
- Very low overhead (~32 bytes)
- Can have multiple waiters
- Can timeout

**Cons:**
- One-shot only (can't reset)
- Count must be known at creation
- No error propagation
- If countDown() is missed, waiters block forever

**Why CountDownLatch?** It's a one-shot synchronization primitive. Once the count reaches zero, it's done. Perfect for startup coordination where you only need to wait once.

**Common Mistakes:**

```java
// MISTAKE: Wrong count
CountDownLatch latch = new CountDownLatch(5);
for (int i = 0; i < 3; i++) { // Only 3 threads!
    pool.submit(() -> {
        doWork();
        latch.countDown();
    });
}
latch.await(); // Blocks forever! Count never reaches 0

// CORRECT: Count matches threads
int threadCount = 3;
CountDownLatch latch = new CountDownLatch(threadCount);
for (int i = 0; i < threadCount; i++) {
    pool.submit(() -> {
        doWork();
        latch.countDown();
    });
}

// MISTAKE: Forgetting countDown on error
pool.submit(() -> {
    if (checkHealth()) {
        latch.countDown();
    }
    // If check fails, count is never decremented!
});

// CORRECT: Always countDown (use finally)
pool.submit(() -> {
    try {
        checkHealth();
    } finally {
        latch.countDown(); // Always happens
    }
});
```

---

## Common Anti-Patterns Across All Tools

### 1. Thread Pool Sizing

```java
// ANTI-PATTERN: Magic numbers
ExecutorService pool = Executors.newFixedThreadPool(42);

// CORRECT: Calculate based on workload
int poolSize = Runtime.getRuntime().availableProcessors() * 
               (isCpuBound ? 1 : 2);
```

### 2. Ignoring Shutdown

```java
// ANTI-PATTERN: No shutdown
public void process() {
    ExecutorService pool = Executors.newFixedThreadPool(10);
    pool.submit(() -> work());
} // Pool leaks!

// CORRECT: Proper shutdown
public void process() {
    ExecutorService pool = Executors.newFixedThreadPool(10);
    try {
        pool.submit(() -> work()).get();
    } finally {
        pool.shutdown();
        pool.awaitTermination(60, TimeUnit.SECONDS);
    }
}
```

### 3. Daemon Threads for Critical Work

```java
// ❌ ANTI-PATTERN: Daemon thread for DB writes
ExecutorService pool = Executors.newSingleThreadExecutor(r -> {
    Thread t = new Thread(r);
    t.setDaemon(true); // JVM can exit before DB write completes!
    return t;
});

// ✅ CORRECT: Non-daemon for critical work
ExecutorService pool = Executors.newSingleThreadExecutor(r -> {
    Thread t = new Thread(r);
    t.setDaemon(false); // JVM waits for completion
    return t;
});
```

## Debugging Concurrent Code

**Essential Tools:**

### 1. Thread Dumps with jstack

```bash
# Get process ID
jps

# Generate thread dump
jstack <pid> > threaddump.txt

# Look for:
# - "BLOCKED" threads waiting on locks
# - "WAITING" threads in park()
# - Thread pool names (why naming matters!)
```

*Reference: Oracle JDK Tools - [`jstack`](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jstack.html): "Prints Java thread stack traces for a Java process."*

### 2. ThreadPoolExecutor Hooks

```java
public class MonitoredThreadPool extends ThreadPoolExecutor {
    private final ThreadLocal<Long> startTime = new ThreadLocal<>();
    
    public MonitoredThreadPool(int corePoolSize, int maxPoolSize) {
        super(corePoolSize, maxPoolSize, 60L, TimeUnit.SECONDS, 
              new LinkedBlockingQueue<>());
    }
    
    @Override
    protected void beforeExecute(Thread t, Runnable r) {
        super.beforeExecute(t, r);
        startTime.set(System.nanoTime());
        System.out.println("Task starting on thread: " + t.getName());
    }
    
    @Override
    protected void afterExecute(Runnable r, Throwable t) {
        try {
            long elapsed = System.nanoTime() - startTime.get();
            System.out.println("Task completed in " + elapsed / 1_000_000 + "ms");
            
            if (t != null) {
                System.err.println("Task failed: " + t.getMessage());
            }
        } finally {
            super.afterExecute(r, t);
        }
    }
    
    @Override
    protected void terminated() {
        System.out.println("ThreadPool terminated. Completed tasks: " + 
                         getCompletedTaskCount());
    }
}
```

*Reference: Oracle Java SE API - [`ThreadPoolExecutor`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html): Hook methods `beforeExecute`, `afterExecute`, and `terminated` for monitoring and debugging.*

### 3. Detecting Thread Pool Saturation

```java
ThreadPoolExecutor pool = (ThreadPoolExecutor) Executors.newFixedThreadPool(10);

// Monitor pool health
int activeCount = pool.getActiveCount();
int queueSize = pool.getQueue().size();
long completedTasks = pool.getCompletedTaskCount();

if (queueSize > 1000) {
    System.err.println("WARNING: Thread pool queue saturated!");
    // Alert ops team, scale horizontally, or apply backpressure
}
```

*Reference: Goetz et al., 2006, Chapter 8 ("Applying Thread Pools"): Monitoring thread pool saturation and tuning.*

### 4. Common Deadlock Patterns

```java
// Thread 1: locks A, waits for B
synchronized(lockA) {
    synchronized(lockB) { /* ... */ }
}

// Thread 2: locks B, waits for A → DEADLOCK!
synchronized(lockB) {
    synchronized(lockA) { /* ... */ }
}
```

**Detection:** `jstack` will report "Found one Java-level deadlock" and show the lock dependency cycle.

**Prevention:** Always acquire locks in consistent order (Goetz et al., 2006, Ch. 10).

---

## Part 1 Summary: Foundation & Execution

We've covered the **foundation of Java concurrency**:

| Tool | Best For | Key Limitation |
|------|----------|----------------|
| **Executor** | Fire-and-forget | No result retrieval |
| **ExecutorService** | Managed thread pools | Blocking result collection |
| **ScheduledExecutorService** | Periodic tasks | Tasks can queue up |
| **Future** | Timeout enforcement | Blocking API |
| **CompletableFuture** | Async pipelines | Complex API |
| **CountDownLatch** | One-shot coordination | Can't reset |

**Key Takeaways:**

1. **Always set timeouts** - Blocking forever = production incidents
2. **Name your threads** - Debugging with "pool-1-thread-17" is painful
3. **Proper shutdown is critical** - shutdown() → awaitTermination() → shutdownNow()
4. **Match pool size to workload** - CPU-bound vs I/O-bound need different sizing
5. **CompletableFuture is powerful** - But requires practice to use correctly

**Coming in Part 2 (Day 96):**
- CyclicBarrier - Reusable multi-phase coordination
- Semaphore - Resource pool management
- ThreadFactory - Production-ready thread management
- BlockingQueue - Producer-consumer patterns

**Coming in Part 3 (Day 97):**
- DelayQueue - Time-delayed execution
- ReentrantLock - Fine-grained locking
- Phaser - Dynamic party registration
- **Plus:** Debugging techniques, monitoring patterns, and production readiness checklist

---

**Next:** [Day 96 - Java Concurrency Toolkit Part 2: Core Synchronization Patterns](/posts/java/100DaysOfJava/day96)
