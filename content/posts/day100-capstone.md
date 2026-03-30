+++
category = ["Java", "100DaysOfJava"]
date = 2026-03-30T00:00:00Z
description = "An honest retrospective on a challenge that did not happen in a clean streak, and on how learning Java slowly turned into learning how systems behave."
draft = true
ShowToc = false
TocOpen = false
slug = "posts/java/100DaysOfJava/day100.md"
summary = "This challenge started as a way to learn more Java. Over time, it became a way to follow confusion down to memory, coordination, performance, and failure modes."
title = "Day 100: What 100 Days of Java Actually Changed in How I Think About Software"
[cover]
alt = "day100"
caption = "day100"
image = ""
relative = false
+++

Calling this a 100-day challenge without qualification would be a little dishonest.

The archive itself does not support that story. Day 26 is dated September 30, 2021. Day 66 lands on January 20, 2023. Day 77 is March 14, 2024. Day 91 is August 15, 2025. Day 99 is February 13, 2026. It was a very long and research prone . It stretched across years. I disappeared from it, came back to it, and kept finding that the questions had changed.

I started it with a much smaller idea in mind. I thought this was about learning more Java.

At the beginning, that mostly meant learning more APIs, more features, more idioms, and more little utilities I could reach for later. Some of the early posts are exactly that. They are small, direct, and useful in a narrow way: retrying a method with `TimerTask`, emulating a Pair, converting an `Iterator` into a `Spliterator`, working through individual language features one by one.

I still value those posts. They show me learning in public in the most literal sense.

But when I look across the whole archive now, that is not the real story it tells. The bigger change is that the challenge slowly stopped being about collecting Java knowledge and started becoming a way to investigate behavior. I became less interested in naming abstractions and more interested in asking what they were hiding. Memory leaks. Heap dumps. JMX. Off-heap memory. Event loops. Virtual threads. Work distribution. Startup time. The center of gravity moved from "what does this API do?" to "why is this system behaving like that?"

The writing changed with that shift. Early on, I was still trying to sound like I understood the topic before I really did. Somewhere along the way, I stopped trying to sound authoritative and got more comfortable writing from confusion. That made the posts less polished in one sense, but more honest in a better one. The later posts that stayed with me usually begin with a wrong assumption, a gap in my mental model, or a question I could not shake. That is much closer to how I actually learn.

If I had to reduce the whole challenge to one sentence, it would be this: it started as learning Java and gradually became learning how systems behave.

## From Explaining Topics to Investigating Behavior

One of the clearest differences between the earlier and later parts of the archive is not the topic list. It is the shape of the questions.

The earlier posts often behave like explainers. I pick a concept, define it, show a code snippet, and move on. That mode was useful because I was building vocabulary and touching a lot of surface area. It gave me repetition. It forced me to keep shipping. It also sometimes let me stay a little too comfortable. I could finish a post having explained a tool without really testing the edges of my own understanding.

The later posts are sharper because they begin from friction.

The startup-time rabbit hole in Day 94 starts from a concrete problem and then keeps asking where startup time actually goes. It is less "here are some optimizations" and more "I had been thinking about startup time the wrong way." That difference matters.

By [Day 98](/posts/java/100DaysOfJava/day98), the frame is even clearer. The post is not built around "here is virtual threads." It is built around a mistaken model: I thought virtual threads were just green threads, and that model stopped explaining what I was seeing. The writing gets better there because the question gets better.

Then [Day 99](/posts/java/100DaysOfJava/day99) does the same thing again. If virtual threads make blocking I/O scale, why do event loops still exist? That is a much more alive question than a generic comparison between two frameworks. It starts from a misconception, follows it down into selectors and multiplexing, and comes back with a trade-off instead of a slogan.

Even some of the posts I would now write differently were moving in that direction. The one about startup time, the one about printing and logging cost, the later concurrency series, the memory-mapping deep dive, all of them have the same underlying motion: they begin with something that seemed obvious from the surface and then stop being obvious as soon as I looked under it.

That is the growth I care about when I read this archive back. Not that the old writing was bad. Not that the new writing is perfect. Just that the questions got sharper.

## Mechanisms Started Mattering More Than Frameworks

The other change is even simpler to name because I can feel it in the topics themselves: I became less interested in frameworks and more interested in mechanisms.

The memory cluster is where that became impossible to ignore.

The memory leak series around [Day 66](/java/100DaysOfJava/day66), the heap dump post, the JMX posts, and the OutOfMemory alert post all pulled in the same direction. They made memory stop feeling like a mysterious background concern and start feeling like something I could inspect. Retained references, heap state, threshold notifications, dump files, leak patterns, object lifetime: those are not framework topics. They are runtime behavior topics.

Then the later memory-heavy posts pushed that further. In [Day 77](/posts/java/100DaysOfJava/day77), I was writing to allocated memory through `Unsafe`. The next step was the safer FFM direction. By [Day 91](/posts/java/100DaysOfJava/day91), I was looking at memory mapping not as a convenient API trick but as a question about where data actually lives, when it gets loaded, and how much of the work belongs to the heap versus the operating system.

