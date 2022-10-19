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
### Blue-green deployment

First we need to understand what blue-green means. Blue-green deployment is the process of creating more than one production environment so that you can set up a new version before cutting over to it.

Blue/green deployments provide releases with near zero-downtime and rollback capabilities. Main idea behind blue/green deployment is to move traffic between two identical env. Which are running different versions of the application.

The blue environment represents the current application version serving production traffic. In parallel, the green environment is running a different version of the application. After the green env is ready and tested, production traffic is then redirected from blue to green. If any problems are found, you can roll back by reverting traffic back to the blue environment.

### Pro's and Con's of Blue/Green Deployment:

#### In place application upgradation:

Traditional deployments which upgrades the application in place makes it hard to validate your new application version in a production deployment while continuing to run the earlier version of the application.

#### Isolated Environments:

Blue/green deployments provide a level of isolation between your blue and green application environments. This helps ensure spinning up a parallel green environment which does not affect resources underpinning your blue environment. This isolation reduces your deployment risk.

#### Canary Testing and release:

After you deploy the green environment, you have the opportunity to validate it. You might do that with test traffic before sending production traffic to the green environment. Also you can use a very small fraction of production traffic, to better reflect real user traffic. This is called _canary analysis_ or _canary testing_. If you discover the green environment is not operating as expected, there is no impact on the blue environment. You can route traffic back to it, minimizing impaired operation or downtime and limiting the blast radius of impact.

#### Rollback capabilities:

This ability to simply roll traffic back to the existing production environment is a key benefit of blue/green deployments. You can roll back to the blue environment at any time during the deployment process. Impaired operation or downtime is minimized because impact is limited to the window of time between green environment issue detection and shift of traffic back to the blue environment. Additionally, impact is limited to the subset of traffic going to the green environment, not all traffic. If the blast radius of deployment errors is reduced, so is the deployment risk.

### What is DNS

The Domain Name System (DNS) is the phonebook of the Internet. DNS translates human readable domain names (for example, www.amazon.com) to machine readable IP addresses (for example, 192.0.2.44) .

All computers on the Internet, from your smart phone or laptop to the servers that serve content for massive retail websites find and communicate with one another by using numbers. These numbers are known as **IP addresses**. When you open a web browser and go to a website, you don't have to remember and enter a long number. Instead, you can enter a **domain name** like example.com and still end up in the right place.

### What is CNAME and A record

So to understand what is CNAME and A record we first need to understand what is a DNS record. DNS records (aka zone files) are instructions that live in authoritative DNS servers . Authoritative servers provide information about a domain. Including what IP address associates with that domain and how to handle requests for that domain. These records consist of a series of text files written in what is known as DNS syntax. DNS syntax is a string of characters used as commands that tell the DNS server what to do. All DNS records also have a ‘TTL’, which stands for time-to-live. This indicates how often a DNS server will refresh that record.

Two of the most common DNS records are `CNAME` and `A` record.

#### A :

The `A` stands for "address" and this is the most fundamental type of DNS record: it indicates the IP address of a given domain.

A records only hold IPv4 addresses. If a website has an IPv6 address, it will instead use an "AAAA" record.

Here is an example of an A record:

| example.com | record type | value | TTL |
| --- | --- | --- | --- |
| @ | A | 192.0.2.1 | 3600 |

The "@" symbol in this example indicates that this is a record for the root domain, and the "14400" value is the TTL (time to live), listed in seconds. The default TTL for A records is 14,400 seconds. This means that if an A record gets updated, it takes 240 minutes (14,400 seconds) to take effect.

The vast majority of websites only have one A record, but it is possible to have several. Some higher profile websites will have several different A records as part of a technique called round robin load balancing. Which can distribute request traffic to one of several IP addresses, each hosting identical content.

#### CNAME:

The `canonical name` (CNAME) record is used in lieu of an A record, when a domain or subdomain is an alias of another domain. All CNAME records must point to a domain, never to an IP address. Imagine a game where each level points to another level of game. So final level points to the game boss. A domain with a CNAME record is like a level that can point you to another level (another domain with a CNAME record) or to the boss (a domain with an A record).

