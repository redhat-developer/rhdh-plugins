const fs = require('fs');
const v8 = require('v8');

exports.createHeapSnapshot = function() {
  const snapshotStream = v8.getHeapSnapshot();
  const fileName = `${Date.now()}.heapsnapshot`;
  const fileStream = fs.createWriteStream('/tmp/' + fileName);
  snapshotStream.pipe(fileStream);
}