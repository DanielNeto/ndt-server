/* jshint esversion: 6, asi: true */
// ndt7core is a simple ndt7 client API.
const ndt7core = (function () {
  return {
    // run runs the specified test with the specified base URL and calls
    // callback to notify the caller of ndt7 events.
    run: function (servidor, testName, callback) {

      callback('starting', { Origin: 'client', Test: testName })

      let done = false
      let worker = new Worker('ndt7-' + testName + '.js')

      function finish() {
        if (!done) {
          done = true
          if (callback !== undefined) {
            callback('complete', { Origin: 'client', Test: testName });
          }
        }
      }

      worker.onmessage = function (msg) {
        if (msg.data.Origin !== undefined && msg.data.Origin === 'close') {
          finish();
          return;
        }
        if (msg.data.Origin !== undefined && msg.data.Origin === 'error') {
          console.log(msg.data);
          finish();
          return;
        }
        callback('measurement', msg.data);
      }
      // Kill the worker after the timeout. This force the browser to
      // close the WebSockets and prevent too-long tests.
      setTimeout(function () { worker.terminate(); finish(); }, 15000);

      var baseURL = "https://".concat(servidor, ":4443");

      worker.postMessage({ href: baseURL, })
    }
  }
}())