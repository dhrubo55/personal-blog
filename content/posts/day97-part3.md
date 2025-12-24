+++
category = ["Java", "100DaysOfJava"]
date = 2025-12-22T00:00:00Z
description = "Advanced Java concurrency - DelayQueue, ReentrantLock, Phaser with debugging techniques, monitoring patterns, and production readiness checklist."
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day97"
summary = "Part 3: Advanced Patterns & Production Readiness - Deep dive into 3 advanced tools plus debugging, monitoring, and going to production"
title = "Day 97: Java Concurrency Toolkit Part 3 - Advanced Patterns & Production Readiness"
[cover]
alt = "day97"
caption = "day97"
image = ""
relative = false
+++

> **Series Navigation:** [Part 1: Foundation & Execution](/posts/java/100DaysOfJava/day95) • [Part 2: Core Synchronization](/posts/java/100DaysOfJava/day96) • [Part 3 (You are here)](#)

**"Mastering concurrency means knowing when NOT to use these tools, and how to debug them when things break."**

In [Part 1 (Day 95)](/posts/java/100DaysOfJava/day95), we explored **execution patterns**. In [Part 2 (Day 96)](/posts/java/100DaysOfJava/day96), we covered **core synchronization tools**.

Now in **Part 3**, we tackle **advanced patterns** and the critical skills for **production systems**: debugging, monitoring, and operational readiness.

## Series Overview

This is a **3-part series** on Java Concurrency:

**Part 1 (Day 95):** Foundation & Execution
- Executor, ExecutorService, ScheduledExecutorService
- Future, CompletableFuture, CountDownLatch

**Part 2 (Day 96):** Core Synchronization Patterns
- CyclicBarrier, Semaphore, ThreadFactory, BlockingQueue

**Part 3 (Today - Day 97):** Advanced Patterns & Production Readiness
- DelayQueue, ReentrantLock, Phaser
- Debugging, Monitoring, Production Patterns

---

## What We're Covering Today

**Part 3 (Today):** Advanced Patterns & Production Readiness
1. DelayQueue - Time-delayed execution with exponential backoff
2. ReentrantLock - Fine-grained locking control
3. Phaser - Dynamic multi-phase coordination
4. Debugging Concurrent Code
5. Monitoring Concurrent Systems
6. Production Readiness Checklist

---

## Quick Reference: Part 3 Tools at a Glance

| Tool | TL;DR | Key Gotcha |
|------|-------|------------|
| **DelayQueue** | Queue where items become available after a delay. Built for exponential backoff retries. | Unbounded (grows indefinitely). Requires `Delayed` interface |
| **ReentrantLock** | Explicit locking with timeouts, interruptibility, fair mode. More power than `synchronized`. | Must unlock in `finally` - no automatic unlock on exception |
| **Phaser** | Most advanced - dynamic party registration/deregistration, multiple phases. | Most complex synchronizer. Use only when CountDownLatch/CyclicBarrier won't work |

## 1. DelayQueue: Exponential Backoff Retry

**The Problem:** HTTP requests fail intermittently. Retry immediately and you overwhelm the failing service. Wait too long and users timeout.

DelayQueue holds tasks until a delay expires. Tasks become available for processing only after their delay passes. No manual sleep() calls needed.

**How it works:** Each task stores its trigger time. `take()` call blocks until a task's delay expires.

```java
import java.util.concurrent.*;

public class RetryQueue {
    
    static class RetryTask implements Delayed {
        private final String payload;
        private final long triggerTime;
        private final int attemptNumber;
        
        public RetryTask(String payload, long delayMs, int attemptNumber) {
            this.payload = payload;
            this.triggerTime = System.currentTimeMillis() + delayMs;
            this.attemptNumber = attemptNumber;
        }
        
        @Override
        public long getDelay(TimeUnit unit) {
            long diff = triggerTime - System.currentTimeMillis();
            return unit.convert(diff, TimeUnit.MILLISECONDS);
        }
        
        @Override
        public int compareTo(Delayed other) {
            return Long.compare(this.triggerTime, ((RetryTask) other).triggerTime);
        }
        
        public String getPayload() { return payload; }
        public int getAttemptNumber() { return attemptNumber; }
    }
    
    private final DelayQueue<RetryTask> retryQueue;
    private final ExecutorService worker;
    private final int maxRetries;
    
    public RetryQueue(int maxRetries) {
        this.retryQueue = new DelayQueue<>();
        this.worker = Executors.newSingleThreadExecutor(
            new NamedThreadFactory("retry-worker", false, Thread.NORM_PRIORITY)
        );
        this.maxRetries = maxRetries;
    }
    
    public void start() {
        worker.submit(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    // Blocks until a task's delay expires
                    RetryTask task = retryQueue.take();
                    
                    System.out.println("Attempting delivery (attempt " + task.getAttemptNumber() + "): " + 
                                     task.getPayload());
                    
                    boolean success = sendWebhook(task.getPayload());
                    
                    if (!success && task.getAttemptNumber() < maxRetries) {
                        // Exponential backoff: 2^attempt seconds
                        long backoffMs = (long) Math.pow(2, task.getAttemptNumber()) * 1000;
                        System.out.println("Delivery failed. Retrying in " + backoffMs + "ms");
                        
                        retryQueue.put(new RetryTask(
                            task.getPayload(),
                            backoffMs,
                            task.getAttemptNumber() + 1
                        ));
                    } else if (success) {
                        System.out.println("Delivery successful!");
                    } else {
                        System.err.println("Max retries exceeded. Giving up.");
                    }
                    
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
    }
    
    public void scheduleDelivery(String payload) {
        retryQueue.put(new RetryTask(payload, 0, 1));
    }
    
    private boolean sendWebhook(String payload) {
        // Simulate random failures
        return ThreadLocalRandom.current().nextDouble() > 0.3;
    }
    
    public void shutdown() {
        worker.shutdown();
    }
}
```

**Production note:** This queue lives in memory. Application restart loses pending retries. Persist to Redis or a database if retries must survive restarts.

### Trade-offs

**What you gain:**
- Automatic delay enforcement. No manual sleep() or timers.
- Tasks ordered by trigger time. Earliest task dequeues first.
- Thread-safe. Multiple consumers can call take() concurrently.

**What you pay:**
- Unbounded. No backpressure. Queue grows until memory exhausted.
- Clock-dependent. System time changes affect delays.
- CPU overhead. Internal heap reorders on every insert.
- Boilerplate. Must implement Delayed interface for every task type.

**Critical implementation detail:**

```java
// WRONG: Stores relative delay
class BadDelayedTask implements Delayed {
    private long delay; // 5000ms
    
    public long getDelay(TimeUnit unit) {
        return unit.convert(delay, TimeUnit.MILLISECONDS);
        // Always returns 5000ms. Task never becomes available.
    }
}

// CORRECT: Stores absolute trigger time
class GoodDelayedTask implements Delayed {
    private final long triggerTime; // System.currentTimeMillis() + 5000
    
    public long getDelay(TimeUnit unit) {
        long remaining = triggerTime - System.currentTimeMillis();
        return unit.convert(remaining, TimeUnit.MILLISECONDS);
        // Returns decreasing value. Negative = ready now.
    }
}

// WRONG: Missing compareTo
class BadTask implements Delayed {
    public long getDelay(TimeUnit unit) { /*...*/ }
    // Compiles fine. Throws ClassCastException when queue reorders.
}

// CORRECT: compareTo orders the internal heap
class GoodTask implements Delayed {
    public long getDelay(TimeUnit unit) { /*...*/ }
    
    @Override
    public int compareTo(Delayed other) {
        return Long.compare(
            this.getDelay(TimeUnit.NANOSECONDS),
            other.getDelay(TimeUnit.NANOSECONDS)
        );
        // Earliest trigger time = highest priority
    }
}

// Negative delays are correct behavior
public long getDelay(TimeUnit unit) {
    long remaining = triggerTime - System.currentTimeMillis();
    return unit.convert(remaining, TimeUnit.MILLISECONDS);
    // Negative = trigger time passed. Task ready immediately.
    // Zero = trigger time is now. Task ready immediately.
    // Positive = trigger time in future. Task blocks.
}
```

### Production Pattern: Circuit Breaker with Retry

```java
public class CircuitBreakerRetry {
    private final DelayQueue<RetryTask> retryQueue;
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private volatile boolean circuitOpen = false;
    
    public void execute(String request) {
        if (circuitOpen) {
            throw new CircuitOpenException("Circuit is open");
        }
        
        try {
            callExternalService(request);
            failureCount.set(0); // Reset on success
        } catch (Exception e) {
            int failures = failureCount.incrementAndGet();
            
            if (failures >= 5) {
                circuitOpen = true;
                scheduleCircuitReset();
            }
            
            // Schedule retry with exponential backoff
            long delayMs = (long) Math.pow(2, failures) * 1000;
            retryQueue.put(new RetryTask(request, delayMs, failures));
        }
    }
    
    private void scheduleCircuitReset() {
        retryQueue.put(new RetryTask("RESET_CIRCUIT", 30000, 0));
    }
}
```

---

## 2. ReentrantLock: Fine-Grained Control

**The Problem:** Multiple threads update a shared resource. `synchronized` blocks forever if the lock is held. You need timeouts, interruptibility, or fair queueing.

ReentrantLock provides explicit locking with timeout and interruption support. More verbose than `synchronized`, but you control when to give up waiting.

**Key mechanism:** `tryLock(timeout)` returns false if lock isn't acquired within the timeout. Thread doesn't block indefinitely.

```java
import java.util.concurrent.locks.*;
import java.nio.file.*;
import java.util.concurrent.TimeUnit;

public class ConfigurationManager {
    private final Lock configLock = new ReentrantLock(true); // fair lock
    private final Path configFile;
    private String cachedConfig;
    
    public ConfigurationManager(Path configFile) {
        this.configFile = configFile;
    }
    
    public void updateConfig(String newConfig) {
        // Try to acquire lock with timeout
        try {
            if (configLock.tryLock(5, TimeUnit.SECONDS)) {
                try {
                    System.out.println(Thread.currentThread().getName() + " - Updating config...");
                    
                    // Write to file
                    Files.writeString(configFile, newConfig);
                    
                    // Update cache
                    cachedConfig = newConfig;
                    
                    // Simulate some processing
                    Thread.sleep(1000);
                    
                    System.out.println(Thread.currentThread().getName() + " - Config updated");
                    
                } finally {
                    configLock.unlock(); // ALWAYS in finally block
                }
            } else {
                System.err.println(Thread.currentThread().getName() + 
                                 " - Could not acquire lock within 5 seconds");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println(Thread.currentThread().getName() + " - Interrupted while waiting for lock");
        } catch (Exception e) {
            System.err.println("Config update failed: " + e.getMessage());
        }
    }
    
    public String readConfig() {
        configLock.lock();
        try {
            if (cachedConfig == null) {
                cachedConfig = Files.readString(configFile);
            }
            return cachedConfig;
        } catch (Exception e) {
            return "Error reading config";
        } finally {
            configLock.unlock();
        }
    }
    
    // Advanced: Check lock status without blocking
    public boolean isConfigBeingUpdated() {
        return ((ReentrantLock) configLock).isLocked();
    }
}
```

**Why not synchronized?**

`synchronized` blocks forever if the lock is held. No timeout. No interruption. No way to check if locked without blocking.

ReentrantLock adds:
- `tryLock(timeout)` - give up after N seconds
- `lockInterruptibly()` - thread can be interrupted while waiting
- Fair mode - threads acquire lock in request order (prevents starvation)
- `isLocked()` - check status without blocking

### Trade-offs

**What you gain:**
- Timeout support. Fail fast instead of blocking forever.
- Interruptibility. Shutdown threads cleanly mid-wait.
- Fair mode. Prevent thread starvation under contention.
- Condition variables. Multiple wait queues per lock.

**What you pay:**
- Manual unlock. Forget `finally` block = permanent lock.
- More verbose. 5 lines vs 1 for synchronized.
- Deadlock risk unchanged. Lock ordering still matters.
- No compiler help. synchronized checks happen at bytecode level.

**synchronized vs ReentrantLock:**

| Feature | synchronized | ReentrantLock |
|---------|-------------|---------------|
| **Timeout** | ❌ | ✅ tryLock(timeout) |
| **Interruptible** | ❌ | ✅ lockInterruptibly() |
| **Fair mode** | ❌ | ✅ new ReentrantLock(true) |
| **Try without blocking** | ❌ | ✅ tryLock() |
| **Condition variables** | ❌ (wait/notify only) | ✅ newCondition() |
| **Automatic unlock** | ✅ | ❌ (must use finally) |
| **Performance** | Slightly better | Slightly worse |
| **Simplicity** | ✅ | ❌ |

**Failure modes:**

```java
// WRONG: Exception skips unlock
lock.lock();
doWork(); // Throws IOException
lock.unlock(); // Never executes. Lock held forever.
// All other threads block forever on this lock.

// CORRECT: finally guarantees unlock
lock.lock();
try {
    doWork();
} finally {
    lock.unlock(); // Runs even if doWork() throws
}

// WRONG: Inconsistent lock order causes deadlock
// Thread 1: transfer(accountA, accountB, 100)
synchronized(accountA) {
    synchronized(accountB) { /* transfer */ }
}

// Thread 2: transfer(accountB, accountA, 50)
synchronized(accountB) {
    synchronized(accountA) { /* transfer */ }
}
// Thread 1 holds A, waits for B
// Thread 2 holds B, waits for A
// Deadlock. Both threads blocked forever.

// CORRECT: Always acquire locks in same order
Lock first = getLockById(Math.min(idA, idB));
Lock second = getLockById(Math.max(idA, idB));
first.lock();
try {
    second.lock();
    try {
        doWork();
    } finally {
        second.unlock();
    }
} finally {
    first.unlock();
}
// Both threads acquire locks in ascending ID order. No circular wait.

// WRONG: tryLock without finally
if (lock.tryLock()) {
    doWork(); // Throws exception
    lock.unlock(); // Never executes
}
// Lock held forever

// CORRECT: tryLock with finally
if (lock.tryLock()) {
    try {
        doWork();
    } finally {
        lock.unlock(); // Runs even if doWork() throws
    }
} else {
    // Lock was held. Handle failure.
}

// WRONG: Ignoring interruption
lock.lockInterruptibly(); // Throws InterruptedException - must catch

// CORRECT: Restore interrupt status
try {
    lock.lockInterruptibly();
    try {
        doWork();
    } finally {
        lock.unlock();
    }
} catch (InterruptedException e) {
    Thread.currentThread().interrupt(); // Restore flag
    // Thread was interrupted. Exit gracefully.
}
```

### Advanced Pattern: Read-Write Lock

```java
public class CachedData {
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();
    private Map<String, String> cache = new HashMap<>();
    
    public String read(String key) {
        readLock.lock(); // Multiple readers allowed
        try {
            return cache.get(key);
        } finally {
            readLock.unlock();
        }
    }
    
    public void write(String key, String value) {
        writeLock.lock(); // Exclusive access
        try {
            cache.put(key, value);
        } finally {
            writeLock.unlock();
        }
    }
    
    // Upgrade pattern: read -> write (tricky!)
    public void updateIfNeeded(String key, String newValue) {
        readLock.lock();
        try {
            String current = cache.get(key);
            if (needsUpdate(current, newValue)) {
                // Release read lock before acquiring write lock
                readLock.unlock();
                writeLock.lock();
                try {
                    // Re-check after acquiring write lock
                    current = cache.get(key);
                    if (needsUpdate(current, newValue)) {
                        cache.put(key, newValue);
                    }
                    // Downgrade: acquire read lock before releasing write
                    readLock.lock();
                } finally {
                    writeLock.unlock();
                }
            }
        } finally {
            readLock.unlock();
        }
    }
}
```

---

## 3. Phaser: Dynamic Multi-Phase Coordination

**The Problem:** ETL pipeline with Extract → Transform → Load phases. Workers join when data arrives. Workers leave when their partition completes. Party count changes during execution.

CountDownLatch: Fixed count at creation. Cannot add parties.
CyclicBarrier: Fixed parties. Cannot add or remove.
Phaser: Parties register and deregister during execution.

**How it works:** Each worker calls `register()` on arrival and `arriveAndDeregister()` on completion. Phaser tracks current party count. Phase advances when all registered parties arrive.

```java
import java.util.concurrent.*;
import java.util.stream.IntStream;

public class ETLPipeline {
    
    static class ETLWorker implements Runnable {
        private final Phaser phaser;
        private final int workerId;
        
        public ETLWorker(Phaser phaser, int workerId) {
            this.phaser = phaser;
            this.workerId = workerId;
            phaser.register(); // Register this worker
        }
        
        @Override
        public void run() {
            try {
                System.out.println("Worker-" + workerId + " - Starting EXTRACT phase");
                Thread.sleep(ThreadLocalRandom.current().nextInt(500, 1500));
                System.out.println("Worker-" + workerId + " - EXTRACT complete");
                
                phaser.arriveAndAwaitAdvance(); // Wait for all workers to finish extract
                
                System.out.println("Worker-" + workerId + " - Starting TRANSFORM phase");
                Thread.sleep(ThreadLocalRandom.current().nextInt(500, 1500));
                System.out.println("Worker-" + workerId + " - TRANSFORM complete");
                
                phaser.arriveAndAwaitAdvance(); // Wait for all workers to finish transform
                
                System.out.println("Worker-" + workerId + " - Starting LOAD phase");
                Thread.sleep(ThreadLocalRandom.current().nextInt(500, 1500));
                System.out.println("Worker-" + workerId + " - LOAD complete");
                
                phaser.arriveAndDeregister(); // Complete and leave
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
    
    public void runPipeline() throws InterruptedException {
        // Create phaser with 1 party (main thread)
        Phaser phaser = new Phaser(1) {
            @Override
            protected boolean onAdvance(int phase, int registeredParties) {
                System.out.println("\n=== Phase " + phase + " completed. " + 
                                 registeredParties + " parties registered ===\n");
                return false; // Continue to next phase
            }
        };
        
        ExecutorService pool = Executors.newFixedThreadPool(4);
        
        // Start initial workers
        IntStream.range(0, 4).forEach(i -> 
            pool.submit(new ETLWorker(phaser, i))
        );
        
        // Simulate dynamic worker joining mid-process
        Thread.sleep(2000);
        System.out.println("\n>>> NEW WORKER JOINING <<<\n");
        pool.submit(new ETLWorker(phaser, 99));
        
        // Main thread deregisters
        phaser.arriveAndDeregister();
        
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.MINUTES);
        
        System.out.println("\nETL Pipeline complete!");
    }
}
```

**When to use Phaser:**
- Parties join/leave during execution
- More than 2 phases
- Need phase number tracking

**When NOT to use:**
- Fixed party count → Use CountDownLatch or CyclicBarrier
- Single phase → Use CountDownLatch
- Adds complexity. Only use when simpler tools don't fit.

### Trade-offs

**What you gain:**
- Dynamic parties. Add workers mid-execution. Remove when done.
- Unlimited phases. CountDownLatch is one-shot. CyclicBarrier resets but doesn't track phase number.
- Phase callbacks. `onAdvance()` runs between phases.
- Termination control. Return true from `onAdvance()` to stop.

**What you pay:**
- Complexity. Hardest synchronizer to reason about.
- Register/deregister bugs. Forget to deregister = phase never advances.
- Higher overhead. Atomic operations on every arrive() call.
- Debugging difficulty. Thread dump shows "waiting on Phaser" but not which phase.

**Failure modes:**

```java
// WRONG: Arrive without registering
Phaser phaser = new Phaser(1);
pool.submit(() -> {
    phaser.arriveAndAwaitAdvance(); // IllegalStateException
    // Thread never registered. Phaser doesn't know about it.
});

// CORRECT: Register before arriving
class Worker implements Runnable {
    private final Phaser phaser;
    
    Worker(Phaser phaser) {
        this.phaser = phaser;
        phaser.register(); // Increment party count
    }
    
    public void run() {
        phaser.arriveAndAwaitAdvance(); // Now valid
    }
}

// WRONG: Register but never deregister
phaser.register(); // Party count = 2
doWork();
return; // Exit without deregistering
// Party count still 2. Other threads wait forever for this thread.

// CORRECT: Deregister in finally
phaser.register();
try {
    doWork();
    phaser.arriveAndAwaitAdvance();
} finally {
    phaser.arriveAndDeregister(); // Decrement party count
}

// MISTAKE 3: onAdvance returns true too early
Phaser phaser = new Phaser(1) {
    @Override
    protected boolean onAdvance(int phase, int registeredParties) {
        return true; // Terminates immediately!
    }
};

// CORRECT: Return true only when done
protected boolean onAdvance(int phase, int registeredParties) {
    System.out.println("Phase " + phase + " complete");
    return phase >= 2 || registeredParties == 0; // Stop after phase 2
}
```

**Phaser vs CountDownLatch vs CyclicBarrier:**

| Feature | CountDownLatch | CyclicBarrier | Phaser |
|---------|---------------|---------------|---------|
| **Reusable** | ❌ | ✅ | ✅ |
| **Dynamic parties** | ❌ | ❌ | ✅ |
| **Multiple phases** | ❌ | ✅ | ✅ |
| **Phase tracking** | ❌ | ❌ | ✅ |
| **Complexity** | Low | Low | High |
| **Use case** | One-shot wait | Fixed multi-phase | Dynamic multi-phase |

---

## Debugging Concurrent Code

### Reading Thread Dumps

Application hangs. No error logs. No exceptions. Take a thread dump—it shows every thread's current state and stack trace.

**Windows:**
```powershell
# Get PID
jps

# Generate thread dump
jstack <PID> > thread_dump.txt

# Or send Ctrl+Break to console
```

**Linux:**
```bash
kill -3 <PID>  # Sends SIGQUIT, creates thread dump
```

**Example thread dump entry:**

```
"payment-worker-1" #23 prio=5 os_prio=0 tid=0x00007f8a2c001000 nid=0x4d2 waiting on condition
   java.lang.Thread.State: WAITING (parking)
        at sun.misc.Unsafe.park(Native Method)
        at java.util.concurrent.locks.LockSupport.park(LockSupport.java:175)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer.parkAndCheckInterrupt
        at java.util.concurrent.CountDownLatch.await(CountDownLatch.java:231)
        at com.example.Service.process(Service.java:45)
```

**What this tells you:**
- Thread state: WAITING means blocked on a synchronizer (CountDownLatch, Semaphore, Lock)
- Stack trace: Shows where thread is stuck (line 45 in Service.java)
- Lock info: Which object thread is waiting on

**Red flags:**
- Many threads WAITING on same object → Someone forgot countDown() or release()
- BLOCKED threads with circular dependencies → Deadlock
- Threads named "pool-1-thread-X" → No custom ThreadFactory (debugging nightmare)
- Thread in RUNNABLE for minutes → Infinite loop or expensive computation

### Common Deadlock Patterns

#### Pattern 1: Lock Ordering Deadlock

**Why it deadlocks:**
Thread 1 holds lock A, needs lock B.
Thread 2 holds lock B, needs lock A.
Neither can proceed.

```java
// DEADLOCK
class Account {
    private final Object lock = new Object();
    
    public void transfer(Account to, double amount) {
        synchronized (this.lock) {              // Thread 1 locks A
            synchronized (to.lock) {             // Thread 1 waits for B
                this.balance -= amount;
                to.balance += amount;
            }
        }
    }
}

// Thread 1: accountA.transfer(accountB, 100);  // Locks A, waits for B
// Thread 2: accountB.transfer(accountA, 50);   // Locks B, waits for A
// Both threads wait forever.

// FIX: Always acquire locks in same order
// Use object hash code to determine order
public void transfer(Account to, double amount) {
    Account first = System.identityHashCode(this) < System.identityHashCode(to) 
                    ? this : to;
    Account second = first == this ? to : this;
    
    synchronized (first.lock) {
        synchronized (second.lock) {
            if (this != first) {
                to.balance += amount;
                this.balance -= amount;
            } else {
                this.balance -= amount;
                to.balance += amount;
            }
        }
    }
}

// Now both threads acquire locks in same order. No circular wait.
```

#### Pattern 2: Nested Lock Acquisition

**Why it deadlocks:**
method1() acquires lock1 → lock2
method2() acquires lock2 → lock1
Opposite order = deadlock

```java
// DEADLOCK
class Service {
    private final Lock lock1 = new ReentrantLock();
    private final Lock lock2 = new ReentrantLock();
    
    public void method1() {
        lock1.lock();
        try {
            lock2.lock();  // Acquires lock2 while holding lock1
            try {
                doWork();
            } finally {
                lock2.unlock();
            }
        } finally {
            lock1.unlock();
        }
    }
    
    public void method2() {
        lock2.lock();
        try {
            lock1.lock();  // Opposite order!
            try {
                doWork();
            } finally {
                lock1.unlock();
            }
        } finally {
            lock2.unlock();
        }
    }
}

// FIX: Use tryLock with timeout
// If can't acquire second lock, release first and retry
public void method2() {
    lock2.lock();
    try {
        if (lock1.tryLock(1, TimeUnit.SECONDS)) {
            try {
                doWork();
            } finally {
                lock1.unlock();
            }
        } else {
            // Failed to acquire lock1 - back off
            throw new TimeoutException("Could not acquire lock");
        }
    } finally {
        lock2.unlock();
    }
}
```

#### Pattern 3: Forgotten CountDownLatch

**Why it hangs:**
Latch expects 3 countdowns. Task only counts down on success. If task fails, count stays at 3. `await()` blocks forever.

```java
// HANGS FOREVER
CountDownLatch latch = new CountDownLatch(3);
pool.submit(() -> {
    doWork();
    if (success) {  // BUG: Conditional countdown
        latch.countDown();
    }
});

latch.await(); // Waits forever if doWork() fails

// FIX: Always countDown, regardless of success
pool.submit(() -> {
    try {
        doWork();
    } finally {
        latch.countDown(); // Executes even if doWork() throws
    }
});
```

### Detecting Deadlocks Programmatically

```java
public class DeadlockDetector {
    public static void detectDeadlocks() {
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        long[] deadlockedThreads = threadBean.findDeadlockedThreads();
        
        if (deadlockedThreads != null) {
            ThreadInfo[] threadInfos = threadBean.getThreadInfo(deadlockedThreads);
            
            System.err.println("DEADLOCK DETECTED!");
            for (ThreadInfo info : threadInfos) {
                System.err.println("Thread: " + info.getThreadName());
                System.err.println("Locked on: " + info.getLockName());
                System.err.println("Waiting for: " + info.getLockOwnerName());
                System.err.println("Stack trace:");
                for (StackTraceElement element : info.getStackTrace()) {
                    System.err.println("  " + element);
                }
            }
            
            // Alert monitoring system
            alertOps("Deadlock detected!");
        }
    }
}
```

---

## Monitoring Concurrent Systems

**Why monitor:** Thread pools fail silently. Queue fills up. Threads deadlock. No exceptions thrown. Metrics reveal problems before users notice.

### Key Metrics to Track

```java
public class ConcurrencyMetrics {
    private final MeterRegistry registry;
    
    public void setupMetrics(ExecutorService pool, BlockingQueue<?> queue) {
        // Thread pool metrics
        if (pool instanceof ThreadPoolExecutor) {
            ThreadPoolExecutor tpe = (ThreadPoolExecutor) pool;
            
            registry.gauge("threadpool.active", tpe, ThreadPoolExecutor::getActiveCount);
            registry.gauge("threadpool.size", tpe, ThreadPoolExecutor::getPoolSize);
            registry.gauge("threadpool.queue.size", tpe, 
                e -> e.getQueue().size());
            
            // Alert if queue is growing
            registry.gauge("threadpool.queue.utilization", tpe, e -> {
                int queueSize = e.getQueue().size();
                int remainingCapacity = e.getQueue().remainingCapacity();
                return (double) queueSize / (queueSize + remainingCapacity);
            });
        }
        
        // Task execution metrics
        registry.timer("task.execution.time");
        registry.counter("task.completed");
        registry.counter("task.failed");
        
        // Liveness check
        registry.gauge("system.deadlocked.threads", this, 
            m -> countDeadlockedThreads());
    }
    
    private long countDeadlockedThreads() {
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        long[] deadlocked = threadBean.findDeadlockedThreads();
        return deadlocked != null ? deadlocked.length : 0;
    }
}
```

### Critical Alerts

**Alert on:**

1. **Queue depth > 80% capacity**
   
   **What it means:** Producers add tasks faster than consumers process them.
   
   **What breaks:** Queue fills. New tasks rejected or block forever.
   
   ```java
   if (queueUtilization > 0.8) {
       alert("Queue nearly full - scale consumers");
   }
   ```

2. **All threads busy for > 1 minute**
   
   **What it means:** Every thread in pool is working. No idle threads.
   
   **What breaks:** New tasks queue up. Latency increases.
   
   ```java
   if (activeThreads == poolSize && duration > 60_000) {
       alert("Thread pool saturated - increase size");
   }
   ```

3. **Task duration p99 > SLA**
   
   **What it means:** 99th percentile task takes longer than expected.
   
   **What breaks:** User-facing timeouts. SLA violations.
   
   ```java
   if (taskDurationP99 > slaMs) {
       alert("Task latency exceeds SLA");
   }
   ```

4. **Deadlock detected**
   
   **What it means:** Threads waiting on each other in a cycle.
   
   **What breaks:** Application hangs. Requires restart.
   
   ```java
   if (deadlockedThreads > 0) {
       alert("CRITICAL: Deadlock - restart required");
   }
   ```

5. **Thread count growing**
   
   **What it means:** New threads created but never destroyed.
   
   **What breaks:** Eventually hits OS thread limit. OutOfMemoryError.
   
   ```java
   if (threadCountDelta > 10 && timeWindow < 60_000) {
       alert("Thread leak detected");
   }
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

// BETTER: Formula for I/O-bound
// ThreadCount = NumCores * (1 + WaitTime/ComputeTime)
int poolSize = cores * (1 + (int)(waitTimeMs / computeTimeMs));
```

### 2. Ignoring Shutdown

**What breaks:** Threads keep running after method returns. JVM doesn't exit. Application hangs on shutdown.

```java
// WRONG: No shutdown
public void process() {
    ExecutorService pool = Executors.newFixedThreadPool(10);
    pool.submit(() -> work());
} // Threads still running. Pool never cleaned up.

// CORRECT: Shutdown sequence
public void process() {
    ExecutorService pool = Executors.newFixedThreadPool(10);
    try {
        pool.submit(() -> work()).get();
    } finally {
        pool.shutdown();                              // Stop accepting new tasks
        if (!pool.awaitTermination(60, TimeUnit.SECONDS)) {
            pool.shutdownNow();                       // Force stop running tasks
        }
    }
}
```

### 3. Daemon Threads for Critical Work

**What breaks:** JVM exits while daemon thread is mid-write. Database transaction incomplete. Data corrupted.

**The rule:** Daemon threads die when JVM exits. Non-daemon threads keep JVM alive until they finish.

```java
// WRONG: Daemon thread for DB writes
ThreadFactory factory = r -> {
    Thread t = new Thread(r);
    t.setDaemon(true); // JVM exits → thread dies → DB write lost
    return t;
};

// CORRECT: Non-daemon for critical work
ThreadFactory factory = r -> {
    Thread t = new Thread(r);
    t.setDaemon(false); // JVM waits for thread to finish
    return t;
};
```

### 4. Unbounded Queues

**What breaks:** Producer faster than consumer. Queue grows. Heap fills. OutOfMemoryError.

```java
// WRONG: Unbounded queue
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(); // No limit!

// CORRECT: Bounded queue
BlockingQueue<Task> queue = new ArrayBlockingQueue<>(1000);
// When full, put() blocks. Producer slows down. Backpressure applied.
```

### 5. Swallowing Exceptions

**What breaks:** Task throws exception. `submit()` catches it silently. No logs. No alerts. Silent failure.

**Why it happens:** `submit()` returns Future. Exception stored in Future. If you don't call `get()`, you never see it.

```java
// WRONG: Exception disappears
pool.submit(() -> {
    riskyOperation(); // Throws exception → stored in Future → never retrieved
});

// CORRECT: Explicit error handling
pool.submit(() -> {
    try {
        riskyOperation();
    } catch (Exception e) {
        logger.error("Task failed", e);
        errorTracker.captureException(e);
    }
});
```

---

## Integration Example: Complete Concurrent Pipeline

Combining multiple tools to build a realistic image processing pipeline:

```java
public class ProductionImagePipeline {
    private final ExecutorService downloadPool;
    private final ExecutorService processPool;
    private final BlockingQueue<ImageTask> downloadQueue;
    private final BlockingQueue<ImageTask> processQueue;
    private final Semaphore rateLimiter;
    private final MeterRegistry metrics;
    
    public ProductionImagePipeline(MeterRegistry metrics) {
        this.metrics = metrics;
        
        // Custom thread factories for debugging
        this.downloadPool = Executors.newFixedThreadPool(10,
            new NamedThreadFactory("image-downloader", false, Thread.NORM_PRIORITY));
        this.processPool = Executors.newFixedThreadPool(4,
            new NamedThreadFactory("image-processor", false, Thread.NORM_PRIORITY));
        
        // Bounded queues for backpressure
        this.downloadQueue = new ArrayBlockingQueue<>(100);
        this.processQueue = new ArrayBlockingQueue<>(50);
        
        // Rate limiter: 10 downloads per second
        this.rateLimiter = new Semaphore(10, true);
        
        // Setup monitoring
        setupMetrics();
    }
    
    public CompletableFuture<ProcessedImage> process(String imageUrl) {
        return CompletableFuture
            .supplyAsync(() -> downloadWithRetry(imageUrl), downloadPool)
            .thenApplyAsync(image -> processImage(image), processPool)
            .exceptionally(ex -> {
                metrics.counter("pipeline.failed").increment();
                logger.error("Pipeline failed for " + imageUrl, ex);
                return null;
            });
    }
    
    private RawImage downloadWithRetry(String url) {
        // DelayQueue pattern for retry
        int attempt = 0;
        while (attempt < 3) {
            try {
                // Rate limiting with semaphore
                rateLimiter.acquire();
                try {
                    return download(url);
                } finally {
                    rateLimiter.release();
                }
            } catch (Exception e) {
                attempt++;
                if (attempt >= 3) throw e;
                
                long backoff = (long) Math.pow(2, attempt) * 1000;
                Thread.sleep(backoff);
            }
        }
        throw new RuntimeException("Max retries exceeded");
    }
    
    private void setupMetrics() {
        metrics.gauge("queue.download.size", downloadQueue, BlockingQueue::size);
        metrics.gauge("queue.process.size", processQueue, BlockingQueue::size);
        metrics.gauge("ratelimiter.available", rateLimiter, 
            Semaphore::availablePermits);
    }
    
    public void shutdown() {
        downloadPool.shutdown();
        processPool.shutdown();
        try {
            downloadPool.awaitTermination(60, TimeUnit.SECONDS);
            processPool.awaitTermination(60, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            downloadPool.shutdownNow();
            processPool.shutdownNow();
        }
    }
}
```

---

## Production Readiness Checklist

Before deploying concurrent code:

### Resource Management
- [ ] All thread pools have bounded queues
- [ ] Shutdown handlers registered
- [ ] Timeouts on all blocking operations
- [ ] Thread pool sizes calculated, not guessed

### Observability
- [ ] Thread pools have meaningful names (ThreadFactory)
- [ ] Queue depths monitored
- [ ] Task execution times tracked
- [ ] Deadlock detection enabled
- [ ] Exception handlers log to monitoring system

### Error Handling
- [ ] All Future.get() calls have timeouts
- [ ] Async task exceptions logged
- [ ] Circuit breakers on external calls
- [ ] Retry logic with exponential backoff

### Testing
- [ ] Load tests with concurrent users
- [ ] Chaos engineering (kill threads mid-execution)
- [ ] Thread dump analysis under load
- [ ] Memory profiling for leaks

---

## Complete Toolkit Summary (All 3 Parts)

### Execution Tools (Part 1 - Day 95)
- **Executor** → Submit and forget tasks
- **ExecutorService** → Managed thread pools
- **ScheduledExecutorService** → Periodic execution
- **Future** → Blocking result retrieval
- **CompletableFuture** → Non-blocking async pipelines
- **CountDownLatch** → One-shot coordination

### Synchronization Tools (Part 2 - Day 96)
- **CyclicBarrier** → Multi-phase checkpoints
- **Semaphore** → Resource limiting
- **ThreadFactory** → Thread customization
- **BlockingQueue** → Producer-consumer

### Advanced Tools (Part 3 - Today)
- **DelayQueue** → Delayed execution
- **ReentrantLock** → Custom locking
- **Phaser** → Dynamic multi-phase

---

## Choosing the Right Tool: Decision Tree

From my understanding we can have draw this decision tree as our mental model where we can have some idea to choose which tool will go with whic types of task the best.

![](https://res.cloudinary.com/dlsxyts6o/image/upload/v1764909602/Untitled-2025-12-04-2228_gwudj1.png)


## Key Principles I've Learned

### 1. Always Set Timeouts
`Future.get()` without timeout blocks forever if task hangs. `Lock.lock()` without timeout deadlocks permanently. Always use timeout variants: `get(timeout)`, `tryLock(timeout)`, `acquire(timeout)`.

### 2. Name Your Threads
Thread dump shows "pool-1-thread-17". Which service? Which operation? Unknown. Custom `ThreadFactory` adds meaningful names: "payment-processor-3". Debugging becomes possible.

### 3. Monitor Queue Depths
Queue at 10% → normal. Queue at 90% → consumers falling behind. Queue at 100% → producers blocking. Monitor queue depth. Alert before it fills.

### 4. Graceful Shutdown is Hard
Three steps: `shutdown()` stops accepting new tasks. `awaitTermination(timeout)` waits for running tasks. `shutdownNow()` interrupts if timeout exceeded. Miss any step → threads leak or work lost.

### 5. Beware of Daemon Threads
Daemon thread flushing logs. JVM exits. Thread dies mid-write. Logs lost. Use daemon threads only for non-critical background work.

### 6. Fair vs Unfair Locks Matter
Fair lock: threads acquire in request order. Prevents starvation. Lower throughput.
Unfair lock: any thread can acquire. Higher throughput. Starvation possible.
Default is unfair. Choose explicitly.

### 7. Bounded Resources Prevent Cascading Failures
Unbounded queue fills memory. OOM kills application. Bounded queue applies backpressure. Producer slows down. System stays alive.

### 8. Composition Over Complexity
Need one-shot coordination? CountDownLatch. Need reusable barrier? CyclicBarrier. Need dynamic parties? Then Phaser. Start simple. Add complexity only when required.

---

## When NOT to Use These Tools

Before reaching for concurrency, ask:

**Don't use if:**
- Sequential processing takes < 100ms
- Task is sequential (B depends on A)
- Dataset is small (< 1000 items)
- Debugging complexity outweighs performance gain
- Team lacks concurrency expertise

**Do use if:**
- I/O-bound operations (network, disk, DB)
- Independent tasks that parallelize
- Need to keep UI/API responsive
- Processing large datasets
- Proven bottleneck exists

**Rule:** Measure first. Prove the bottleneck. Then add concurrency. Concurrency adds complexity. Complexity adds bugs. Only pay that cost when the benefit is real.

---

## Understanding the Complete Toolkit

Over these three parts, we've explored **13 essential concurrency tools**. I've used some extensively in production (ExecutorService, Future, CountDownLatch, ReentrantLock), while others (Phaser, DelayQueue) I'm still mastering.

**The insight:** Concurrency isn't about speed. It's about **structure**. How do you coordinate independent work? How do you prevent threads from corrupting shared state? How do you fail gracefully under load?

Each tool solves a specific problem:
- Execute? → ExecutorService
- Wait? → CountDownLatch / CyclicBarrier / Phaser
- Limit? → Semaphore
- Pass work? → BlockingQueue
- Delay? → DelayQueue / ScheduledExecutorService
- Custom locking? → ReentrantLock

The skill is **knowing which tool fits your use case**. That's what these 13 tools teach.

---

## What's Next?

This completes our deep dive into `java.util.concurrent`. More to learn:

- **Virtual Threads (Java 19+)** - Lightweight threads that change the concurrency model
- **Reactive Streams** - Async streams with backpressure (Project Reactor, RxJava)
- **Fork/Join Framework** - Recursive parallelism for divide-and-conquer
- **Parallel Streams** - When and when not to use them
- **Structured Concurrency (Preview)** - Better async task management

Next time you're tempted to spawn a raw `Thread`, ask yourself: **which of these 13 patterns fits my use case?**

That's the question I'm learning to answer.

---

**Previous:** [Day 96 - Java Concurrency Toolkit Part 2: Core Synchronization Patterns](/posts/java/100DaysOfJava/day96)


