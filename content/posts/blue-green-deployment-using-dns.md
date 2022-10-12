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

So to understand what is CNAME and A record we first need to understand what is a DNS record. DNS records (aka zone files) are instructions that live in authoritative DNS servers . Authoritative servers provide information about a domain. Including what IP address associates with that domain and how to handle requests for that domain. These records consist of a series of text files written in what is known as DNS syntax. DNS syntax is a string of characters used as commands that tell the DNS server what to do. All DNS records also have a ‘TTL’, which stands for time-to-live. This indicates how often a DNS server will refresh that record.

Two of the most common DNS records are `CNAME` and `A` record.

A :

The `A` stands for "address" and this is the most fundamental type of DNS record: it indicates the IP address of a given domain. 

A records only hold IPv4 addresses. If a website has an IPv6 address, it will instead use an "AAAA" record.

Here is an example of an A record:

example.comrecord type:value:TTL@A192.0.2.114400

The "@" symbol in this example indicates that this is a record for the root domain, and the "14400" value is the TTL (time to live), listed in seconds. The default TTL for A records is 14,400 seconds. This means that if an A record gets updated, it takes 240 minutes (14,400 seconds) to take effect.

The vast majority of websites only have one A record, but it is possible to have several. Some higher profile websites will have several different A records as part of a technique called round robin load balancing. Which can distribute request traffic to one of several IP addresses, each hosting identical content.

How they work

Deployment structure