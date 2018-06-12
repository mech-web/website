---
title: Hello World
date: 2018-06-07
---

Welcome to the inaugural post of the Mech language blog, where I will be documenting my work on the language as I go. In this first post, I will just talk a little about what the language is for, and where I'll be taking it in the near future. You can also follow Mech's development on Twitter ([@MechLang](https://twitter.com/MechLang)) or by signing up for the [mailing list](https://mechlang.net/page/community/)

## What's Mech?

I'm developing Mech as a domain specific language for a project I'm working on, the essence of which I hope will map to problems people would like to solve in general. The project I'm working on is a system consisting of the three interconnected components:

First, I have a small [robot car platform](https://vaderlab.wordpress.com/roscar-robot-stock-car-autonomous-racing/) with several sensors, including a Kinect 2 and a 9-axis AHRS. These sensors stream 3D depth information about the environment, and 9D orientation information about the robot's pose. On-board processing of this data is handled by a standard AMD x86_64 CPU. 

Next, I have a tablet to which I would like to stream data from the robot. The tablet will display the sensor data, transform and filter it, and send it back to the robot. The final piece of the system is a server, which will host long-running computations like [SLAM](https://en.wikipedia.org/wiki/Simultaneous_localization_and_mapping) or neural net model training. The server can communicate with the tablet or the car directly. In summary, the system looks like this:

<img src="/img/post/topology.png" />

Mech is therefore a platform that allows me to work with the system described above with the minimum amount of coding. The platform should handle all the heavy lifting in terms of connecting to devices, shuffling data around, providing transforms and visualizations, and it should all be fast enough for a robotics-focused application.

(At this point many of you may be tempted to make a list of various [technologies](http://www.ros.org) or platforms that when cobbled together could facilitate such a project. I'll detail it in another post, but I've already built an off-the-shelf system that I ultimately found wanting. That's the reason I'm building something from scratch.)

### Requirements

Let's break out the essential properties of the system I described above, so we know the important properties of the language we're about to build.

- **All streams all day** - Data in this system are mostly matrices or vectors. Thus, Mech should be especially well suited to working with these data types.
- **Distributed** - Computation happens on loosely coupled network of computing resources. The platform should make it easy to distribute computations and data to various locations. Work is done asynchronously, at different times, at different locations, but that shouldn't stop other work from progressing if it can.
- **Real-time** - both real-time in the sense that we want the most up-to-date view on data, and real-time in the sense that we want guarantees about the responsiveness of the system when we can. Mech will operate on systems like robot cars where latency does matter.
- **Reactive** - reacting to changes in data should be a forte of the language. You shouldn't have to specify how data flows, but only what data is flowing. Mech should do everything for you in terms of routing and updating streams and computations.
- **Time and space matter** - Streams of real-world data represent the physical world, so time and space matter. Streams coming into Mech can represent a quantity -- a value plus a unit. Mech should handle conversions between quantities of different scales (e.g. feet to meters). Similarly with time, Mech should handle time explicitly, allowing you to talk about the `previous` or `next` values in a stream.
- **Visualize Everything** - In a system defined by data flows, bugs are going to exist where streams are incorrectly routed or transformed. Tools capable of visualizing and inspecting streams at any point in time will make debugging this kind of program easier.

Alright, that's a good start: now we have a system we want to work with, and a list of things essential to working with that system. Now we need to think about what kinds of things I'd like to do with this system. We'll do this by expressing some things we hope Mech will make trivial and impossible. The things Mech makes trivial should be things we do often in the language, making it the right tool for the job by design. The things Mech makes impossible should be pitfalls commonly faced for this task, making the solutions you produce with Mech robust and tolerant to failure.






## Mech makes it trivial to..

- Transform data from one shape into another. MATLAB is the gold standard here, where everything in the language is represented as a matrix that can be sliced, diced, split, and inverted any way possible.
- I should be able to visualize anything in a number of ways. I should be a
- share
- visualize
- record
- compose

## Mech makes it impossible impossible to..

- crash
- deadlock
- get stuck