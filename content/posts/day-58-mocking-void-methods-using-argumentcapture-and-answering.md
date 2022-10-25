+++
category = []
date = 2022-10-23T00:00:00Z
description = "Mocking void methods using ArgumentCapture and Answering"
draft = true
showtoc = false
slug = "/java/100daysofjava/day58"
summary = "Mocking void methods using ArgumentCapture and Answering"
title = "Day 58: Mocking void methods using ArgumentCapture and Answering"
[cover]
alt = "day58"
caption = "day58"
image = ""
relative = false

+++
When unit testing any java class which have void methods inside it and also needed to be mocked. Then we mock them in 4 ways using mockito's mocking method's and they are -

1. doNothing() & ArgumentCapture
2. doThrow()
3. doAnswer()
4. doCallRealMethod()

### doNothing() :

when using doNothing() as its name suggest it does nothing. So when verifying we need to verify if the method is called or not.



### doNothing() + ArgumentCaptor :

So before going into how this helps mocking void method. Let us learn about what is `ArgumentCaptor`

#### ArugmentCaptor

ArgumentCaptor allows us to capture an argument passed to a method to inspect it. This is useful when we can't access the argument outside of the method we'd like to test.