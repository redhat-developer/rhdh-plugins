/**
 * Patches @openai/agents-core to be compatible with zod 3.25.x
 *
 * The SDK's dist uses .superRefine() on ComputerUseCallItem which converts
 * ZodObject -> ZodEffects. Zod 3.25's discriminatedUnion requires ZodObject
 * with a .shape property, causing a crash at startup.
 *
 * This removes the non-essential validation refinement to restore compatibility.
 */
const fs = require('fs');
const path = require('path');

const protocolPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@openai',
  'agents-core',
  'dist',
  'types',
  'protocol.js',
);

if (!fs.existsSync(protocolPath)) {
  process.exit(0);
}

let code = fs.readFileSync(protocolPath, 'utf8');

const marker = '.superRefine((value, ctx)';
const idx = code.indexOf(marker);
if (idx === -1) {
  process.exit(0);
}

let braceCount = 0;
let i = idx;
let foundOpen = false;
while (i < code.length) {
  if (code[i] === '{') {
    braceCount++;
    foundOpen = true;
  } else if (code[i] === '}') {
    braceCount--;
    if (foundOpen && braceCount === 0) {
      let end = i + 1;
      if (code[end] === ')') end++;
      if (code[end] === ';') end++;
      code = code.substring(0, idx) + code.substring(end);
      break;
    }
  }
  i++;
}

fs.writeFileSync(protocolPath, code);
