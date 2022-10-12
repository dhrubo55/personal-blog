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

Rollback:

This ability to simply roll traffic back to the existing production environment is a key benefit of blue/green deployments. You can roll back to the blue environment at any time during the deployment process. Impaired operation or downtime is minimized because impact is limited to the window of time between green environment issue detection and shift of traffic back to the blue environment. Additionally, impact is limited to the subset of traffic going to the green environment, not all traffic. If the blast radius of deployment errors is reduced, so is the deployment risk.

what is DNS

The Domain Name System (DNS) is the phonebook of the Internet. DNS translates human readable domain names (for example, www.amazon.com) to machine readable IP addresses (for example, 192.0.2.44) .

All computers on the Internet, from your smart phone or laptop to the servers that serve content for massive retail websites find and communicate with one another by using numbers. These numbers are known as **IP addresses**. When you open a web browser and go to a website, you don't have to remember and enter a long number. Instead, you can enter a **domain name** like example.com and still end up in the right place.

what is CNAME and A record

There are 

How they work

Deployment structure