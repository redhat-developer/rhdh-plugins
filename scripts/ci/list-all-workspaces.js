/*
 * Copyright Red Hat, Inc.
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
import fs from 'fs';
import path from 'path';
import { EOL } from 'os';

/**
 * Lists the workspaces that should run in the nightly CI workflow.
 *
 * When the WORKSPACES environment variable is set it is parsed as a JSON
 * string array and used as an explicit allow list. Otherwise every workspace
 * that contains a package.json is returned.
 */
function parseRequestedWorkspaces() {
  const raw = process.env.WORKSPACES?.trim();
  if (!raw) {
    return undefined;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Failed to parse WORKSPACES as JSON: ${error.message}. Expected a JSON string array, e.g. ["global-header","theme"].`,
    );
  }

  if (
    !Array.isArray(parsed) ||
    !parsed.every(item => typeof item === 'string')
  ) {
    throw new Error(
      `WORKSPACES must be a JSON array of strings, e.g. ["global-header","theme"], but received: ${raw}`,
    );
  }

  return parsed;
}

function listAllWorkspaces(workspacesDir) {
  return fs
    .readdirSync(workspacesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name =>
      fs.existsSync(path.join(workspacesDir, name, 'package.json')),
    )
    .sort();
}

function main() {
  if (!process.env.GITHUB_OUTPUT) {
    throw new Error('GITHUB_OUTPUT environment variable not set');
  }

  const workspacesDir = path.resolve('workspaces');
  const allWorkspaces = listAllWorkspaces(workspacesDir);

  const requested = parseRequestedWorkspaces();

  let workspaces;
  if (requested) {
    const unknown = requested.filter(name => !allWorkspaces.includes(name));
    if (unknown.length > 0) {
      throw new Error(
        `The following requested workspaces do not exist: ${unknown.join(
          ', ',
        )}. Available workspaces: ${allWorkspaces.join(', ')}`,
      );
    }
    workspaces = requested;
  } else {
    workspaces = allWorkspaces;
  }

  console.log('workspaces to run:', workspaces);

  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `workspaces=${JSON.stringify(workspaces)}${EOL}`,
  );
}

main();
