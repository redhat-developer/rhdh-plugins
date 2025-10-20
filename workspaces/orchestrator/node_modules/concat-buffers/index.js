'use strict';

function concatBuffers(arr) {
  if (!Array.isArray(arr)) {
    arr = Array.prototype.slice.call(arguments, 0);
  }

  var len = 0, i = 0;
  for (i = 0; i < arr.length; ++i) {
    len += arr[i].byteLength;
  }

  var u8 = new Uint8Array(len);
  var nextIndex = 0;
  for (i = 0; i < arr.length; ++i) {
    u8.set(arr[i], nextIndex);
    nextIndex += arr[i].byteLength;
  }

  return u8;
}

module.exports = concatBuffers;
