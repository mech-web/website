---
title: Hello World
date: 2018-06-07
---

Welcome to the inaugural post of the Mech language blog, where I will be documenting my work on the language as I go. In this first post, I will just talk a little about what the language is for, and where I'll be taking it in the near future.

## What's Mech?

I'm developing Mech as a domain specific language for a project I'm working on, which has three main components. First, I built a small robot platform with several sensors including a Kinect 2 and a 9-axis AHRS. These sensors stream 3D depth information about the environment, and 9D orientation information about the robot's pose. On-board processing of this data is handled by a standard AMD x86_64 CPU. Next, I have a tablet to which I would like to stream data from the robot. The tablet will display the sensor data, transform and filter it, and send it back to the robot.

The final piece is a server, which will do long-running computations like SLAM or neural net model training. It can communicate with the tablet or the car directly. In summary, the system looks like this:

<img src="/img/post/topology.png" />

Mech is therefore a platform that allows me to work with the system described above with the minimum amount of coding. The platform should handle all the heavy lifting in terms of connecting to devices, shuffling data around, providing transforms and visualizations, and it should all be fast enough for a robotics-focused application.

(At this point many of you may be tempted to make a list of various technologies that when cobbled together could facilitate such a project. I'll detail it in another post, but I've already built an off-the-shelf system that I ultimately found wanting. That's the reason I'm building something from scratch.)

### Requirements

Let's break out the essential properties of the system I described above, so we know the important properties of the language we're about to build.

- **All streams all day** - Data in this system are mostly matrices or vectors. Thus, Mech should be especially well suited to working with matrices and vectors.
- **Distributed** - Computation happens on loosely coupled network of computing resources. The platform should make it easy to distribute computations and data to various locations.
- **Real-time** - both real-time in the sense that we want the most up-to-date view on data, and real-time in the sense that we want guarantees about the responsiveness of the system.
- **Reactive** - reacting to changes in data should be a forte of the language. You shouldn't have to specify how data flows, but what data is flowing. Mech should do the rest in terms of routing and updating streams and computations.
- **Time and space matter** - Sensors stream data about the real world, so time and space matter. Streams coming into Mech will represent a quantity -- that is, a number with a unit. Thus we should be able to combine streams of differing scale and let the language take care of conversion factors. Similarly with time, we should be able to talk about previous and next values in a steam as a way of handling time directly.
- **Visualize Everything** - Since the system is defined in terms of data flows, we want to be able to inspect any data stream at any time. This will make debugging applications built in this way much simpler.

### Architecture

Given the above design requirements, you can see how a system of off-the-shelf components doesn't quite cut it. Sure, you can get most of the way there, and cover a good deal of what I'm after. But that last mile will have you implementing a lot of custom code.