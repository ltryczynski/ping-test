const ping = require('ping');

const host = process.argv[2] || 'google.com';
const threshold = process.argv[3] || 50;
let DelaySpikesThreshold = process.argv[4] || 100;

let totalRequests = 0;
let belowThreshold = 0;
let aboveThreshold = 0;
let minRequestTime = 999999;
let maxRequestTime = 0;
let timeouts = 0;
let lastRequestTime = 0;
let delaySpikes = 0;

function logIfSlow(pingTime) {
  if (pingTime > threshold) {
    aboveThreshold++;
    console.log(`[${new Date().toLocaleTimeString()}] - Ping: ${pingTime} ms`);
  } else {
    belowThreshold++;
  }
}

async function monitor() {
  while (true) {
    try {
      const res = await ping.promise.probe(host, {
        timeout: 2,
        min_reply: 1,
      });

      totalRequests++;

      const time = res.time;

      if (lastRequestTime !== 0 && (time - lastRequestTime) > DelaySpikesThreshold) {
        delaySpikes++;
      }
      lastRequestTime = time

      if (time < minRequestTime) minRequestTime = time;
      if (time > maxRequestTime) maxRequestTime = time;

      if (!isNaN(time)) {
        const pingTime = parseFloat(time);
        logIfSlow(pingTime);
      } else {
        console.log(`[${new Date().toLocaleTimeString()}] - Ping: timeout`);
        timeouts++;
      }
    } catch (error) {
      console.error('Ping failed:', error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sekunda przerwy
  }
}

function getDurationTime(type = 'ms') {
  return (new Date().getTime() - startDate.getTime()) / (type === 'ms' ? 1 : 1000)
}

function exitHandler() {
  console.log('\n=== Results ===');
  console.log(`Start Time: ${startDate}`)
  console.log(`End Time: ${new Date}`)
  console.log(`Duration: ${getDurationTime('s')} s`)
  console.log(`Requests sent: ${totalRequests}`);
  console.log(`Below threshold (${threshold} ms): ${belowThreshold}`);
  console.log(`Above threshold (${threshold} ms): ${aboveThreshold}`);
  console.log(`DelaySpikes (${DelaySpikesThreshold} ms): ${delaySpikes}`);
  console.log(`Timeouts: ${timeouts}`);
  console.log(`Max request time: ${maxRequestTime}`)
  console.log(`Min request time: ${minRequestTime === 999999 ? "0" : minRequestTime}`)
  process.exit();
}

process.on('SIGINT', exitHandler);   // Ctrl+C
process.on('SIGTERM', exitHandler);  // kill
process.on('exit', () => {
  console.log('Probe ended');
});

let startDate = new Date()
console.log(`Probe started ${startDate}`);
console.log(`Probe host: ${host}`)
console.log(`Probe threshold: ${threshold} ms`)
console.log(`Probe DelaySpike threshold: ${DelaySpikesThreshold} ms`)
console.log(`---- Start ----`)
monitor();