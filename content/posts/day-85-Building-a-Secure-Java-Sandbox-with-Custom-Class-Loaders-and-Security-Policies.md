+++
category = []
date = 2024-10-05T00:00:00Z
description = "Day 85: Building a Secure Java Sandbox with Custom Class Loaders and Security Policies"
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day85"
summary = "Implementing a sandbox application that can take JAR and java file and run it securely"
title = "Day 85: Building a Secure Java Sandbox with Custom Class Loaders and Security Policies – Executing JAR and .java Files Safely"
[cover]
alt = "day85"
caption = "day85"
image = ""
relative = false

+++

In the era of rapid software development, security remains a crucial consideration, especially when running untrusted code. The Java sandbox environment is a powerful tool for ensuring code isolation, enabling secure execution by restricting access to core libraries and system resources. This blog walks through creating a robust sandbox environment in Java using custom class loaders and security policies—tools that are especially valuable for those working on plugins, user-generated scripts, or controlled environments for evaluating code.

### The Basics of Java Sandboxing

Sandboxing in Java involves creating a restricted environment where code can execute safely, isolated from the rest of the system. It allows developers to control which resources are accessible, monitor the classes being loaded, and intercept potentially malicious behaviors. Key components in sandboxing include:

- **Class Loaders**: Responsible for loading classes into the JVM, custom class loaders enable control over which classes and packages can be accessed.
- **Security Policies**: Define the permissions granted to loaded code, restricting access to system properties, file systems, network resources, and other sensitive areas.

### Overview of the Sandbox Application

In this example, we'll build a sandbox application in Java that demonstrates how to execute untrusted code securely. The core components are:

1. **Custom Class Loader**: `SandboxClassLoader` allows only specified core Java packages to be loaded, preventing access to unauthorized classes.
2. **Security Policy**: `SandboxSecurityPolicy` restricts permissions to minimize the impact of any malicious code.
3. **Utility Functions**: `SandboxUtil` contains methods for dynamic Java class compilation and execution.

Let's dive into each component and understand how they contribute to a secure sandbox environment.

---

### Implementing the Custom Class Loader

Our custom class loader, `SandboxClassLoader`, extends `URLClassLoader` and overrides the `loadClass` method to control which classes can be loaded. This ensures that only classes from allowed packages are accessible.

```java
import java.net.URL;
import java.net.URLClassLoader;
import java.util.Set;

public class SandboxClassLoader extends URLClassLoader {
    private static final Set<String> ALLOWED_PACKAGES = Set.of(
        "java.lang.", "java.util.", "java.io."
    );

    public SandboxClassLoader(URL[] urls) {
        super(urls, null); // Specify null to avoid parent delegation
    }

    @Override
    public Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        // Allow classes from allowed packages
        for (String pkg : ALLOWED_PACKAGES) {
            if (name.startsWith(pkg)) {
                return super.loadClass(name, resolve);
            }
        }

        // Prevent loading of other classes
        throw new ClassNotFoundException("Access to class " + name + " is denied.");
    }
}

By specifying null as the parent class loader, we prevent the usual parent delegation mechanism, giving us full control over class loading.

Defining the Security Policy
The SandboxSecurityPolicy class extends Policy and specifies a minimal set of permissions for the sandboxed code.

```java
import java.security.*;

public class SandboxSecurityPolicy extends Policy {
    private final Permissions permissions;

    public SandboxSecurityPolicy() {
        permissions = new Permissions();
        // Grant permissions to read specific system properties
        permissions.add(new PropertyPermission("java.version", "read"));
        permissions.add(new PropertyPermission("java.home", "read"));
        // Add other necessary permissions
    }

    @Override
    public PermissionCollection getPermissions(CodeSource codesource) {
        return permissions;
    }
}
```

This policy restricts the code from performing any unauthorized actions, such as accessing the file system or network, by granting only the permissions explicitly added.

#### Utility Functions for Dynamic Compilation
The SandboxUtil class provides methods to compile Java code at runtime.

```java
import javax.tools.*;
import java.io.IOException;
import java.net.URL;
import java.nio.file.*;
import java.util.List;

public class SandboxUtil {
    public static URL[] compileSource(String sourceCode, String className) throws IOException {
        // Write source code to a temporary file
        Path tempDir = Files.createTempDirectory("sandbox");
        Path javaFile = tempDir.resolve(className + ".java");
        Files.writeString(javaFile, sourceCode);

        // Compile the Java file
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        StandardJavaFileManager fileManager = compiler.getStandardFileManager(null, null, null);

        Iterable<? extends JavaFileObject> compilationUnits =
            fileManager.getJavaFileObjectsFromFiles(List.of(javaFile.toFile()));
        compiler.getTask(null, fileManager, null, List.of("-d", tempDir.toString()), null, compilationUnits).call();

        // Return the URL of the compiled classes
        return new URL[]{tempDir.toUri().toURL()};
    }
}
```

This method writes the provided source code to a file, compiles it, and returns the URL where the compiled classes are located.

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

#### Allowed Code Example:

```java
public class UntrustedCode {
    public static void main(String[] args) {
        System.out.println("Sandboxed code running safely.");
    }
}
```

```java
public class UntrustedCode {
    public static void main(String[] args) throws Exception {
        // Attempt to access the file system (should be denied)
        java.nio.file.Files.readString(java.nio.file.Path.of("secret.txt"));
    }
}
```

In the second example, the code attempts to read a file, which is not permitted by the security policy, resulting in a SecurityException.

### Conclusion
By utilizing custom class loaders and security policies, we can create a secure sandbox environment in Java for executing untrusted code. This approach provides fine-grained control over class access and permissions, ensuring that potentially harmful operations are prevented.

Whether you're developing an application that runs user-generated scripts, building a plugin system, or creating a learning environment that executes arbitrary code, implementing a sandbox is crucial for maintaining security.