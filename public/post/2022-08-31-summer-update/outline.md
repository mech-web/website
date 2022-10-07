🍂 Fall 2022 Update
====================

Fall has officially arrived, so it's time for another quarterly update for the Mech language. When we last updated this blog in May, most of the work at the time focused on adding long-awaited features such as units, executables, and performance improvements. The summer was devoted to extending some of these features, as well as filling in a lot of the gaps in the platform. Let's take a look!

🛠️ Platform Improvements
-------------------------

1. User-defined functions

The biggest change to Mech over the Summer was the addition of user-defined functions that can be written in Mech. For a long time, I didn't know if I wanted to include user-defined functions in Mech, because I wanted to see how far I could push the language without them. I still think they are mostly obviated by asynchronous blocks, but at the same time I think their inclusion in the language is important from the perspective of new learners coming from other languages, who may be used to defining programs in terms of function calls. The "weirdness budget" of any language is small, so this is one area I think I need to compromise on to make Mech more approachable.

Functions in Mech differ from blocks in that blocks they are idempotent, meaning that they are functions in the mathematical sense of being a pure mapping from input to output; no side-channels are allowed. For Mech, this means that functions can only operate on their input arguments, and cannot select any global tables in the body of the function. This also means that Mech functions cannot write to global tables. The implication is that the set operators (:=, :+=, etc.) and the append operator (+=) cannot be used in function bodies, as well as temporal operators like whenever (~). It also means that functions cannot read from or write to any machine-related tables, which by definition interact with the outside world and would introduce side effects. However, it's completely fine for Mech functions to call other Mech functions.

A Mech function is defined like this:
```
[x] = add-two(y<f32>)
  x = y + 2
```
Inside the brackets is a list of variables, defined in the function body, which are the output of the function. Mech functions can output as many tables as the programmer likes. For instance:

```
[x,z] = add-mul-two(y<f32>)
  x = y + 2
  z = y * 2
```

After the output list follows the name of the function, an then an input argument list. The argument name and kind are listed in the argument list, and again there can be as many as the programmer likes. The body of the function must define the output argument at some point, or a compiler error will result. If an input is unused in the body, a compiler warning will alter the programmer.

The function would be called like this:
```
[x] = add-two(y: 10)
```
Dynamic dispatch is a major feature of Mech, and we want to be able to support this feature with user defined functions. To do this, we can allow function definition overloading, which will allow the user to define multiple functions with the same name and different parameters. For example, the `add-two()` function for `u64` kind could be defined like this:
```
[x] = add-two(y<u64>)
  x = y + 2
```
And now we have a function that will be able to call `add-two()` with `u64` and `f32` types. Now, this will mean that there will have to be a lot of duplication to support every numeric type. Perhaps in the future we will add a feature like "typeclasses", which would allow a user to define one function for all supported numeric types. But for now, this is what we have to do.

2. Matrix operators

For a long time Mech has aspired to compete with Matlab when it comes to manipulating matricies. We've had broadcast semantics on vectors and tables for a while, but now we've finally gotten bonefide matrix operators in Mech that even go beyond what Matlab has to offer. 

a. Matrix multiply

First and foremost, we've implemented matrix multiplaction as a built-in operator `**`. For instance, we can multiply two matricies together like this with the following result:

```
#x = [1 2; 3 4] ** [5 6; 7 8]
╭──────────────────────────────╮
│#x (2 x 2)                    │
├───────────────┼──────────────┤
│F32            │F32           │
├───────────────┼──────────────┤
│19f32          │22f32         │
│43f32          │50f32         │
╰───────────────┴──────────────╯
```

The will work for any matrix that follow the rule that the left hand side rows must equal the right hand side columns. Any other combination will yield an error and the operation will fail. So far, this works only for matricies that are entirely of kind f32; compound-kind tables and tables of other numeric kinds haven't been implemented yet.

The reason we've opted for a unique operator `**` instead of the Matlab style single `*` is that in Mech, the single `*` is already a broadcast operator, whereas Matlab uses `.*` to broadcast the multiply operator. 

b. Transpose

Transposing tables is done with the apostraphe operator appended to any expression, like so:

