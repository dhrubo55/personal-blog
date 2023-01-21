+++
category = ["100DaysOfJava"]
date = 2023-01-21T00:00:00Z
description = "Finding memory leak by analyzing GC and memory dump using VisualVM and Eclipse MAT "
draft = true
showtoc = true
slug = "/java/100DaysOfJava/day67"
summary = "Understanding and finding the causes and types of memory leaks and tools and suggestions to fix them"
title = "Day 67: Becoming a memory plumber; A tale of Memory Leak and how to find them ( part 1)"
[cover]
alt = "day67"
caption = "day67 "
image = ""
relative = false

+++
1. What is memory leak
2. What problems it causes
3. Types
4. Analyzing tools
5. What to analyze and how
6. What can we do to prevent it
7. conclusion with example

### Analyze for finding Memory leaks

In order analyze whether your program contains any potential Memory Leaks you will need some kind specialized tools like HeapHero , JProfiler , VisualVM etc., these allow you view what exactly happening under hood during runtime & identify problematic areas ahead time before problems start manifesting themselves on production environment

### Steps to prevent Memory leaks

To prevent Memory Leaks occurring its important ensure all resources get closed properly at end each operation ; try avoid creating too many temporary variables unnecessarily & keep track object lifetime create them only necessary basis then dispose off quickly once done with it ; finally make sure Garbage Collector running correctly so old unused objects get cleared up regularly thus freeing up valuable system resources

### Memory leak issue i faced in my work