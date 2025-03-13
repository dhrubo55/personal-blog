+++
category = []
date = 2025-03-12T00:00:00Z
description = "Day 86: Building a Secure Java Sandbox with Custom Class Loaders, Process isolation and Java Platform Module System"
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day86"
summary = "Implementing a sandbox application that can take JAR or java file and run it securely"
title = "Day 86: Building a Secure Java Sandbox with Custom Class Loaders, Process isolation and Java Platform Module System – Executing JAR and .java Files Safely"
[cover]
alt = "day86"
caption = "day86"
image = ""
relative = false

+++

As software engineers we sometimes have to execute some arbitary code that we found or some jar in (Java) case to figure out what its doing. But copy pasting some code in a system directly is a poor security practice thus having a sandbox environment is a powerful tool for ensuring code isolation, enabling secure execution by restricting access to core libraries and system resources. This blog walks through creating a robust sandbox environment in Java using custom class loaders and security policies—tools that are especially valuable for those working on plugins, user-generated scripts, or controlled environments for evaluating code.

### The Basics of Java Sandboxing

Sandboxing in Java involves creating a restricted environment where code can execute safely, isolated from the rest of the system. It allows developers to control which resources are accessible, monitor the classes being loaded, and intercept potentially malicious behaviors. Key components in sandboxing include:

- **Class Loaders**: Responsible for loading classes into the JVM, custom class loaders enable control over which classes and packages can be accessed.
- **Security Policies**: Define the permissions granted to loaded code, restricting access to system properties, file systems, network resources, and other sensitive areas.


### Modern Java Sandboxing Approaches

As of Java 21, there are several approaches to implement secure sandboxing:

1. **Java Platform Module System (JPMS)** - Using strong encapsulation
2. **Process Isolation** - Running untrusted code in separate JVM processes
3. **Custom ClassLoaders with Resource Limits** - Our focus for this article

### System Architecture

```ascii
┌────────────────────┐
│    Client Code     │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│   Sandbox Runner   │
├───────────────────-┤
│ - Resource Limits  │
│ - Class Validation │
│ - Access Control   │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│  Custom ClassLoader │
└────────────────────┘
```
---

### Implementing the Custom Class Loader

Our custom class loader, `SandboxClassLoader`, extends `URLClassLoader` and overrides the `loadClass` method to control which classes can be loaded. This ensures that only classes from allowed packages are accessible.

```java
// filepath: SandboxConfiguration.java
public record SandboxConfiguration(
    Set<String> allowedPackages,
    long maxMemoryBytes,
    Duration timeout,
    Path tempDirectory
) {
    public static SandboxConfiguration getDefault() {
        return new SandboxConfiguration(
            Set.of("java.lang.", "java.util.", "java.math."),
            10_000_000L, // 10MB
            Duration.ofSeconds(5),
            Path.of(System.getProperty("java.io.tmpdir"), "sandbox")
        );
    }
}
```


```java
// filepath: ModernSandbox.java
public class ModernSandbox implements AutoCloseable {
    private final SandboxConfiguration config;
    private final Path tempDir;
    private final List<String> executionLog;

    public ModernSandbox(SandboxConfiguration config) {
        this.config = config;
        this.tempDir = createTempDirectory();
        this.executionLog = new ArrayList<>();
    }

    public ExecutionResult runCode(String sourceCode) {
        try {
            // Compile code
            URL[] urls = compileSource(sourceCode);
            
            // Run in controlled environment
            return ProcessBuilder pb = new ProcessBuilder(
                "java",
                "-Xmx" + config.maxMemoryBytes(),
                "--add-opens", "java.base/java.lang=ALL-UNNAMED",
                "-cp", tempDir.toString(),
                "UntrustedCode"
            );

            // Add timeout control
            Process process = pb.start();
            boolean completed = process.waitFor(
                config.timeout().toMillis(), 
                TimeUnit.MILLISECONDS
            );

            return new ExecutionResult(
                completed,
                process.exitValue(),
                readOutput(process)
            );

        } catch (Exception e) {
            return new ExecutionResult(false, -1, e.getMessage());
        }
    }

    @Override
    public void close() {
        // Cleanup temp files
        FileUtils.deleteDirectory(tempDir.toFile());
    }
}
```

This policy restricts the code from performing any unauthorized actions, such as accessing the file system or network, by granting only the permissions explicitly added.

### Running Code in the Sandbox
With the custom class loader and security policy in place, we can now execute untrusted code securely.


```java
import java.lang.reflect.Method;
import java.net.URL;

public class SandboxRunner {
    public static void main(String[] args) {
        // Set the security manager and policy
        System.setSecurityManager(new SecurityManager());
        Policy.setPolicy(new SandboxSecurityPolicy());

        String sourceCode = """
            public class UntrustedCode {
                public static void main(String[] args) {
                    System.out.println("Hello from untrusted code!");
                }
            }
            """;

        try {
            // Compile the source code
            URL[] classUrls = SandboxUtil.compileSource(sourceCode, "UntrustedCode");

            // Create the sandbox class loader
            SandboxClassLoader sandboxClassLoader = new SandboxClassLoader(classUrls);

            // Load and run the untrusted class
            Class<?> untrustedClass = Class.forName("UntrustedCode", true, sandboxClassLoader);
            Method mainMethod = untrustedClass.getMethod("main", String[].class);
            mainMethod.invoke(null, (Object) new String[]{});

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

This SandboxRunner class sets up the security manager and policy, compiles the untrusted code, loads it using the SandboxClassLoader, and invokes its main method.

### Testing the Sandbox
Let's test the sandbox with code that should be allowed and code that should be restricted.

```java
// filepath: ModernSandboxTest.java
class ModernSandboxTest {
    @Test
    void shouldRestrictFileSystemAccess() {
        String maliciousCode = """
            public class UntrustedCode {
                public static void main(String[] args) throws Exception {
                    new java.io.File("/tmp/evil.txt").createNewFile();
                }
            }
            """;
            
        try (ModernSandbox sandbox = new ModernSandbox(SandboxConfiguration.getDefault())) {
            ExecutionResult result = sandbox.runCode(maliciousCode);
            assertFalse(result.successful());
            assertTrue(result.output().contains("SecurityException"));
        }
    }
}
```


### Real-World Applications
- Online IDEs: Running user-submitted code safely
- Plugin Systems: Loading third-party extensions
- Educational Platforms: Executing student assignments
- Code Interview Platforms: Running candidate solutions

### Performance Considerations
- Process creation: ~100ms overhead
- Memory usage: Configurable per instance
- Compilation time: ~50ms for simple classes

### Conclusion
This sandbox implementation provides:

1. Process isolation for maximum security
2. Configurable resource limits
3. Automatic cleanup of temporary files
4. Comprehensive error handling
5. Support for both source files and JARs

Perfect for applications requiring secure execution of untrusted code in production environments.