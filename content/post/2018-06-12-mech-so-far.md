---
title: Mech So Far
date: 2018-06-12
---

[Last week](https://mechlang.net/post/2018-06-07-hello-world/) I spent the post describing Mech in aspirational terms. Today we'll focus on the form of the project, and the state of the current implementation. 

## Design

The design of Mech draws inspiration from a few different projects. Foremost is Eve, which is a variant of Datalog. I worked on Eve for three years with Chris Granger, Rob Attorri, and Josh Cole, among others. So if you are familiar with Eve, a lot of the concepts behind Mech will seem familiar. Most people haven't used the language, so I'll explain more what that means in another post. But Mech is singular, so it draws inspiration from a number of other languages including MATLAB, Excel, Fortran, Erlang, Lucid, and Smalltalk.

While we refer to Mech primarily as a "language", the project really consists of three parts including:

1. Core -  Mech core is a single threaded incremental dataflow engine. It's light on dependencies (does not rely on an std library or syscalls) and bytes so it can be used in contexts ranging from resource starved embedded microprocessors to powerful servers.
2. Server - a virtual machine that hosts Mech cores. It can send messages to other servers, which can spawn mech cores in response to message contents or performance demands.
3. Notebook - a web-deliverable GUI for Mech. 

Each of these components deserves its own post. 

### Core

#### Tables
#### Database
#### Runtime

### Server

### Notebook

## Implementation