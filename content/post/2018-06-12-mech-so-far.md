---
title: Mech So Far
date: 2018-06-12
---

Last week I spent a lot of time describing Mech in aspirational terms. focusing more on what Mech should be, while glossing over the implementation specifics on how to achieve those ambitions.

This week I'll fill in those blanks, and talk more about the Mech's architecture, implementation, and where we are currently in the development process.

## Mech As An Amalgamation

Imagine you wanted to make Mech from off the shelf components. What would it look like? We know the problem lends itself to a loosely couple network of computational units, so we'll start by assuming that architecture. First, we need to define a simple data structure that be be easily transformed and passed as messages. A matrix fits with our robotics application. We also need an IPC mechanism to pass messages across computational boundaries. Finally we need a database to store messages. We could use database triggers to automatically respond to changes in data. Transactions also allow for principled coordination of asynchronous messages. It would look something like this:






Now if we squint, the amorphous list of requirements we laid out in the last post starts to look more like a distributed database tuned for a workload of streaming matrices. You can build a system like this from off the shelf parts, and it will have a lot of nice properties. But it won't fully match the requirements:

- We noted that the system must be real-time, including in some cases hard real time. This means we'll need an RTOS, and off the shelf distributed databases are not usually used in that context.
- RTOSes also tend to be closed source or expensive. Mech aims to be fully open source.
- Mech intended to run on many different kinds of robots, including those powered only by weak processors with limited access to memory. An off the shelf solution will probably contain many layers of dependencies that might not even run on some micro-controller architectures.
- One of the requirements is to handle math on quantities, which is not a common feature.

As it turns out, we can get all that if we throw everything away and start from scratch. Actually, its even better - 

## Mech Designed





### Core

#### Tables


#### Database

#### Runtime



### Core





### Server





### Notebook