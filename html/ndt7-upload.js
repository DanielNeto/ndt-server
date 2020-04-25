/* jshint esversion: 6, asi: true, worker: true */
// WebWorker that runs the ndt7 upload test
onmessage = function (baseURL) {
  'use strict'

  // MaxMessageSize is the minimum value of the maximum message size
  // that an implementation MAY want to configure. Messages smaller than this
  // threshold MUST always be accepted by an implementation.
  const MaxMessageSize = 1 << 24;

  // ScalingFraction sets the threshold for scaling binary messages. When
  // the current binary message size is <= than 1/scalingFactor of the
  // amount of bytes sent so far, we scale the message. This is documented
  // in the appendix of the ndt7 specification.
  const ScalingFraction = 16;

  const InitialMessageSize = 1 << 13;

  var testStart;
  var totalSent = 0;
  var updateInterval = 250; //ms
  var nextCallback = updateInterval;
  var testDuration = 10000; //10s

  var baseData = new Uint8Array(MaxMessageSize);  //SEND_BUFFER_SIZE 64KB
  var keepSendingData;

  let url = new URL(baseURL.data.href);
  url.protocol = (url.protocol === 'https:') ? 'wss:' : 'ws:';
  url.pathname = '/ndt/v7/upload';

  const sock = new WebSocket(url.toString(), 'net.measurementlab.ndt.v7');

  for (var i = 0; i < baseData.length; i += 1) {
    // All the characters must be printable, and the printable range of
    // ASCII is from 32 to 126.  101 is because we need a prime number.
    baseData[i] = 32 + (i * 101) % (126 - 32);
  }

  var dataToSend = baseData.slice(0, InitialMessageSize);

  keepSendingData = function () {

    // The following block of code implements the scaling of message size
    // as recommended in the spec's appendix. We're not accounting for the
    // size of JSON messages because that is small compared to the bulk
    // message size. The net effect is slightly slowing down the scaling,
    // but this is currently fine. We need to gather data from large
    // scale deployments of this algorithm anyway, so there's no point
    // in engaging in fine grained calibration before knowing.
    if (dataToSend.length < MaxMessageSize && dataToSend.length < totalSent / ScalingFraction) {
      let sizeBefore = dataToSend.length;
      dataToSend = baseData.slice(0, sizeBefore * 2);
    }

    const underbuffered = 7 * dataToSend.length;
    while (sock.bufferedAmount < underbuffered) {
      sock.send(dataToSend);
      totalSent += dataToSend.length;
    }

    var currentTime = Date.now();

    if (currentTime > (testStart + nextCallback)) {

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
