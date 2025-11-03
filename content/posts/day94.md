+++
category = ["Java", "100DaysOfJava", "Perf", "JVM", "Optimization"]
date = 2025-10-30T00:00:00Z
description = "Your Java app takes so much time to start. You've tried everything, or have you? Here's how I cut startup time using techniques you probably haven't tried yet."
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day94"
summary = "Your Java app takes so much time to start. You've tried everything, or have you? Here's how I cut startup time using techniques you probably haven't tried yet."
title = "Day 94: Nobody Told Me Java Application Could Start This Fast and The Rabbit hole I explored"
[cover]
alt = "day94"
caption = "day94"
image = ""
relative = false
+++


A few days ago I attended a company knowledge sharing where one of my brilliant colleauges talked about optimizing java memory and performance tuning. Where he talked about spring boot application start up time and how we can shave off some time to load the application faster. That got me thinking 

That night, I fell down the rabbit hole. And what I found gave me lots of ideas. Turns out, I'd been thinking about startup time all wrong.

## My Journey Structure

I started with a Jersey application startup problem, but quickly 
realized optimization techniques fall into three categories:

1. **JVM-level** (Chapters 1, 4, 5) - Apply to ANY Java app
2. **Spring Boot-specific** (Chapters 2, 3) - Research for future projects
3. **Framework-agnostic architecture** (Chapters 6, 7) - Adaptable to Jersey

I've marked each technique with its applicability.

## The Uncomfortable Truth About Startup Time

Here's something nobody tells you when you're learning Java: **every second of startup time isn't created equal**. 

I used to think "JVM starts slow, deal with it." But that's like saying "traffic exists, deal with it" without asking *why* there's traffic or where the bottleneck actually is.

After digging deep (and I mean JVM logs, profilers, lots of blogs and articles), I discovered a typical breakdown that many Java developers observe:

- **Major part of time goes to classloading** - The JVM reading and parsing your .class files
- **For spring another major time spend in bean creation** - Spring (or your framework) wiring everything together  
- **Another big chunk of time goes into reflection and proxies** - All that runtime magic has a cost
- **Some of time goes into I/O** - Reading configs, connecting to databases

