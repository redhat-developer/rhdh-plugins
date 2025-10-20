const concatenate = require("concat-buffers");
const { roundPowerOfTwo } = require("./roundPowerOfTwo.js");

module.exports.trimZeros = function trimZeros(uint8array) {
  // compute "proper" length
  let n = roundPowerOfTwo(uint8array.length);
  if (n === uint8array.length) {
    return uint8array;
  } else if (n === uint8array.length - 1 && uint8array[0] === 0) {
    return uint8array.slice(1);
  } else if (n * 2 === uint8array.length + 1) {
    return concatenate([new Uint8Array([0]), uint8array]);
  } else {
    throw new Error(`uint8array.length = ${uint8array.length} which is wild`);
  }
}
