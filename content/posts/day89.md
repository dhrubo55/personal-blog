+++
category = ["Java", "100DaysOfJava"]
date = 2025-06-26T00:00:00Z
description = "That "perfect" Singleton you wrote? It's probably creating multiple instances in production—here's why it happens and five bulletproof ways to fix it."
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day89"
summary = "That "perfect" Singleton you wrote? It's probably creating multiple instances in production—here's why it happens and five bulletproof ways to fix it."
title = "Day 89: When Your Singleton Isn't Really a Singleton (And How to Fix It)"
[cover]
alt = "day89"
caption = "day89"
image = ""
relative = false
+++




## The Story Begins: When One Becomes Many

Imagine: You're building a bank's core system, and you need a **logger** that records every transaction. In your ideal world, this logger should be like that one reliable friend everyone turns to and there's only one person and everyone knows where to find them.

You craft what seems like the perfect solution:

````java
public class TransactionLogger {
    private static TransactionLogger instance;
    
    private TransactionLogger() {
        // Initialize expensive logging resources
        System.out.println("Logger initialized at: " + System.currentTimeMillis());
    }
    
    public static TransactionLogger getInstance() {
        if (instance == null) {
            instance = new TransactionLogger();
        }
        return instance;
    }
    
    public void log(String transaction) {
        System.out.println("LOG: " + transaction);
    }
}
````

This looks elegant, doesn't it? One class, one instance, problem solved. But there's a twist in our story—and it's about to get interesting.

## When Reality Strikes: The Race Condition Drama

Imagine our bank system goes live. Hundreds of customers are making transactions simultaneously. Multiple threads are calling `getInstance()` at the exact same moment. What happens next is like a scene from a comedy of errors:

- **Thread A**: "Is instance null? Yes! I'll create one."
- **Thread B**: "Is instance null? Yes! I'll create one too."
- **Thread C**: "Is instance null? Still yes! Another one coming up."

Suddenly, our "one and only" logger has siblings—multiple instances running around, each thinking they're the chosen one. Our singleton has become a "multiple-ton," and chaos ensues.

Let's see this story unfold into code:

````java
@Test
void demonstrateTheChaoticScenario() throws InterruptedException {
    int numberOfThreads = 100;
    Set<TransactionLogger> instances = ConcurrentHashMap.newKeySet();
    CountDownLatch latch = new CountDownLatch(numberOfThreads);
    
    // Launch a hundred threads simultaneously
    for (int i = 0; i < numberOfThreads; i++) {
        new Thread(() -> {
            instances.add(TransactionLogger.getInstance());
            latch.countDown();
        }).start();
    }
    
    latch.await();
    
    // The shocking revelation
    System.out.println("Expected: 1 instance, Actually got: " + instances.size());
    // You might see: "Expected: 1 instance, Actually got: 7" (or any number > 1)
}
````

## The Heroes Enter: Thread-Safe Patterns to the Rescue

Now that we've seen the villain (race conditions) in action, let's meet our heroes, various thread-safe singleton patterns, each with their own superpowers and weaknesses.

### Hero #1: The Traffic Controller (Synchronized Method)

Our first hero is like a traffic controller at a busy intersection—only one car gets the green light at a time.

````java
public class SynchronizedTransactionLogger {
    private static SynchronizedTransactionLogger instance;
    
    private SynchronizedTransactionLogger() {
        System.out.println("Synchronized logger created by: " + Thread.currentThread().getName());
    }
    
    public static synchronized SynchronizedTransactionLogger getInstance() {
        if (instance == null) {
            instance = new SynchronizedTransactionLogger();
        }
        return instance;
    }
}
````

**The Good**: Simple and foolproof. No matter how many threads arrive at the intersection, only one gets to proceed at a time.

**The Not-So-Good**: Here's the catch—even after the construction work at the intersection is done and traffic should flow freely, our traffic controller keeps stopping every single car to check if construction is still ongoing. Every call to `getInstance()` waits for the red light, even when it's completely unnecessary.

Think of it like this: after the first car creates the instance, every subsequent call still has to wait at the traffic light, like being stuck in a construction zone where the work finished hours ago but they forgot to remove the temporary traffic control.


### Hero #2: The Eager Beaver (Eager Initialization)

Our second hero doesn't wait for anyone. They show up to the party early and stay till the end.

````java
public class EagerTransactionLogger {
    // Created immediately when class is loaded
    private static final EagerTransactionLogger instance = new EagerTransactionLogger();
    
    private EagerTransactionLogger() {
        System.out.println("Eager logger ready before anyone asked!");
    }
    
    public static EagerTransactionLogger getInstance() {
        return instance; // No checks needed, already there!
    }
}
````

