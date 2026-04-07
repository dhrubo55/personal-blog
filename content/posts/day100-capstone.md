+++
category = ["Java", "100DaysOfJava"]
date = 2026-03-30T00:00:00Z
description = "An honest retrospective on a challenge that did not happen in a clean streak, and on how learning Java slowly turned into learning how systems behave."
draft = false
ShowToc = false
TocOpen = false
slug = "posts/java/100DaysOfJava/day100-capstone.md"
summary = "This challenge started as a way to learn more Java. Over time, it became a way to follow confusion down to memory, coordination, performance, and failure modes."
topics = ["JVM & Performance"]
title = "Day 100: What 100 Days of Java Actually Changed in How I Think About Software"
[cover]
alt = "day100"
caption = "day100"
image = ""
relative = false
+++

Calling this a 100-day challenge without qualification would be a little dishonest.

The posts themselves does not support that story. Day 26 is dated September 30, 2021. Day 66 lands on January 20, 2023. Day 77 is March 14, 2024. Day 91 is August 15, 2025. Day 99 is February 13, 2026. It was a very long, research-heavy stretch. It stretched across years. I sometimes stopped writing and then came back to it, and kept finding that the questions had changed.

I started it with a much smaller idea in mind. I thought this was about learning more about backend using java.

At the beginning, that mostly meant learning more APIs, more features, more idioms, and more little utilities I could reach for later. Some of the early posts are exactly that. They are small, direct, and useful in a narrow way: retrying a method with `TimerTask`, emulating a Pair, converting an `Iterator` into a `Spliterator`, working through individual language features one by one.

I still value those posts. They show me learning in public in the most literal sense.

But when I look across the posts now, that is not the real story it tells. The bigger change is that the challenge slowly stopped being about collecting Java knowledge and started becoming a way to investigate behavior. I became less interested in naming abstractions and more interested in asking what they were hiding. Memory leaks. Heap dumps. JMX. Off-heap memory. Event loops. Virtual threads. Work distribution. Startup time. The center of gravity moved from "what does this API do?" to "why is this system behaving like that?"

The writing changed with that shift. Early on, I was still trying to sound like I understood the topic before I really did. Somewhere along the way, I stopped trying to sound authoritative and got more comfortable writing from confusion. That made the posts less polished in one sense, but more honest in a better one. The later posts that stayed with me usually begin with a wrong assumption, a gap in my mental model, or a question I could not shake. That is much closer to how I actually learn.

If I had to reduce the whole challenge to one sentence, it would be this: `it started as learning Java and gradually became learning how systems behave.`

## From Explaining Topics to Investigating Behavior

One of the clearest differences between the earlier and later parts of these posts is not the topic list. It is the shape of the questions.

The earlier posts often behave like explainers. I pick a concept, define it, show a code snippet, and move on. That mode was useful because I was building vocabulary and touching a lot of surface area. It gave me repetition. It forced me to keep shipping. It also sometimes let me stay a little too comfortable. I could finish a post having explained a tool without really testing the edges of my own understanding.

The startup-time rabbit hole in [Day 94](/posts/posts/java/100DaysOfJava/day94) starts from a concrete problem and then keeps asking where startup time actually goes. It is less "here are some optimizations" and more "I had been thinking about startup time the wrong way." That difference matters.

By [Day 98](/posts/posts/java/100DaysOfJava/day98), the frame is even clearer. The post is not built around "here is virtual threads." It is built around a mistaken model: I thought virtual threads were just green threads, and that model stopped explaining what I was seeing. The writing gets better there because the question gets better.

Then [Day 99](/posts/posts/java/100DaysOfJava/day99) does the same thing again. If virtual threads make blocking I/O scale, why do event loops still exist? That is a much more alive question than a generic comparison between two frameworks. It starts from a misconception, follows it down into selectors and multiplexing and then I understood that its a trade-off

Even some of the posts I would now write differently were moving in that direction. The one about startup time, the one about printing and logging cost, the later concurrency series, the memory-mapping deep dive, all of them have the same underlying motion: they begin with something that I felt obvious from the surface and then stop being obvious as soon as I looked under it.

## Mechanisms Started Mattering More Than Frameworks

The other change is even simpler to name because I can feel it in the topics themselves: I became less interested in frameworks and more interested in systems and how are they working to make the things tha I want.

The memory leak series around [Day 66](/posts/posts/java/100DaysOfJava/day66), the heap dump post, the JMX posts, and the OutOfMemory alert post all pulled in the same direction. They made memory stop feeling like a mysterious background concern and start feeling like something I could inspect. Retained references, heap state, threshold notifications, dump files, leak patterns, object lifetime: those are runtime-behavior topics, not framework topics.