For example, suppose blog.example.com has a CNAME record with a value of ‘example.com’ (without the ‘blog’). This means when a DNS server hits the DNS records for blog.example.com, it actually triggers another DNS lookup to example.com. It returns example.com’s IP address via its A record. In this case we would say that example.com is the canonical name (or true name) of blog.example.com.

Sometimes, when sites have subdomains such as blog.example.com or shop.example.com, those subdomains will have CNAME records. Those CNAME point to a root domain (example.com). This way if the IP address of the host changes, only the DNS A record for the root domain needs to be updated. So all the CNAME records will follow along with whatever changes are made to the root.

| green.example.com | record type | value | TTL |
| --- | --- | --- | --- |
|  | CNAME | example.com | 3600 |

### Deployment structure

For test purpose we are going to do blue green deployment using docker containers. Here we will create 3 containers.

1. GUI DNS server application
2. Blue deployment
3. Green Deployment

GUI DNS application will help us to write DNS query. But we can easily use a cmd application which can be automated through docker compose for easier blue-green switching.

![](https://res.cloudinary.com/dlsxyts6o/image/upload/v1666002261/images-from-blog/Untitled_Diagram.drawio_fnp9cp.png)

So the total Blue Green deployment process will be something like this

1. Deploy a version of our application in a container (Blue) using `A` Record
2. Create a `CNAME` record for our application in this case Blue container
3. Deploy the new version of our application in a container (Green) using `A` record
4. Do testing and regression on green deployment
5. Point our `CNAME` record to new `A` (green container) record
6. Destroy the blue container

#### Deploy a version of our application in a container (Blue) using `A` Record

In order to make use of blue-green deployment via DNS we first need to deploy a running version of our software. We can deploy a single container or many and create a DNS Record pointing their IP addresses. This will let us access our service without needing to know the container IP addresses.

#### Create a `CNAME` record for our application in this case Blue container

The next DNS record we need to create is a CNAME. A CNAME is an alias from one hostname to another. This means it can be used for redirects or to provide many names for a single service. We should provision a CNAME that our customers use for accessing our service. So that can we have control of the routing.

 Here is an example of what the initial CNAME and A record might look like:
 
 | CNAME | A |
 | ----- | ---- |
 | app.mohibul.com | blue-app.mohibul.com |


Where `blue-webapp.mohibulsblog.com` is an `A` record of something like

| blue-app.mohibul.com | record type | value | TTL |
| --- | --- | --- | --- |
| @ | A | 192.0.2.1 | 3600 |




#### Deploy the new version of our application in a container (Green) using `A` record

After our system is running and users are using the `CNAME` for accessing our service. we can deploy a new version of the software. It can be deployed right next to our current version. once deployed we should be able to access it via its own A record.

In this phase the green deployment is completed and we can proceed to change the dns records to do blue-green deployment. In this phase we assign the new container's ip an `A` record.

| green-app.mohibul.com | record type | value | TTL |
| --- | --- | --- | --- |
| @ | A | 192.0.2.5 | 3600 |



#### Do testing and regression on green deployment

After deployment we can do integration, functional and regression testing on the application to gain confidence whethere its working properly. If we run test on production data then we need to be very careful. Otherwise if there is dummy data to run those test and see functionaly then its ok to do. 



#### Point our `CNAME` record to new `A` (green container) record

To change and point users to the new  application version. we need to update our CNAME record to point at the new A record. This should be quick but depending on the time to live (TTL) of the DNS record may take some time to propagate. since DNS is cached in multiple places based on the TTL provided.
 
 | CNAME | A |
 | ----- | ---- |
 | app.mohibul.com | green-app.mohibul.com |
 

#### Destroy the blue container

After successful deployment and switching we can safely destroy the previous environment by deleting it or uninstalling any software that is left running. This can happen immediately or after some time but should be done as needed based on specific requirements.




**In my next blog post will show a demo by running these containers and switching