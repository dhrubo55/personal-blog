+++
category = ["devops", "dns"]
date = 2022-10-03T00:00:00Z
description = "Blue-Green Deployment using DNS to reduce downtime of production application "
draft = true
showtoc = false
slug = "/tutorial/devops/blue-green-release-dns"
summary = "Blue-Green Deployment using DNS to reduce downtime of production application"
title = "Blue-Green Deployment using DNS"
[cover]
alt = "tutorial"
caption = "tutorial"
image = ""
relative = false

+++
Blue-green deployment

First we need to understand what blue-green means. Blue-green deployment is the process of creating more than one production environment so that you can set up a new version before cutting over to it.

Blue/green deployments provide releases with near zero-downtime and rollback capabilities. Main idea behind blue/green deployment is to move traffic between two identical env. Which are running different versions of the application.

The blue environment represents the current application version serving production traffic. In parallel, the green environment is running a different version of the application. After the green env is ready and tested, production traffic is then redirected from blue to green. If any problems are found, you can roll back by reverting traffic back to the blue environment.

Pro's and Con's of Blue/Green Deployment:

In place application upgradation: 

Traditional deployments which upgrades the application in place makes it hard to validate your new application version in a production deployment while continuing to run the earlier version of the application.

Isolated Environments: 

  
Blue/green deployments provide a level of isolation between your blue and green application environments. This helps ensure spinning up a parallel green environment which does not affect resources underpinning your blue environment. This isolation reduces your deployment risk.

Canary Testing and release:

After you deploy the green environment, you have the opportunity to validate it. You might do that with test traffic before sending production traffic to the green environment. Also you can use a very small fraction of production traffic, to better reflect real user traffic. This is called _canary analysis_ or _canary testing_. If you discover the green environment is not operating as expected, there is no impact on the blue environment. You can route traffic back to it, minimizing impaired operation or downtime and limiting the blast radius of impact. 

what is DNS

what is CNAME and A record

How they work

Deployment structure