**The Good**: Lightning fast access and completely thread-safe. The JVM's class loader mechanism guarantees that static fields are initialized exactly once, before any thread can access the class.

**The Not-So-Good**: Like that friend who always arrives two hours early to every party, even the ones they might not attend. If your singleton is resource-heavy and might never be used, you're paying the cost upfront whether you need it or not.

### Hero #3: The Double Agent (Double-Checked Locking)

Our third hero is sophisticated—they have a two-step verification process that's both secure and efficient.

````java
public class DoubleCheckedTransactionLogger {
    // The volatile keyword is crucial here!
    private static volatile DoubleCheckedTransactionLogger instance;
    
    private DoubleCheckedTransactionLogger() {
        System.out.println("Double-checked logger created after careful verification");
    }
    
    public static DoubleCheckedTransactionLogger getInstance() {
        // First check - no synchronization needed if already created
        if (instance == null) {
            synchronized (DoubleCheckedTransactionLogger.class) {
                // Second check - inside synchronized block
                if (instance == null) {
                    instance = new DoubleCheckedTransactionLogger();
                }
            }
        }
        return instance;
    }
}
````

This pattern is like a smart security system:
1. **First Guard**: "Is there already someone inside? Yes? Go ahead!"
2. **Second Guard**: "Wait, let me double-check inside this secure room. Nope, still empty? Okay, you can enter."

**The Good**: After initialization, accessing the instance is as fast as the eager approach. The first null check eliminates synchronization overhead for subsequent calls.

