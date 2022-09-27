🍂 Fall 2022 Update
===============================

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
Right now, the output table doesn't inherit the names of the columns that are selected, but this can be changed in the future.

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

1. Repository reshuffle redux

2. Smaller binaries (10x reduction)

3. `matrix` machine

4. `gui` machine

5. `html` machine

6. Notebook resurrection

📖 Documentation
-----------------

1. New doc structure

2. EKF localization example

3. Machine index files

🏫 Outreach
------------

1. PLDI ARRAY workshop presentation

2. ICRA paper

3. Forward Robotics

a. Summer CHOICES

b. PreLUsion

🤝 Project and Community
-------------------------

1. Summer research group

a. ❤️ Remembering Yuehan Wang

b. Adding more tests

c. Adding more types

2. Capstone Group

🎃 v0.1-beta Release Roadmap
-----------------------------

On September 22, I decided to feature freeze Mech, meaning that any feature that wasn't started by that date will have to be punted to the next release (v0.2-beta), which currently is unscheduled but will probably be ready some time in 2023. This includes features like persistence, autodiff, gpgpu, and others.

The original plan was to have a release ready by October 22, which was a deadline predicated on attending IROS 2022, which I've decided against since the paper was declined, and it would be a lot of travel without having a paper to present. So October 22 isn't a hard deadline anymore, which means it will be the deadline for the first release candidate. I'd like most features to be ready to go by then, but if there are any showstopping bugs or extremely rough edges, we can afford to push things off. So the bottom line is Oct 22 is the v0.1-beta RC1 release, but it might be necessary to release a couple weeks after that if anything prevents a release.

So it's heads down until then, and the next blog update will be at that time.