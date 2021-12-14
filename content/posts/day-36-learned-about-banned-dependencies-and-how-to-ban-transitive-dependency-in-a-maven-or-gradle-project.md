+++
category = []
date = 2021-12-14T00:00:00Z
description = "Using maven-enforcer plugin and gradle constraints to ban already vulnerable libs in maven or gradle project or from any other dependencies as transitive dependencies"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day36"
summary = "Many 3rd party libraries can have vulnerable dependency like recently reported Log4j 2. so to ban them from getting resolved in your maven or gradle project you can use maven-enforcer plugin."
title = "Day 36: Learned about banned dependencies and how to ban transitive dependency in a maven or gradle project"
[cover]
alt = "Day36"
caption = "Day36"
image = ""
relative = false

+++
Last week **CVE** (Common Vulnerabilities and Exposures) -2021-44228 in Apache Log4J logging library which is a **RCE** (Remote Code Execution) class vulnerability was reported.   
Log4J is a popular logging library which is open sourced and used by many projects all over the tech space. 

Patch and resolvable techniques are already provided in many blogs and websites.   
  
Recently i learned about from banned dependencies from [@gunnarmorling's](https://twitter.com/gunnarmorling) tweet . Maven's enforcer plugin can ban certain dependencies using rules.

```xml
<plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-enforcer-plugin</artifactId>
      <version>3.0.0</version>
      <executions>
        <execution>
          <id>ban-bad-log4j-versions</id>
          <phase>validate</phase>
          <goals>
            <goal>enforce</goal>
          </goals>
          <configuration>
            <rules>
              <bannedDependencies>
                <excludes>
                  <exclude>org.apache.logging.log4j:log4j-core:(,2.15.0)</exclude>
                </excludes>
              </bannedDependencies>
            </rules>
            <fail>true</fail>
          </configuration>
        </execution>
      </executions>
    </plugin>
 ```