/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable no-console */

const { dirname } = require('node:path');
const {
  cp,
  symlink,
  stat,
  lstat,
  rm,
  mkdir,
  constants,
} = require('node:fs/promises');
const { spawn } = require('node:child_process');

const errors = {
  ENOENT: 2, // No such file or directory
  EINVAL: 22, // Invalid argument
};

function locatePkg(pkgName) {
  return dirname(require.resolve(`${pkgName}/package.json`));
}

async function validateSourceAndDestination(source, destination) {
  try {
    await stat(source);
  } catch (e) {
    console.error(`${e.message}\nDid you forget to build the project?`);
    process.exit(errors[e.code]);
  }

  try {
    await stat(destination);
  } catch (e) {
    console.error(e.message);
    process.exit(errors[e.code]);
  }
}

function runWebpackAsync() {
  let localResolve;
  let localReject;
  const promise = new Promise((resolve, reject) => {
    localResolve = resolve;
    localReject = reject;
  });

  const child = spawn('yarn webpack', ['--progress'], {
    shell: true,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: process.env,
  });

  child.once('error', localReject);
  child.once('close', localResolve);

  return promise;
}

async function main([op]) {
  if (/true|TRUE|1/.test(process.env?.CI)) {
    const msg = [
      '\nSkipping build script, CI-env detected.',
      'If a new build of the SWF envelope is necessary:',
      '1. Build this project offline',
      '2. Commit all the changes inside the /static/generated/envelope directory of the @red-hat-developer-hub/backstage-plugin-orchestrator-backend package',
    ].join('\n');
    console.warn(msg);
    return;
  }

  await runWebpackAsync();

  const source = `${dirname(__dirname)}/dist`;
  const destination = `${locatePkg(
    '@red-hat-developer-hub/backstage-plugin-orchestrator-backend',
  )}/static/generated`;
  await validateSourceAndDestination(source, destination);

  switch (op) {
    case 'clean': {
      await rm(`${destination}/envelope`, { recursive: true, force: true });
      break;
    }
    case 'copy': {
      console.log(
        `Copying Editor Envelope files: ${source} -> ${destination}/envelope`,
      );

      let dirExists = false;
      try {
        const stats = await stat(`${destination}/envelope`, constants.S_IFDIR);
        dirExists = stats.isDirectory();
      } catch (error) {
        // skip...
      }

      if (!dirExists) {
        await mkdir(`${destination}/envelope`);
      }

      await cp(source, `${destination}/envelope`, {
        recursive: true,
        force: true,
      });
      break;
    }
    case 'debug': {
      const msg = [`source=${source}`, `destination=${destination}`]
        .join('\n')
        .trimEnd();
      console.log(msg);
      break;
    }
    case 'link': {
      /**
       * This option exists for testing/dev purposes because it saves some space.
       * In the orchestrator-backend production artifact the files are copied into its static directory.
       */

      let existsAndIsSymLink = false;
      try {
        const stats = await lstat(`${destination}/envelope`);
        existsAndIsSymLink = stats.isSymbolicLink();
      } catch {
        // skip...
      }

      if (existsAndIsSymLink) {
        await rm(`${destination}/envelope`);
      }

      console.log(
        `Linking Editor Envelope files: ${destination}/envelope -> ${source}`,
      );
      await symlink(source, `${destination}/envelope`);
      break;
    }
    default:
    // just build it
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}