```
#x = [1 2 3]'
╭──────────────────────────────╮
│#x (3 x 1)                    │
├──────────────────────────────┤
│F32                           │
├──────────────────────────────┤
│1f32                          │
│2f32                          │
│3f32                          │
╰──────────────────────────────╯
```
Users of Matlab will be familiar with this operator and its useage. For now, it only works when the entire table is of a uniform kind. A downside rightnow is that after evaluating a transpose, the names of columns are lost. I'm not sure what we'll dow with this in the future, but named rows has been on the agenda for a while, and it might be time to implement those.

c. Swizzling

As a Matlab user myself, swizzling is a term I was was familiar with until recently, because it's not a feature of that language. It's a term coming from the computer graphics world, which Wikipedia defines as "ability to compose vectors by arbitrarily rearranging and combining components of other vectors." With typed columns in Mech, swizzling is a feature that can help programmers write very terse code with used in conjunction with broadcast and matrix operators. Here's an example of swizzling working in Mech:

```
x = [a: 1, b: 2, c: 3, d: 4]
#y = x.a,c,c
╭──────────────────────────────╮
│#y (1 x 3)                    │
├──────────┼─────────┼─────────┤
│F32       │F32      │F32      │
├──────────┼─────────┼─────────┤
│1f32      │3f32     │3f32     │
╰──────────┴─────────┴─────────╯
```

3. Parser error messages

My student Haocheng Gao has done significant work toward making error messages more readable in Mech. In the last update, we added error indications for semantic compiletime errors, which was much needed but still not enough to help the newest users, who will encounter syntax errors frequently.

Haocheng has retrofitted the parser to allow us to generate detailed parser errors with information as to what the error is, where in the source file it occurred, and perhaps also hints on how to fix it. Here's an example of what error messages look like so far:


To generate these messages, Haocheng retrofitted the parser with a series of tags that annotate the various paerser combinators and help with generating relevent and informative packets of information which are later rendered as messages in whatever context the program is running (editor, console, browser, etc.)

4. Dynamic tables

In many programs, we can statically analyze the shapes of tables and figure out the size of all dependent tables at compile time. Other times, the shape of the table is based on some variable which might change. For example, the table append operator will `+=` dynamically grow a table during runtime; or when filtering a table using logical indexing, the resulting table's size will depend on how many rows in the logical index variable are true.

5. table/flatten operator (-<)

The table split operator (>-) has been implemented for a while. This turns a vector into a vector of fectors, which is useful in combination with table interpolation. For example, we can split a column of numbers as follows: 

```
  x = [1; 2; 3; 4]
  y >- x
  div = [kind: "div" contents: y]
```

The result is that `y = [[1];[2];[3]]`, and div will be:

```
[|kind contents|
  "div" [1]
  "div" [2]
  "div" [3]]
```
That has been possible for a while, but now what's possible with the flatten operator (-<) is to take the split vector and to flatten it back into its original form. For example:

```
x -< div.contents
```
This evaluated to `x = [1; 2; 3; 4]`, which was the original vector.

6. Update operators (:+=)

I've added a collection of update operators which aim to simplify both the syntax as well as the compiled block code. These operators perform a mathematical operation on a table and update it in place, without the need to create an intermediate table. This will save both space and time, as well as lines of code. The operators are `:+=`, `:-=`, `:*=`, `:/=`, `:^=`, and `:**=`, which correspond to the respective mathematical operator in the middle of each corresponding operator. For example:

```
x := x + 5  -- old 
x :+= 5     -- new
```
These new operators have the potential to yield great savings in syntax. Consider the pose update code from the bouncing balls demo:

```
#balls.x := #balls.x + #balls.vx * #dt
#balls.y := #balls.y + #balls.vy * #dt
```
This can be condensed into a single line of code with the update operator and table swizzling:

```
#balls.x,y :+= #balls.vx,vy * #dt
```

7. Title and subtitle syntax deprecated and replaced

I've always been a little uneasy about the header and subheader syntax using hashtags, which conforms to Markdown but potentially clashes with the global table select operator. To remove this potential point of confusion, I've switched to using the alternative Markdown header, which uses an underline of = or - to indicate a header and subheader respectively. The source for this document uses the new syntax. You can also see it in action in some of the examples.

🐠 Ecosystem
-------------

1. Smaller binaries (10x reduction)