*Note: These are approximate distributions based on analysis from Spring Boot team's [startup optimization research](https://spring.io/blog/2018/12/12/how-fast-is-spring), [Oracle's JVM performance documentation](https://docs.oracle.com/en/java/javase/17/vm/class-data-sharing.html), and profiling multiple applications. Your mileage will vary depending on framework, dependencies, and architecture choices.*

I was dealing with very slow startup time of the Jersey application though my application loads and verifies a lot of stuff before starting still I think there could be improvements.Once I knew where the time was *actually* going, I could fight back.

**Pro Tip**: Before optimizing anything, jump to 
[The Measurement Mindset](#measurement-mindset) to learn how to 
profile your specific bottlenecks. I'm presenting techniques in the 
order I discovered them, but you should measure first.

## Chapter 1: The JVM Strikes Back (Or: How I Learned to Stop Worrying and Love AppCDS)

Let's talk about **Class Data Sharing**. Sounds boring, right? It's not. It's basically a time machine.

Here's the deal: Every time you start your Java app, the JVM loads core classes—String, ArrayList, all those JDK fundamentals. And every time, it does the same work. Parse the class file, verify the bytecode, prepare the internal structures.

What if... we could skip that?

### The AppCDS Discovery

AppCDS (Application Class Data Sharing) lets you create a snapshot of loaded classes and reuse it. Think of it like meal prepping for your JVM.

Here's what I did:

```bash
# Step 1: Generate a list of classes your app loads
java -XX:DumpLoadedClassList=classes.lst \
     -jar my-app.jar

# Step 2: Create the shared archive
java -Xshare:dump \
     -XX:SharedClassListFile=classes.lst \
     -XX:SharedArchiveFile=app-cds.jsa \
     -jar my-app.jar

# Step 3: Run with the shared archive
java -XX:SharedArchiveFile=app-cds.jsa \
     -Xshare:on \
     -jar my-app.jar
```

No code changes. No architecture overhaul. Just telling the JVM to be smarter about something it was already doing.

But I wasn't done. Not even close. 

APPLIES TO: Any Java 10+ application (not Spring-specific)

## Chapter 2: Spring Boot's Little Secrets

I love Spring Boot. I really do. But it's like that friend who insists on checking if you locked the door, turned off the stove, and closed the windows—even when you're just running to the mailbox.

NOTE: While I was exploring Jersey optimization, I researched 
   these Spring Boot techniques. If you're using Spring Boot, these 
   will apply directly. For Jersey/other frameworks, focus on the 
   JVM-level optimizations in Chapters 1, 4, and 5.

### Auto-Configuration: The Double-Edged Sword

Spring Boot's auto-configuration is brilliant for getting started fast. But in production? It's scanning and conditionally configuring things you'll *never* use.

One can have lots of **auto-configurations** enabled, and actually need maybe very few of them.

Here's the before:

```java
@SpringBootApplication
public class MyApp {
    public static void main(String[] args) {
        SpringApplication.run(MyApp.class, args);
    }
}
```

Simple, right? Too simple. It was doing SO much behind the scenes.

Here's after I got specific:

```java
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    HibernateJpaAutoConfiguration.class,
    JmxAutoConfiguration.class,
    RabbitAutoConfiguration.class,
    MongoAutoConfiguration.class,
    // ... and 25 others I wasn't using
})
public class MyApp {
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(MyApp.class);
        app.setBannerMode(Banner.Mode.OFF); // Sorry, Spring banner
        app.setRegisterShutdownHook(false);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

this will trim down some startup time when a spring boot application is starting up.

### The Lazy Revolution

Then I discovered lazy initialization. This was... controversial.

```properties
spring.main.lazy-initialization=true
```

One line. Just one line, but it can have great effect.

What this does is beautiful and slightly dangerous: instead of creating all your beans at startup, Spring creates them when they're first needed.

But here's the catch—and this is important—lazy initialization means errors that would've shown up at startup now appear later, potentially in production. So I paired it with comprehensive integration tests. You can't just YOLO lazy initialization without safety nets.

### The Context Indexer Nobody Talks About

There's this little-known Spring dependency that creates a compile-time index of your components:

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context-indexer</artifactId>
    <optional>true</optional>
</dependency>
```

At compile time, it generates `META-INF/spring.components`. This means Spring doesn't have to scan your entire classpath looking for `@Component` and `@Service` annotations—it already knows where they are.

## Chapter 3: The Nuclear Option (GraalVM Native Image)

At this point, I had to ask myself: how fast could this thing *really* go?

Enter **GraalVM Native Image**. This is the quantum leap, the paradigm shift, the "wait, is this still Java?" moment.

ADVANCED TECHNIQUE: This requires significant build changes and 
    may not work with all libraries. Evaluate carefully.

### What Actually Happens

Normal Java: JVM starts → loads classes → JIT compiles hot paths → your app runs.

Native Image: Ahead-of-time compilation → standalone binary → boom, you're running.

No JVM startup. No classloading. No JIT warmup. Just your app, as a native binary, starting in milliseconds.

Here's what I added to my `pom.xml`:

```xml
<plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
    <version>0.9.28</version>
</plugin>
```

And Spring Boot config:

```properties
spring.aot.enabled=true
```

The build process became... intense. It would take very long time to build. But the result?


### The Tradeoffs (Because Nothing Is Free)

Native image isn't magic. It's hardcore static analysis and ahead-of-time compilation. Here's what I learned the hard way:

1. **Reflection needs hints** - If you use reflection, you need to tell GraalVM about it
2. **Build time increases** - Significantly
3. **Memory at startup is fixed** - No dynamic heap sizing
4. **Some libraries don't work** - Anything doing crazy bytecode manipulation might break

For some use cases its Worth it. For a complex enterprise app with tons of reflection? Maybe not.

## Chapter 4: The Forgotten Optimizations

While we're here, let me share some gems that don't get enough love:

### The Serial GC Trick

For short-lived apps (CLI tools, serverless functions), use the Serial GC:

```bash
-XX:+UseSerialGC
```

G1GC is great for long-running apps, but its initialization overhead is wasted on something that runs for 30 seconds. Serial GC starts faster. Way faster.

### The Heap Size Paradox

I used to think bigger heap = better performance. For startup, it's backwards.

Large heaps take longer to initialize. The JVM has to zero out that memory.

```bash
# Before (my "bigger is better" phase)
-Xms2g -Xmx4g

# After (the "only what I need" enlightenment)  
-Xms64m -Xmx512m
```

For a microservice that uses maybe 200MB at peak? This was a no-brainer. Shaved off **0.2 seconds**.

### The Tiered Compilation Secret

Java's JIT has multiple tiers of optimization. For startup-critical apps, you can stop at tier 1:

```bash
-XX:TieredStopAtLevel=1
```

This means: compile with the simple JIT, skip the expensive optimizations. Your steady-state performance will be lower, but startup? Lightning fast.

## Chapter 5: Build and Packaging—The Overlooked Goldmine

Here's something that I found really intriguing when I started researching about startup time reduction: **how you package your app matters as much as what's in it**.

### The Fat JAR Double Tax

Ever wonder why Spring Boot JARs are called "fat JARs"? They're JARs... containing JARs. And that means your app gets hit with a double classloader overhead.

When you run:
```bash
java -jar my-app.jar
```

The `spring-boot-loader` has to:
1. Unpack nested JARs (or read them from the archive)
2. Create a custom classloader
3. *Then* load your actual classes

It's like having to open a box, to open another box, to get to your actual present.

### The Exploded JAR Revelation

Try this instead:

```bash
# Extract your fat JAR
unzip my-app.jar -d app/

# Run directly from the classpath
java -cp "app/BOOT-INF/classes:app/BOOT-INF/lib/*" com.example.Main
```

No nested JARs. No custom classloader. Just straightforward classpath execution.

### JLink: Your Custom JRE Builder

This one's for the hardcore optimizers. Why ship the entire JDK when you only use a fraction of it?

JLink creates a custom Java runtime with *only* the modules you need:

```bash
# First, see what modules you actually use
jdeps --print-module-deps my-app.jar

# Then build a custom runtime (example output)
jlink --module-path $JAVA_HOME/jmods \
      --add-modules java.base,java.logging,java.sql,java.xml \
      --output custom-jre \
      --compress=2 \
      --no-header-files \
      --no-man-pages
```

Less to load = faster startup. Plus, your Docker images shrink dramatically.

### Dependency Pruning: The Spring Cleaning You've Been Avoiding

I ran this command and I was like why do we use so many dependencies:

```bash
mvn dependency:tree | grep -c "jar"
```

found **206 dependencies.**

Did I need all of them? thats the question I asked Then I started to look which kind of dependencies one can remove?.

dependencies you can think to remove:
- Remove test-scope dependencies leaking into runtime
- Excluded transitive dependencies thats not being used
- Replace heavy libraries with lighter alternatives if possible

Example from my sample projects `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <!-- Don't need embedded Tomcat for this service -->
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
        <!-- Using Log4j2, don't need Logback -->
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

Each JAR on the classpath is I/O overhead. Less JARs = less scanning = faster startup.

## Chapter 6: Architecture Choices That Compound

This is where we get strategic. Code-level tweaks are great, but architectural decisions? They multiply your wins.

### On-Demand Initialization: The "I'll Get to It Later" Pattern

Not everything needs to be ready at startup. Database connection pools? Sure. Your recommendation engine's ML model? Maybe not.

Here's what I changed:

```java
// Before: Everything initialized eagerly
@Bean
public CacheManager cacheManager() {
    CacheManager manager = new CaffeineCacheManager();
    manager.loadAllCaches(); // This takes 2 seconds!
    return manager;
}

// After: Initialize in the background
@Bean
public CacheManager cacheManager() {
    CacheManager manager = new CaffeineCacheManager();
    
    // Load caches asynchronously after startup
    CompletableFuture.runAsync(() -> {
        manager.loadAllCaches();
        log.info("Cache warming complete");
    });
    
    return manager;
}
```

My app now starts, *then* warms up the cache.

### Parallel Initialization: Multithreading for Startup

Why initialize heavy components one-by-one when you have multiple cores?

```java
@Configuration
public class ParallelInitConfig {
    
    @Bean
    public ApplicationRunner parallelInitializer(
            DataSource ds,
            CacheManager cache,
            MessagingClient messaging) {
        
        return args -> {
            CompletableFuture<Void> dbWarmup = CompletableFuture.runAsync(() -> {
                // Warmup database connections
                ds.getConnection().close();
            });
            
            CompletableFuture<Void> cacheWarmup = CompletableFuture.runAsync(() -> {
                cache.loadCriticalData();
            });
            
            CompletableFuture<Void> messagingConnect = CompletableFuture.runAsync(() -> {
                messaging.connect();
            });
            
            // Wait for all to complete
            CompletableFuture.allOf(dbWarmup, cacheWarmup, messagingConnect).join();
            log.info("Parallel initialization complete");
        };
    }
}
```

Three slow tasks that took 4 seconds sequentially? Now they take 1.5 seconds in parallel.

### The Static Initializer Trap

I found this technique when I was researching:

```java
public class ConfigLoader {
    private static final Map<String, String> CONFIG = loadConfig();
    
    private static Map<String, String> loadConfig() {
        // Reads a 50MB XML file
        // Takes 800ms
        return parseXml("huge-config.xml");
    }
}
```

Every time the JVM loads this class (even if we never use the config), we pay the 800ms tax.

Fixed version:

```java
public class ConfigLoader {
    private static volatile Map<String, String> CONFIG;
    
    public static Map<String, String> getConfig() {
        if (CONFIG == null) {
            synchronized (ConfigLoader.class) {
                if (CONFIG == null) {
                    CONFIG = parseXml("huge-config.xml");
                }
            }
        }
        return CONFIG;
    }
}
```

Now it only loads when actually needed. If this service doesn't use the config? We never pay the cost.

## Chapter 7: Code-Level Tricks That Add Up

The small stuff matters. A lot of small optimizations compound into big wins.

### The Reflection Tax

Reflection is slow. Classpath scanning for annotations is slower. You know what's fast? Compile-time code generation.

I replaced this:

```java
@Service
public class DataMapper {
    public UserDTO toDTO(User user) {
        // Uses reflection to map fields
        return modelMapper.map(user, UserDTO.class);
    }
}
```

With **MapStruct**:

```java
@Mapper(componentModel = "spring")
public interface DataMapper {
    // Generated at compile time—zero reflection
    UserDTO toDTO(User user);
}
```

No runtime reflection. No classpath scanning. Just plain old method calls.

### Logging: The Silent Startup Killer

Log4j2, Logback—they're great. But their initialization? Not so much.

I switched from this config:

```xml
<!-- log4j2.xml with complex appenders and filters -->
<Configuration>
    <Appenders>
        <RollingFile name="file">
            <!-- Lots of configuration -->
        </RollingFile>
    </Appenders>
</Configuration>
```

To programmatic configuration:

```java
@Configuration
public class LogConfig {
    @PostConstruct
    public void configureLogs() {
        // Configure only what we need, when we need it
        LoggerContext ctx = (LoggerContext) LogManager.getContext(false);
        Configuration config = ctx.getConfiguration();
        // Minimal setup
    }
}
```

Or for services that don't need fancy logging, I went nuclear:

```properties
# Just use simple logging
org.springframework.boot.autoconfigure.logging=false
```

### Precompiling Configuration

Every Spring Boot startup, we were parsing this:

```yaml
# application.yml - 500 lines of YAML
spring:
  datasource:
    # ... 100 lines
  jpa:
    # ... 150 lines
  # ... etc
```

YAML parsing isn't free. So I created a build-time step:

```java
// At build time, serialize config to binary
@Component
public class ConfigCache {
    static {
        if (Files.exists("config.cache")) {
            // Load pre-parsed config
        } else {
            // Parse YAML and cache it
        }
    }
}
```

## Chapter 8: Docker and Deployment Magic

If you're running in containers (and who isn't these days?), you can look into these.

### Layered Docker Images: The Smart Way

Instead of this:

```dockerfile
FROM openjdk:17
COPY target/my-app.jar /app.jar
CMD ["java", "-jar", "/app.jar"]
```

Use Spring Boot's layered JARs:

```dockerfile
FROM openjdk:17 as builder
WORKDIR /app
COPY target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

FROM openjdk:17
WORKDIR /app
COPY --from=builder app/dependencies/ ./
COPY --from=builder app/spring-boot-loader/ ./
COPY --from=builder app/snapshot-dependencies/ ./
COPY --from=builder app/application/ ./

ENTRYPOINT ["java", "org.springframework.boot.loader.JarLauncher"]
```

Why? Docker caches layers. Your app code changes frequently. Your dependencies? Not so much.

With layered images:
- Dependency layer: cached
- Your code: rebuilds quickly
- Faster builds = faster deployments = less waiting

## The Measurement Mindset: You Can't Optimize What You Don't Measure

Here's something that changed my whole approach: **actually measuring** what's slow.

```bash
# See what classes are loading
java -Xlog:class+load=info -jar app.jar

# Enable Spring startup logging
-Dspring.main.log-startup-info=true

# Java Flight Recorder for deep profiling
java -XX:StartFlightRecording=filename=startup.jfr -jar app.jar
```

Before I did this, I was optimizing blind. "I think Spring is slow, so let me tweak Spring things."

After? "Oh, 1.2 seconds is spent loading Jackson modules I don't even use. Let me exclude those."

Precision beats guessing every time.

## The Startup Time Buffet: Pick What Works for You

Here's my honest recommendation based on what you're building:

| Your Situation | Best Strategy | Expected Startup |
|----------------|---------------|------------------|
| CLI tool or function | GraalVM Native Image | 5-50ms |
| Serverless/K8s microservice | Spring Boot 3 + AOT + AppCDS | 100-500ms |
| REST API (moderate scale) | Lazy init + exclude configs + AppCDS | 800ms-2s |
| Legacy Spring Boot app | Disable unused features + AppCDS | 2-5s |
| Complex enterprise app | Measure first, then optimize hot paths | 3-8s |

## The Lessons That Stuck

After this whole journey, here's what I learned:

1. **Startup time is composable** - Every technique stacks. AppCDS + lazy beans + smaller heap = dramatic results
2. **The JVM is smarter than you think** - But only if you tell it what to optimize
3. **Framework defaults optimize for flexibility, not speed** - You need to get specific
4. **Native Image is real** - Not a gimmick. Production-ready for the right use cases
5. **Measurement changes everything** - Blind optimization is just guessing with extra steps

## The One Thing You Should Do Right Now

If you take nothing else from this post, do this:

```bash

# And this to your JVM args
-XX:SharedArchiveFile=app-cds.jsa -Xshare:on
```

Then, if you want more, come back and try the other techniques. But start there.

## The End? Or Just the Beginning?

Why does classloading take so long? What if we cached it?  
Why are we creating 300 beans at startup? What if we waited?  
Why are we running on the JVM at all? What if we compiled ahead-of-time?

Every "what if" openes a new door.

Your Java app doesn't have to start slow. The tools are there. The techniques work. You just need to start your exloration.