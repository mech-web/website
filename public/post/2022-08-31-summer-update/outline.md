🌞 Summer 2022 Progress Report
===============================

Fall has officially arrived, so it's time for another quarterly update for the Mech language. When we last updated this blog in May, most of the work at the time focused on adding long-awaited features such as units, executables, and performance improvements. The summer was devoted to extending some of these features, as well as filling in a lot of the gaps in the platform. Let's take a look!

🛠️ Platform Improvements
-------------------------

1. User-defined functions

The biggest change to Mech over the Summer was the addition of user-defined functions that can be written in Mech. For a long time, I didn't know if I wanted to include user-defined functions in Mech, because I wanted to see how far I could push the language without them. I still think they are mostly obviated by asynchronous blocks, but at the same time I think their inclusion in the language is important from the perspective of new learners coming from other languages, who may be used to defining programs in terms of function calls. The "weirdness budget" of any language is small, so this is one area I think I need to compromise on to make Mech more approachable.

Functions in Mech differ from blocks in that blocks they are idempotent, meaning that they are functions in the mathematical sense of being a pure mapping from input to output; no side-channels are allowed. For Mech, this means that functions can only operate on their input arguments, and cannot select any global tables in the body of the function. This also means that Mech functions cannot write to global tables. The implication is that the set operators (:=, :+=, etc.) and the append operator (+=) cannot be used in function bodies, as well as temporal operators like whenever (~). It also means that functions cannot read from or write to any machine-related tables, which by definition interact with the outside world and would introduce side effects. However, it's completely fine for Mech functions to call other Mech functions.

A Mech function is defined like this:

[x] = add-two(y<f32>)
  x = y + 2

Inside the brackets is a list of variables, defined in the function body, which are the output of the function. Mech functions can output as many tables as the programmer likes. Next follows the name of the function, as well as an input argument list. The argument name and kind are listed in the argument list, and again there can be as many as the programmer likes. The body of the function must define the output argument at some point, or a compiler error will result. If an input is unused in the body, a compiler warning will alter the programmer.

The function would be called like this:

[x] = add-two(y: 10)

2. Matrix operators

For a long time Mech has aspired to compete with Matlab when it comes to manipulating matricies. We've had broadcast semantics on vectors and tables for a while, but now we've finally gotten bonefide matrix operators in Mech that even go beyond what Matlab has to offer. 

a. matrix multiply

b. transpose

c. swizzling


- error messages - Haocheng
- persistence
- dynamic tables
- table/flatten (-<) implemented finally
- Update operators (:+=)
- title and subtitle updated syntax

🐠 Ecosystem
-------------

- Repository reshuffle redux
- matrix machine
- gui machine
- html machine
- notebook resurrection
- smaller binaries (10x reduction)

📖 Documentation
-----------------

- semantic docs
- new doc structure
- ekf localization example

🏫 Outreach
------------

- Outreach
  - PLDI ARRAY workshop presentation
  - ICRA paper
  - Forward Robotics
    - Summer CHOICES
    - PreLUsion

🤝 Project and Community
-------------------------

- Summer research group
  - Remembering Yuehan Wang
  - Adding more tests
  - Adding more types
- Capstone Group

🎃 v0.1-beta Release Roadmap
-----------------------------
