---
title: Hello World
date: 2018-06-07
---

Welcome to the inaugural post of the Mech language blog, where I will be documenting my work on the language as I go. In this first post, I will just talk a little about what the language is for, and where I'll be taking it in the near future.

## What's Mech?

Instead of describing the various properties and feature of Mech, I'll introduce Mech by way of a motivating application for which Mech would be a good fit.

I'm developing Mech as a domain specific language for a project I'm working on, which has three main components. First, I built a small robot platform with several sensors including a Kinect 2 and a 9-axis AHRS. On-board processing of this sensor data is accomplished by a standard AMD x86_64 CPU. So that's the first part, a source of streaming sensor data. Next, I have a tablet. I would like to stream data from the robot to that tablet. The tablet will display the sensor data, transform it in some ways, and send the transforms back to the robot.

Finally, there is a server, which will do long-running computations like SLAM or neural net model training. It can communicate with the tablet or the car directly. So I have a system that looks like this:



So what I want is a platform that allows me to work with the system described above with the minimum amount of coding. The platform should handle all the heavy lifting in terms of connecting to devices, shuffling data around, providing transforms and visualizations, and it should all be performant enough for a robotics-focused application.

(At this point many of you may be tempted to pause an list various technologies that may be cobbled together to facilitate such a project. I'll detail it in another post, but I've already built such a system, but moved on to building a custom solution due to my dissatisfaction the current offerings.)

### Requirements

Anyway, if we want a platform that makes distributed streaming sensor processing systems easy, we'll need to suss out some of the essential properties of this system in order to build something we can leverage.

- **All streams all day** - Data in this system are mostly matrices or vectors. Thus, Mech should be especially well suited to working with matrices and vectors.
- **Distributed** - Computation happens on loosely coupled network of computing resources. The platform should make it easy to distribute computations and data to various locations.
- **Real-time** - both real-time in the sense that we want the most up-to-date view on data, and real-time in the sense that we want guarantees about the responsiveness of the system.
- **Reactive** - reacting to changes in data should be a forte of the language. You shouldn't have to specify how data flows, but what data is flowing. Mech should do the rest in terms of routing and updating streams and computations.
- **Time and space matter** - Sensors stream data about the real world, so time and space matter. Streams coming into Mech will represent a quantity -- that is, a number with a unit. Thus we should be able to combine streams of differing scale and let the language take care of conversion factors. Similarly with time, we should be able to talk about previous and next values in a steam as a way of handling time directly.
- **Visualize Everything** -
- **Small and versatile** - 

### Architecture

Given the above design requirements, you can see how a system of off-the-shelf components doesn't quite cut it. Sure, you can get most of the way there, and cover a good deal of what I'm after. But that last mile will have you implementing a lot of custom code.


## Demand Driven Development
