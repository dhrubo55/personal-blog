+++
category = []
date = 2022-02-03T00:00:00Z
description = "Distributed unique id's generator based on device MAC address and epoch time and supplier"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day41"
summary = "Generating unique id's based on device MAC address and epoch time"
title = "Day 41: Generating unique id's based on device MAC address and epoch time"
[cover]
alt = "Day41"
caption = "Day41"
image = ""
relative = false

+++
Generating unique id's based on device MAC address and default timezone epoch time of given or a default time. These id's can be generated in multiple machines as device mac address is used to create the id.  
  
64 bit Id format is  
**Epoch Time** - (**41 bits**) is used of epoch time and added to the id creation process. Max timestamp that can be represented is 2^41

**Machine Id** - (**10 bits**) machine id is calculated from MAC address and as 10 bits considered so max machines allowed will be 2^10

**Local counter per machine**: **sequence bits** (**12 bits**) are a local counter for each machines. Max value would be 2 ^ 12.

The one remaining sign bit is remained and its set to 0