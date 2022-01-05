+++
category = []
date = 2022-01-05T00:00:00Z
description = "How to enable disable features for paid and unpaid users using feature toggle pattern"
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day37"
summary = "Feature toggle service to enable disable any feature for paid and unpaid users"
title = "Day 37: Feature toggle to enable disable features for paid and unpaid user"
[cover]
alt = "Day37"
caption = "Day37"
image = ""
relative = false

+++
Feature toggle is used to easily enable and disable features for some group of users of the applications.  Here `Usergroup.java` is used to define the user groups which are free and paid users. 
`TieredFeatureToggle.java` uses this paid user information to show custom messsage to paid users.

Here is the example 

{{<replit src="replit.com/@dhrubo55/UpbeatHappyProgramminglanguages">}}