I've managed to cut down on the size of machine binaries by about an order of magnitude (from 8mb down to 800kb), which is a great savings. This was accomplished in two ways. First, I cut out a lot of redundant code that's not being used in the dependent repositories. Machines usually depend on `core` and `utilities`. Core depends on rayon and brings in the entire standard machine, which typically go unused in machine implementations. These are now both behind feature flags in core. Likewise, utilities has a definition for a type that uses a websocket, which itself depends on tokio. Bringing all of tokio in for a machine took up a lot of space, so now that is behind a feature flag as well. Eschewing this unused code saves most of the space in binaries.

Second, after the binary is compiled, I use the upx executable packer to make the machine even smaller (nominally a 50% savings over the regularly compiled file).

I'm sure there should be a way to get even greater savings, as a lot of the code that is included in these binaries is available in the Mech executable anyway. One thing to look at in the future is excising this code from the compiled machine, and linking to it in the Mech executable. Unfortunately, that's a long term task, but in the meantime a 10x reduction is satisfactory.

2. `matrix` machine

The `matrix` machine is brand new and will include a variety of linear algebra related functions. By default, matrix/multiply and matrix/transpose are included in the standard machine, and exposed to the programmer through builtin operators. The rest of the machine will wrap a number of functions from the rust nl algebra crate so that they will work through Mech.

3. `gui` machine

The `gui` machine includes a number of tables that help with drawing native interface elements. It leverages the Rust egui framework for most of this work, with custom wrappers to make the elements reactive. The `gui` machine has so far existed inside of notebook2 (now just notebook), but now I've moved most of the code out of there and into this machine. This means that the the remaining notebook code is now mostly implemented in just Mech.

4. `html` machine

Like `gui`, the `html` machine has existed inside of the wasm repository. It helps with drawing to canvas and rendering HTML elements. Now all that code has been moved into its own machine, which is a dependency of wasm. I think this organizes things a little better, and wasm will slowly be converted into mostly Mech code.

5. Notebook resurrection

The old notebook repository is back from being an archived repository. Now it hosts the contents of notebook2, and notebook has been renamed to wasm-notebook. The main difference between these two offerings is that notebook (again formerly notebook2) makes use of the egui rust GUI framework, whereas wasm-notebook (formerly notebook) makes use of the rust websys framework.

6. Repository reshuffle redux

In the Spring I made the various repositories of the Mech project into git submodules of the main Mech repo. Now I've move a bunch of those git submodules into the src directory, and I've renamed some of the folders. It should make the repo a little cleaner and easier to work with for developers working on the runtime.

📖 Documentation
-----------------

1. New doc structure

The documentation will have a new structure, and will be oganized into the following categories: 

- getting started - welcome, install, running, quickstart, help
- reference - core langauge, writing programs, design documents
- machines - standard machine references
- guides - mech-for-x, tutorials, how tos

I don't have much to say about these yet, as I've mostly just updated the formatting and outlined the sections. This is where most of the work still needs to be done before the beta can be released.

2. EKF localization example

One piece of feedback from the IROS submission was that the reviewers didn't find the example bouncing ball simulation illustrative enough due to its simplicity. They said they couldn't get a good idea of the extent of Mech's capabilities without a more representative example program. To fix this in the ICRA paper, I implemented a simulation of an Extended Kalman Filter localization algorithm in Mech, which you can find in the examples repository [here](https://gitlab.com/mech-lang/examples/-/blob/v0.1-beta/src/ekf.mec). This was made possible by the addition of builtin matrix operators.

A couple things are neat about this. First, it demonstrates unicode support by way of greek symbols as variable names. Second, at roughly 20 lines of code, the length of the algorithm in Mech is just about as long as the algorithm as expressed in mathematical notation. Third, implementing this algorithm was dead simple. It was a near 1:1 translation from the source algorithm, and it worked like a charm.

Finally, the biggest thing I learned from this example is that Mech is *way* faster than Matlab. I have an implementation of the EKF localization algorithm in Matlab, so a direct comparison was possible. Here are the results:

Notice that the Y-axis is a log scale, meaning that Mech is over 500x faster than Matlab for this task.

3. Machine index files

Each machine now includes an index file (written in Mech) that explains the purpose and contents of the machine. It will act as a table of contents for the machine, as well as the first page of documentation. A sample abriged index looks like this:

```
math
=====

1. Description
---------------

Provides standard mathematical functions.

2. Provided Functions
----------------------

- math/sin(angle<f32>)
- math/sin(angle<degrees>)

3. Info
--------

#math/machine = [
  name: "math" 
  version: "v0.0.1"
  authors: "Corey Montella" 
  machine-url: "https://gitlab.com/mech-lang/machines/math"
  license: "Apache-2.0"]
```
You can find the full index [here](https://github.com/mech-machines/math/blob/main/index.mec)

4. Syntax highlighting

🏫 Outreach
------------

1. PLDI ARRAY workshop presentation

On June 13, I presented Mech at the PLDI ARRAY Workshop in San Diego, California, USA. The presentation I gave was a modification of the 10 minute talk I did for HYTRADBOI, but I had over twice as long to speak so I was able to get a little more in depth, and I was able to give a live demo of some of the features. 

There's no recording of the talk available, but if you're interested in what was said you can take a look at the afforementioned HyTRADBOI talk for a good idea. 

2. ICRA paper

The main actionable feedback from the rejected IROS paper was that it needed more examples to give a better sense of how Mech would be applicable for a real-life robotics system. I updated the paper with the EKF demo and some notes from the CHOICES experience, and I submitted it to ICRA 2023, which is a larger conference but more selective than IROS. I hope to be accepted there, and if so I will present a live demonstration at the conference at the end of May. Fingers crossed! Here's a copy of the preprint.

3. Forward Robotics

If you're not aware yet, Forward Robotics is the outreach component of the Mech project which aims to educate kids about robotics. 

a. Summer CHOICES

Forward Robotics was involved in several outreach programs over the summer which helped test Mech for one of its intended audiences: students brand new to programming. 

In the Spring we participated in the CHOICES program that teaches middle school girls about various STEM topics including robotics. This Summer we repeated the program with more students, with as many as 60 students. This was the largest offering of the FR program to date.

b. PreLUsion

Lehigh offers the PreLUsion program to incoming freshman before the semester starts. It provides first year students with a variety of activities that help them bond and get excited about learning in a university setting. Forward Robotics participated in the Lehigh Women Engineers version of the program which is restricted to female students interested in Engineering. We ran mostly the same experience as the CHOICES program, and it turned out to be fun even for older girls. Several students expressed interest in Mech and Forward Robotics after doing the activity, so hopefully they will join the project soon enough!

🤝 Project and Community
-------------------------

1. CSE Capstone Group

All CSE students at Lehigh have to take a Senior Capstone course to graduate, and each year I usually have a capstone group working on Mech.

2. Summer research group

Over the summer I maintained an informal research group that met weekly to work on Mech. Here's what we managed to get up to over the summer:

a. Increased test coverage

Most Mech tests of the core language syntax and semantics are covered in the syntax repository. While that's still the case (with almost 200 tests now), over the summer we've slowly started testing more Mech code using the Mech testing framework. The first thing we're doing is covering the basic operators to make sure they work on different data types and different shapes.

b. Adding support for more kinds

The second objective over the summer was to create a matrix of arguments and operators, and to document which work and are tested, which work but are not tested, and which don't work at all. My student DJ Edwards is doing an independent study with me this semester to help make sure that everything is working and tested before we launch the beta.

c. ❤️ Remembering Yuehan Wang

Tragedy struck at the end of Summer when Yuehan Wang (also known as John) passed away. Yuehan  worked on Mech with us over the summer, and was indispensible in contributing to the progress we made. Yuehan was a 4th year undergraduate studying Physics and CS, and was very close to completing his degrees before his sudden death. We're all very saddened by his loss, and wish his family and friends our deepest condolences.

🎃 v0.1-beta Release Roadmap
-----------------------------

On September 22, I decided to feature freeze Mech, meaning that any feature that wasn't started by that date will have to be punted to the next release (v0.2-beta), which currently is unscheduled but will probably be ready some time in 2023. This includes features like persistence, autodiff, gpgpu, and others.

The original plan was to have a release ready by October 22, which was a deadline predicated on attending IROS 2022, which I've decided against since the paper was declined, and it would be a lot of travel without having a paper to present. So October 22 isn't a hard deadline anymore, which means it will be the deadline for the first release candidate. I'd like most features to be ready to go by then, but if there are any showstopping bugs or extremely rough edges, we can afford to push things off. So the bottom line is Oct 22 is the v0.1-beta RC1 release, but it might be necessary to release a couple weeks after that if anything prevents a release.

So it's heads down until then, and the next blog update will be at that time.