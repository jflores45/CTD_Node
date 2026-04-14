const os = require('os');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log('Platform:', os.platform());
console.log('CPU:', os.cpus()[0].model);
console.log('Total Memory:', os.totalmem());

// Path module
const joinedPath = path.join('/path/to', 'sample-files', 'folder', 'file.txt');
console.log('Joined path:', joinedPath);


// Async work
const main = async () => {
  try {
    // fs.promises write + read
    const demoPath = path.join(sampleFilesDir, 'demo.txt');
    await fsp.writeFile(demoPath, 'Hello from fs.promises!');
    const data = await fsp.readFile(demoPath, 'utf-8');
    console.log('fs.promises read:', data);

    // Create largefile.txt
    const largeFilePath = path.join(sampleFilesDir, 'largefile.txt');
    let content = '';
    for (let i = 0; i < 100; i++) {
      content += 'This is a line in a large file...\n';
    }
    await fsp.writeFile(largeFilePath, content);

    // Read with stream
    const stream = fs.createReadStream(largeFilePath, { highWaterMark: 1024 });

    stream.on('data', (chunk) => {
      const text = chunk.toString();
      console.log('Read chunk:', text.slice(0, 40));
    });

    stream.on('end', () => {
      console.log('Finished reading large file with streams.');
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
    });

  } catch (err) {
    console.error('Error:', err);
  }
};

main();