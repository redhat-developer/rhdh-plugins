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
import url from 'url';

// Import typescript for transpilation
let ts;
try {
  ts = (await import('typescript')).default;
} catch (e) {
  console.error(
    'typescript is required. Install it in the repo:  yarn add -D typescript',
  );
  console.error('Error:', e.message);
  process.exit(1);
}

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const tsPath = args.get('--ts');
const outPath = args.get('--out');
const exportName = args.get('--export'); // optional override

if (!tsPath || !outPath) {
  console.error(
    'Usage: node extract-ts-messages.mjs --ts <path/to/ref.ts> --out <output.json> [--export <exportName>]',
  );
  process.exit(1);
}

const absTsPath = path.resolve(tsPath);

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v)) {
      flatten(v, key, out);
    } else if (typeof v === 'string') {
      out[key] = v;
    } else {
      // ignore non-string leaves
    }
  }
  return out;
}

async function main() {
  // Read and transpile the TypeScript file
  let sourceCode;
  try {
    sourceCode = fs.readFileSync(absTsPath, 'utf8');
  } catch (e) {
    console.error(`Failed to read ${absTsPath}: ${e.message}`);
    process.exit(1);
  }

  // Transpile TypeScript to JavaScript
  let jsCode;
  try {
    const result = ts.transpile(sourceCode, {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      skipLibCheck: true,
    });
    jsCode = result;
  } catch (e) {
    console.error(`Failed to transpile ${absTsPath}: ${e.message}`);
    process.exit(1);
  }

  // Write transpiled JS to a temporary file and import it
  const tempJsPath = absTsPath.replace(/\.ts$/, '.temp.mjs');
  let mod;
  try {
    fs.writeFileSync(tempJsPath, jsCode);
    const modUrl = `${url.pathToFileURL(tempJsPath).href}?t=${Date.now()}`;
    mod = await import(modUrl);
  } catch (e) {
    console.error(`Failed to import transpiled ${absTsPath}: ${e.message}`);
    process.exit(1);
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(tempJsPath)) {
        fs.unlinkSync(tempJsPath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  let messagesCandidate;

  if (exportName) {
    if (!(exportName in mod)) {
      console.error(`Export "${exportName}" not found in ${tsPath}`);
      process.exit(1);
    }
    messagesCandidate = mod[exportName];
  } else {
    // Heuristic: pick the first export whose name ends with "Messages" and is a plain object
    const key = Object.keys(mod).find(
      k => /Messages$/.test(k) && isPlainObject(mod[k]),
    );
    if (key) messagesCandidate = mod[key];
  }

  if (!messagesCandidate || !isPlainObject(messagesCandidate)) {
    console.error(
      `Could not find a "*Messages" plain object export in ${tsPath}. Use --export to specify the name.`,
    );
    process.exit(1);
  }

  const flat = flatten(messagesCandidate);
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(flat, null, 2), 'utf8');
  console.log(`Wrote ${Object.keys(flat).length} keys → ${outPath}`);
}

main();
