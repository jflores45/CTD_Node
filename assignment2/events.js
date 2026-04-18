const EventEmitter = require('events');
const emitter = new EventEmitter();

emitter.on('time', (time) => {
    console.log(`Time received: ${time}`);
});

if (require.main === module) {
  setInterval(() => {
    emitter.emit("time", new Date().toString());
  }, 5000);
}
module.exports = emitter;