Then the later memory-heavy posts pushed that further. In [Day 77](/posts/posts/java/100DaysOfJava/day77), I was writing to allocated memory through `Unsafe`. The next step was the safer FFM direction. By [Day 91](/posts/posts/java/100DaysOfJava/day91), I was looking at memory mapping not as a convenient API trick but as a question about where data actually lives, when it gets loaded, and how much of the work belongs to the heap versus the operating system.

Even the JMH posts and the later performance posts helped here. They moved performance a little farther away from opinion and a little closer to measurement. The printing post is not really about `println()` versus file writing. It is about where overhead comes from and what kind of cost a friendly abstraction is hiding.That does not mean frameworks stopped mattering. They just stopped feeling sufficient as explanations.

[Day 95](/posts/posts/java/100DaysOfJava/day95) and the two posts that follow it are broad on the surface. They cover concurrency tools. But even there, the interesting part is not "here are twelve APIs." The interesting part is the repeated warning that concurrency is not automatically a win, that the wrong synchronizer creates the wrong shape of failure, and that production systems need coordination as much as they need execution.

That theme becomes much more concrete in those later virtual-thread and event-loop posts. Once I started looking at virtual threads as continuations, heap-allocated stack chunks, mount and unmount behavior, pinning, carrier threads, selectors, and event loops, the old question "which framework should I use?". The new question I started to ask was what is happening inside and how can it help.

The [spliterator](/posts/posts/java/100DaysOfJava/spliterator) material that I thought I would write for 100th day makes more sense to me as one late example of that shift than as the final centerpiece. The real lesson is not that I wrote a custom `Spliterator`. It is that `.parallel()` hid a work-distribution policy I had not thought about carefully enough. Once I noticed the growing-batch behavior, the problem stopped being "why is Java Streams slow?" and became "how is work being divided, why are cores going idle, and what happens when the default coordination strategy does not fit the workload?"

At the code level, the turning point was almost embarrassingly small:

```java
@Override
public Spliterator<T> trySplit() {
    final HoldingConsumer<T> holder = new HoldingConsumer<>();
    if (!tryAdvance(holder)) return null;
    final Object[] batch = new Object[batchSize];
    int j = 0;
    do { batch[j] = holder.value; }
    while (++j < batchSize && tryAdvance(holder));
    return Spliterators.spliterator(batch, 0, j, characteristics());
}
```

The code itself is not the point. The point is that the real problem was sitting one layer below the API I thought I was using. That is basically the whole point.
I kept starting from an abstraction I already knew how to use. Then I ran into behavior that abstraction did not explain. Then I followed the behavior down a level.

## What the Writing Habit Changed
This #100DaysOfJava challange helped me to better think by writing these online. Publishing regularly forced vague curiosity to become a good question. It is easy to carry around a fuzzy feeling that something is intriguing. It is harder to turn that into a post that begins somewhere concrete, moves through evidence, and ends with a claim that is modest enough to defend.

I thought virtual threads were just green threads. I thought virtual threads might make event loops obsolete. I saw memory mapping as a magic trick and then tried to understand the path from kernel to code. I treated startup time like a vague Java problem and then tried to locate the actual bottlenecks.

That pattern is closer to how I really learn than the older style where I tried to sound finished too early. Writing from confusion did not make me less rigorous. It made the missing rigor easier to locate. If I can name the broken model, I know what I am testing.

That is probably the main writing lesson I want to keep. Not "publish every day." Not "build in public." Just this: `when a question is still blurry, stay with it until its a little bit clearer.`

## What Changed In How I Think About Software Engineering

I did learn a littl bit more Java from this challenge.I learned APIs I never had to work with directly in my day job, internals which I didnt new how it worked or even existed, language features I had only used casually, and tools I probably would not have opened if I havent written these series.

This is not mastery. If anything, it has made me more aware of how much I still do not understand. But it is a better kind of ignorance. It gives me better questions.

That is also why `Chaos;System;Clarity` my new newsletter where I will explore the chaotically beautiful world of Software Engineering and AI. This feels like a natural next step to me. Not because I am done with Java, and not because this challenge ended in some clean graduation. It feels natural because these posts was already moving there. The part I want to carry forward is the habit underneath it: `think, probe, measure, question the default story`, and `keep following the system until the behavior becomes a little less mysterious`.

I started this trying to learn more Java. I am closing this challange by learning 
- how deep the java ecosystem can be
- how these deep abstractions create these modern api's
- how to think about the systems behavior to determine what capabilites I have
- how to think in systems
