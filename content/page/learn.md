---
title: Learn
menu: main
comments: false
weight: 2
layout: page
---

## An Example

```rust
// In Cargo.toml, include Mech as a dependency:
// mech = {git = "https://gitlab.com/mech-lang/core.git"}
extern crate mech;
use mech::{Core, Transaction, Block, Value};

// Create a new mech core
let mut core = Core::new(change_capacity, table_capacity);

// Create a new table, and add two values to it
let txn = Transaction::from_text("#add += [5 3]");

// Apply the transaction
core.process_transaction(&txn);

// #add:
// ┌───┬───┬───┐
// │ 5 │ 3 │   │
// └───┴───┴───┘

// Create a block that adds two numbers.
let mut block = Block::new("#add[3] = #add[1] + #add[2]");

// Register the block with the core
core.register_block(block);

// #add:
// ┌───┬───┬───┐
// │ 5 │ 3 │ 8 │
// └───┴───┴───┘

// Check that the numbers were added together
assert_eq!(core.get_cell("add", 1, 3), Some(Value::from_u64(8)));

// We can add another row to the #add table
let txn2 = Transaction::from_text("#add += [3 4]");
core.process_transaction(&txn2);

// #add:
// ┌───┬───┬───┐
// │ 5 │ 3 │ 8 │
// │ 3 │ 4 │ 7 │
// └───┴───┴───┘

// Notice the second row was automatically added
assert_eq!(core.get_cell("add", 2, 3), Some(Value::from_u64(7)));
```