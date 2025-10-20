'use strict';

var child_process = require('child_process');
var stream = require('stream');

async function executeShellCommand(options) {
  const {
    command,
    args,
    options: spawnOptions,
    logger,
    logStream = new stream.PassThrough()
  } = options;
  await new Promise((resolve, reject) => {
    const process = child_process.spawn(command, args, spawnOptions);
    process.stdout.on("data", (chunk) => {
      logStream?.write(chunk);
      logger?.info(
        Buffer.isBuffer(chunk) ? chunk.toString("utf8").trim() : chunk.trim()
      );
    });
    process.stderr.on("data", (chunk) => {
      logStream?.write(chunk);
      logger?.error(
        Buffer.isBuffer(chunk) ? chunk.toString("utf8").trim() : chunk.trim()
      );
    });
    process.on("error", (error) => {
      return reject(error);
    });
    process.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(`Command ${command} failed, exit code: ${code}`)
        );
      }
      return resolve();
    });
  });
}

exports.executeShellCommand = executeShellCommand;
//# sourceMappingURL=executeShellCommand.cjs.js.map
