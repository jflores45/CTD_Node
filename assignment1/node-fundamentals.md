# Node.js Fundamentals

## What is Node.js?

A runtime enviornment that allows you to run Javascript outside of the browser. Lets users build backend applications like servers, APIs, read and write to files.

## How does Node.js differ from running JavaScript in the browser?

node runs on your computer/server and has access to the file system and system resources. It can build servers and connect to a database. Where as javascript runs in sandbox for security and is used for frontend.

## What is the V8 engine, and how does Node use it?

V8 engine is used to compile Javascript into machine code so it can run fast. Node.js uses V8 engine to execute Javascript outside the browser.

## What are some key use cases for Node.js?

Building web servers and APIs, working with databases, real-time apps, and command-line tools

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**

```js
function add(a, b) {
  return a + b;
}
module.exports = add;

const add = require("./math");
console.log(add(2, 3));
```

**ES Modules (supported in modern Node.js):**

```js
export function add(a, b) {
  return a + b;
}

import { add } from "./math.js";
console.log(add(2, 3));
```
