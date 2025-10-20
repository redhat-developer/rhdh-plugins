module.exports.roundPowerOfTwo = function roundPowerOfTwo(number) {
  if (number < 0) throw new Error("Negative numbers should not be passed to roundPowerOfTwo");
  return 2 ** (31 - Math.clz32(number));
}
