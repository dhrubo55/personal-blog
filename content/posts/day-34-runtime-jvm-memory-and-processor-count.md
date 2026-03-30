+++
category = ["Java", "100DaysOfJava"]
date = 2021-12-01T00:00:00Z
description = "Inspecting JVM runtime memory and available processor count with Runtime.getRuntime()."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day34"
summary = "Inspecting JVM runtime memory and available processor count with Runtime.getRuntime()."
title = "Day 34: Inspecting JVM runtime memory and processor count with Runtime"
[cover]
alt = "Day34"
caption = "Day34"
image = ""
relative = false

+++

Inspecting JVM runtime memory and available processor count with `Runtime.getRuntime()`.

Transcribed from the original LinkedIn image post.

```java
import org.apache.commons.io.FileUtils;

class Day34 {
    public static void main(String[] args) {
        int availableCoreCountToJVM = Runtime.getRuntime().availableProcessors();
        long maxMemoryUsableToJVM = Runtime.getRuntime().maxMemory();
        long availableFreeMemoryInJVM = Runtime.getRuntime().freeMemory();
        long JVMTotalMemory = Runtime.getRuntime().totalMemory();

        System.out.println("Amount of max memory for JVM : "
            + FileUtils.byteCountToDisplaySize(maxMemoryUsableToJVM));
        System.out.println("Amount of total memory in JVM : "
            + FileUtils.byteCountToDisplaySize(JVMTotalMemory));
        System.out.println("Amount of free memory in JVM : "
            + FileUtils.byteCountToDisplaySize(availableFreeMemoryInJVM));
        System.out.println("Available CPU core count in JVM: " + availableCoreCountToJVM);
    }
}
```

The original LinkedIn graphic is preserved below.

![Day 34 LinkedIn post](/images/100daysofjava/linkedin/day34.png)
