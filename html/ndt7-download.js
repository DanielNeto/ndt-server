/* jshint esversion: 6, asi: true, worker: true */
// WebWorker that runs the ndt7 download test
onmessage = function (baseURL) {
  'use strict'

  var testStart;
  var receivedBytes = 0;
  var updateInterval = 250; //ms
  var nextCallback = updateInterval;

  let url = new URL(baseURL.data.href);
  url.protocol = (url.protocol === 'https:') ? 'wss:' : 'ws:';
  url.pathname = '/ndt/v7/download';

  const sock = new WebSocket(url.toString(), 'net.measurementlab.ndt.v7');

  sock.onopen = function () {
    testStart = Date.now();
  };

  sock.onmessage = function (response) {

    receivedBytes += (response.data instanceof Blob) ? response.data.size : response.data.length;
    var currentTime = Date.now();

    if (currentTime > (testStart + nextCallback)) {

      let elapsedTime = (currentTime - testStart); //ms

      if (elapsedTime <= 10000) {
        postMessage({
          'AppInfo': {
            'Bytes': receivedBytes,
            'ElapsedTime': elapsedTime
          },
          'Origin': 'client',
          'Test': 'download',
        });

        nextCallback += updateInterval;
      }
    }

    if (!(response.data instanceof Blob)) {
      let m = JSON.parse(response.data);
      m.Origin = 'server';
      m.Test = 'download';
      postMessage(m);
    }
  };

  sock.onclose = function () {
    postMessage({
      'Origin': 'close',
      'Test': 'download',
    });
  };

  sock.onerror = function (response) {
    let m = JSON.parse(response.data);
    m.Origin = 'error';
    m.Test = 'download';
    postMessage(m);
  };
}
