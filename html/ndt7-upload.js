/* jshint esversion: 6, asi: true, worker: true */
// WebWorker that runs the ndt7 upload test
onmessage = function (baseURL) {
  'use strict'

  var testStart;
  var totalSent = 0;
  var updateInterval = 250; //ms
  var nextCallback = updateInterval;
  var testDuration = 10000; //10s
  var dataToSend = new Uint8Array(1048576);  //SEND_BUFFER_SIZE
  var keepSendingData;

  let url = new URL(baseURL.data.href);
  url.protocol = (url.protocol === 'https:') ? 'wss:' : 'ws:';
  url.pathname = '/ndt/v7/upload';

  const sock = new WebSocket(url.toString(), 'net.measurementlab.ndt.v7');

  for (var i = 0; i < dataToSend.length; i += 1) {
    // All the characters must be printable, and the printable range of
    // ASCII is from 32 to 126.  101 is because we need a prime number.
    dataToSend[i] = 32 + (i * 101) % (126 - 32);
  }

  keepSendingData = function () {

    var currentTime = Date.now();

    // Monitor the buffersize as it sends and refill if it gets too low.
    if (sock.bufferedAmount < 8192) {
      sock.send(dataToSend);
      totalSent += dataToSend.length;
    }

    if ((currentTime - 100) > (testStart + nextCallback)) {

      let bytesSent = (totalSent - sock.bufferedAmount);
      let elapsedTime = (currentTime - testStart); //ms

      postMessage({
        'AppInfo': {
          'Bytes': bytesSent,
          'ElapsedTime': elapsedTime
        },
        'Origin': 'client',
        'Test': 'upload',
      });

      nextCallback += updateInterval;
    }

    if (currentTime < testStart + testDuration) {
      setTimeout(keepSendingData, 0);
    } else {
      return;
    }
  };

  sock.onopen = function () {
    testStart = Date.now();
    keepSendingData();
  };

  sock.onmessage = function (response) {
    if (!(response.data instanceof Blob)) {
      let m = JSON.parse(response.data);
      m.Origin = 'server';
      m.Test = 'upload';
      postMessage(m);
    }
  };

  sock.onclose = function () {
    postMessage({
      'Origin': 'close',
      'Test': 'upload',
    });
  };

  sock.onerror = function (response) {
    let m = JSON.parse(response.data);
    m.Origin = 'error';
    m.Test = 'upload';
    postMessage(m);
  };
}