**The Critical Detail**: The [`volatile`](https://mohibulsblog.netlify.app/posts/java/100daysofjava/day54/) keyword isn't just decoration—it's essential! Without it, you might see a partially constructed object due to the way modern processors reorder instructions. It's like ensuring everyone sees the same version of reality at the same time.

### Hero #4: The Hidden Master (Initialization-on-Demand Holder)

Our fourth hero uses ancient Java wisdom—the power of class loading mechanics.

````java
public class HolderTransactionLogger {
    private HolderTransactionLogger() {
        System.out.println("Holder logger created by the master of lazy loading");
    }
    
    // The secret weapon: a static inner class
    private static class LoggerHolder {
        private static final HolderTransactionLogger INSTANCE = new HolderTransactionLogger();
    }
    
    public static HolderTransactionLogger getInstance() {
        return LoggerHolder.INSTANCE; // Class loading magic happens here
    }
}
````

This is like having a wise mentor who only appears when you truly need them. The `LoggerHolder` class isn't loaded until someone calls `getInstance()`, and when it is loaded, the JVM guarantees thread-safe initialization.

**The Good**: Lazy initialization without any explicit synchronization. It's elegant, fast, and leverages the JVM's built-in thread safety guarantees.

**The Beautiful Part**: No locks, no volatile keywords, no complex logic—just pure Java class loading mechanics doing the heavy lifting.

### Hero #5: The Royal Guard (Enum Singleton)

Our final hero is royalty—they have built-in protection against all forms of attack.

````java
public enum EnumTransactionLogger {
    INSTANCE;
    
    private EnumTransactionLogger() {
        System.out.println("Enum logger: Born to be unique!");
    }
    
    public void log(String transaction) {
        System.out.println("ROYAL LOG: " + transaction);
    }
    
    public void doSomething() {
        System.out.println("Performing singleton operations...");
    }
}

// Usage is simple and elegant
EnumTransactionLogger.INSTANCE.log("Transfer completed");
````

**The Good**: 
- Thread-safe by design
- Immune to reflection attacks (try to break it, you can't!)
- Handles serialization correctly (no multiple instances even after deserialization)
- Simple and clean syntax

**The Limitation**: Enums can't extend other classes, which might limit your design flexibility in some scenarios.

## The Ultimate Showdown: Choosing Your Champion

Let me tell you a story about choosing the right tool for the job. Imagine you're a chef, and each singleton pattern is a different kitchen appliance:

| Pattern | When to Use | Like Choosing... |
|---------|-------------|------------------|
| **Synchronized Method** | Simple applications, low concurrency | A reliable old mixer - slow but dependable |
| **Eager Initialization** | Always-needed singletons, startup cost acceptable | A rice cooker - ready when you walk in |
| **Double-Checked Locking** | High performance needed, comfortable with complexity | A professional espresso machine - complex but perfect results |
| **Holder Pattern** | Most general cases | A Swiss Army knife - versatile and elegant |
| **Enum Singleton** | Maximum protection needed | A bank vault - unbreakable security |

## Testing Our Heroes: Proving They Work

Let's put our patterns through their paces with a stress test that would make any singleton proud:

````java
@Test
void stressTestAllSingletonPatterns() throws InterruptedException {
    testSingletonThreadSafety("Holder Pattern", HolderTransactionLogger::getInstance);
    testSingletonThreadSafety("Enum Pattern", () -> EnumTransactionLogger.INSTANCE);
    testSingletonThreadSafety("Synchronized", SynchronizedTransactionLogger::getInstance);
    testSingletonThreadSafety("Double-Checked", DoubleCheckedTransactionLogger::getInstance);
    testSingletonThreadSafety("Eager", EagerTransactionLogger::getInstance);
}

private <T> void testSingletonThreadSafety(String patternName, Supplier<T> instanceSupplier) 
    throws InterruptedException {
    
    int threadCount = 1000;
    Set<T> instances = ConcurrentHashMap.newKeySet();
    CountDownLatch latch = new CountDownLatch(threadCount);
 
    for (int i = 0; i < threadCount; i++) {
        new Thread(() -> {
            instances.add(instanceSupplier.get());
            latch.countDown();
        }).start();
    }
    
    latch.await();
    
    System.out.println(patternName + " - Instances created: " + instances.size());
    assertEquals(1, instances.size(), patternName + " should create only one instance");
}
````

## The Moral of Our Story

In our journey through the land of thread-safe singletons, we've learned that the simple question "How do I create one instance?" has surprisingly complex answers in a multithreaded world.

**The Wisdom I've Gained:**

1. **The naive approach fails** - Race conditions are real and sneaky
2. **Every solution has trade-offs** - Performance vs. simplicity vs. features
3. **The Holder Pattern is often the hero** - Elegant, fast, and thread-safe
4. **Enum singletons are the ultimate protection** - When security matters most
5. **Context matters** - Choose based on your specific needs

**A Final Thought:**

Singletons are like that one friend everyone relies on—powerful when used correctly, but they can make your code harder to test and maintain. Sometimes, dependency injection frameworks offer better alternatives by managing object lifecycles for you.

Remember, the best singleton pattern is often the one you don't need to write yourself. But when you do need one, now you have an arsenal of thread-safe techniques to choose from.

The next time someone asks you about thread-safe singletons, you won't just give them code—you'll tell them a story about race conditions, heroes, and the eternal quest for that perfect "one and only" instance in the chaotic world of multithreaded programming.

## The Implementation Showcase

Here's a complete working example that demonstrates all patterns in action:

````java
public class SingletonShowcase {
    public static void main(String[] args) throws InterruptedException {
        System.out.println("=== Singleton Pattern Showcase ===");
        
        // Test each pattern
        demonstrateHolderPattern();
        demonstrateEnumPattern();
        demonstrateDoubleCheckedLocking();
        
        System.out.println("\n=== Thread Safety Test ===");
        performConcurrencyTest();
    }
    
    private static void demonstrateHolderPattern() {
        System.out.println("\n--- Holder Pattern ---");
        HolderTransactionLogger logger1 = HolderTransactionLogger.getInstance();
        HolderTransactionLogger logger2 = HolderTransactionLogger.getInstance();
        System.out.println("Same instance? " + (logger1 == logger2));
    }
    
    private static void demonstrateEnumPattern() {
        System.out.println("\n--- Enum Pattern ---");
        EnumTransactionLogger.INSTANCE.log("Testing enum singleton");
        System.out.println("Enum instances are always the same: " + 
            (EnumTransactionLogger.INSTANCE == EnumTransactionLogger.INSTANCE));
    }
    
    private static void demonstrateDoubleCheckedLocking() {
        System.out.println("\n--- Double-Checked Locking ---");
        DoubleCheckedTransactionLogger logger1 = DoubleCheckedTransactionLogger.getInstance();
        DoubleCheckedTransactionLogger logger2 = DoubleCheckedTransactionLogger.getInstance();
        System.out.println("Same instance? " + (logger1 == logger2));
    }
    
    private static void performConcurrencyTest() throws InterruptedException {
        int threadCount = 100;
        CountDownLatch latch = new CountDownLatch(threadCount);
        Set<HolderTransactionLogger> instances = ConcurrentHashMap.newKeySet();
        
        for (int i = 0; i < threadCount; i++) {
            new Thread(() -> {
                instances.add(HolderTransactionLogger.getInstance());
                latch.countDown();
            }).start();
        }
        
        latch.await();
        System.out.println("Concurrency test result - Unique instances: " + instances.size());
        System.out.println("Thread safety: " + (instances.size() == 1 ? "PASSED" : "FAILED"));
    }
}
````

And there you have it—your complete guide to thread-safe singletons, served with a side of storytelling and practical wisdom. May your instances be single, your threads be safe, and your code be elegant!
