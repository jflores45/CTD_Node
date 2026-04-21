const fs = require('fs'); // callback style
const fsp = require('fs/promises'); // Promise style
const path = require('path');
const filePath = path.join(__dirname, 'sample-files', 'sample.txt');

// Write a sample file for demonstration
const setup = async () => {
  await fsp.mkdir('sample-files', { recursive: true });
  await fsp.writeFile( filePath, 'Hello, async world!');
};


// 1. Callback style
const runCallback = () => {
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading file (Callback):', err);
      return;
    }
    console.log('Callback read:', data);
  });
};


// Callback hell example (test and leave it in comments):
// fs.readFile('file1.txt', 'utf-8', (err, data1) => {
//   if (err) throw err;
//   fs.readFile('file2.txt', 'utf-8', (err, data2) => {
//     if (err) throw err;
//     fs.readFile('file3.txt', 'utf-8', (err, data3) => {
//       if (err) throw err;
//       console.log(data1, data2, data3);
//     });
//   });
// });

// This is called "callback hell" because the code becomes deeply nested,
// hard to read, and difficult to maintain.


// 2. Promise style
const runPromise = () => {
  fsp.readFile(filePath, 'utf-8')
    .then(data => {
      console.log('Promise read:', data);
    })
    .catch(err => {
      console.error('Error reading file (Promise):', err);
    });
};


// 3. Async/Await style
const runAsyncAwait = async () => {
  try {
    const data = await fsp.readFile(filePath, 'utf-8');
    console.log('Async/Await read:', data);
  } catch (err) {
    console.error('Error reading file (Async/Await):', err);
  }
};


// Run everything in correct order
const main = async () => {
  try {
    await setup();          // create file first
    runCallback();          // callback version
    runPromise();           // promise version
    await runAsyncAwait();  // async/await version
  } catch (err) {
    console.error('Error in main:', err);
  }
};

main();