+++
category = []
date = 2022-07-21T00:00:00Z
description = "Implementing a basic bloom filter to understand its concepts and usages using Java BitSet api"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day54"
summary = "Implementing a basic bloom filter to understand its concepts and usages using Java BitSet api"
title = "Day 54: Implementing a basic Bloom Filter Using Java BitSet api"
[cover]
alt = "Day54"
caption = "Day54"
image = ""
relative = false

+++
1,

First of all lets understand what is a Bloom Filter and how does it work and what are its usages.

Bloom Filter :

Bloom filter is a data structure designed to tell you, rapidly and memory-efficiently, whether an element is present in a set.

The price paid for this efficiency is that a Bloom filter is a **probabilistic data structure**: it tells us that the element either _definitely is not_ in the set or _may be_ in the set

For example, checking availability of username. In this case its a set membership problem, where the set is the list of all registered username. The price we pay for efficiency is that it is probabilistic in nature. That means, there might be some False Positive results. **False positive means**, it might tell that given username is already taken but actually it’s not. 

![Bloom Filters: Visuals for explanation and applied systems | by Brian  Femiano | Level Up Coding](https://miro.medium.com/max/1400/1*hCwivv91BuskNzZ1ebq6jw.png)

here in this scenario we are searching for the user name `Mary` in the database