That cluster changed what felt important to me. Surface API differences started to matter less than memory pressure, allocation patterns, and runtime behavior. Even the JMH posts and the later performance posts helped here. They moved performance a little farther away from opinion and a little closer to measurement. The printing post is not really about `println()` versus file writing. It is about where overhead comes from and what kind of cost a friendly abstraction is hiding.

I do not think that means frameworks stopped mattering. They still do. But I stopped finding them sufficient as explanations.

The coordination cluster made the same point from a different angle.

[Day 95](/posts/java/100DaysOfJava/day95) and the two posts that follow it are broad on the surface. They cover concurrency tools. But even there, the interesting part is not "here are twelve APIs." The interesting part is the repeated warning that concurrency is not automatically a win, that the wrong synchronizer creates the wrong shape of failure, and that production systems need coordination as much as they need execution.

That theme becomes much more concrete in those later virtual-thread and event-loop posts. Once I started looking at virtual threads as continuations, heap-allocated stack chunks, mount and unmount behavior, pinning, carrier threads, selectors, and event loops, the old question "which framework should I use?" stopped being very satisfying. The better question was what kind of work I was coordinating, what kind of blocking I was paying for, and what trade-off the runtime was making on my behalf.

That is the practical shift I trust most from this whole stretch.

Memory pressure and runtime behavior started to matter more to me than surface APIs.

Coordination and trade-offs started to matter more to me than "more threads."

Performance explanations started getting better once I looked beneath the abstraction instead of arguing from intuition.

The spliterator material that used to sit in the Day 100 slot makes more sense to me as one late example of that shift than as the final centerpiece. In [Day 100](/posts/java/100DaysOfJava/day100), the real lesson is not that I wrote a custom `Spliterator`. It is that `.parallel()` hid a work-distribution policy I had not thought about carefully enough. Once I noticed the batch-splitting behavior, the problem stopped being "why is Java Streams slow?" and became "how is work being divided, why are cores going idle, and what happens when the default coordination strategy does not fit the workload?"

That is basically the whole retrospective in miniature.

I kept starting from an abstraction I already knew how to use. Then I ran into behavior that abstraction did not explain. Then I followed the behavior down a level.

## What the Writing Habit Changed

I do not want to turn this into a sermon about writing online, because that is not what this challenge was for me.

Still, the writing habit changed the learning itself.

Publishing regularly forced vague curiosity to become a sharper question. It is easy to carry around a fuzzy feeling that something is interesting. It is harder to turn that into a post that begins somewhere concrete, moves through evidence, and ends with a claim that is modest enough to defend.

That discipline shows up in the later archive. More of those posts start with a sentence that amounts to "I thought X, then I found Y." I thought virtual threads were just green threads. I thought virtual threads might make event loops obsolete. I saw memory mapping as a magic trick and then tried to understand the path from kernel to code. I treated startup time like a vague Java problem and then tried to locate the actual bottlenecks.

That pattern is closer to how I really learn than the older style where I tried to sound finished too early.

Writing from confusion did not make me less rigorous. It made me more precise about where the rigor was still missing. If I cannot say what confused me, I usually do not understand the topic well enough yet. If I can name the broken model, the next step gets easier. I know what I am testing.

I think that is why the archive feels more personal later without becoming less technical. The personal part is not confession for its own sake. It is that the posts increasingly admit the shape of the misunderstanding. Once that happens, the technical work has somewhere real to go.

This challenge also made me less patient with generic takes, including my own.

If a performance claim is not connected to a workload, I trust it less now.

If a concurrency claim ignores coordination cost, I trust it less now.

If a framework claim skips the mechanism that makes it work, I trust it less now.

That is probably the main writing lesson I want to keep. Not "publish every day." Not "build in public." Just this: when a question is still blurry, stay with it until the blur has a shape.

## What Changed In How I Think About Software

I did learn more Java from this challenge. It would be silly to pretend otherwise.

I learned APIs I had never touched, internals I had ignored, language features I had only used casually, and tools I probably would not have opened without the pressure of the series. That part is real.

But it is not the part that feels most important now.

What changed more is where my attention goes first.

I pay more attention to memory ownership and allocation than I used to.

I pay more attention to coordination boundaries, handoffs, and cancellation than I used to.

I pay more attention to behavior under load, queueing, blocking, and failure modes than I used to.

I pay more attention to whether an explanation is naming the mechanism or just restating the abstraction.

That is not mastery. If anything, it has made me more aware of how much I still do not understand. But it is a better kind of ignorance. It gives me better questions.

That is also why `Software Scientist's Pursuits` feels like a natural next step to me. Not because I am done with Java, and not because this challenge ended in some clean graduation. It feels natural because the archive was already moving there. The part I want to carry forward is the habit underneath it: probe, measure, question the default story, and keep following the system until the behavior becomes a little less mysterious.

I do not think the honest ending to a project like this is triumph.

It is attention.

I started this trying to learn more Java.

I am ending it paying closer attention to memory, coordination, constraints, failure, and the ways software behaves when the pleasant abstraction runs out.

That feels like a better Day 100 than pretending I finally mastered the language.
