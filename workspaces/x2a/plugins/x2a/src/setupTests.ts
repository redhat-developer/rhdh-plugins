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
/* eslint-disable no-console */
import '@testing-library/jest-dom';

// Suppress noisy errors/warnings from underlying libraries that don't affect tests.
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const suppressPatterns = [
  'Could not parse CSS stylesheet', // JSDOM doesn't support modern CSS (@layer, var())
  'Support for defaultProps will be removed', // @material-table/core deprecation
  'React Router Future Flag Warning', // react-router v7 migration notices
  'findDOMNode is deprecated', // @material-ui/core
  'validateDOMNesting', // React DOM nesting (e.g. div inside p from Typography)
  'Not implemented: HTMLCanvasElement.prototype.getContext', // JSDOM canvas
];
const getMatchedPattern = (args: unknown[]): string | null => {
  const first = args[0];
  const msg =
    typeof first === 'object' &&
    first !== null &&
    'message' in first &&
    typeof (first as { message?: string }).message === 'string'
      ? (first as { message: string }).message
      : String(first?.toString?.() ?? first ?? '');
  return suppressPatterns.find(p => msg.includes(p)) ?? null;
};
const handleFiltered = (pattern: string): void => {
  process.stdout.write(`[Suppressed] ${pattern}\n`);
};
console.error = (...args: unknown[]) => {
  const pattern = getMatchedPattern(args);
  if (pattern) {
    handleFiltered(pattern);
    return;
  }
  originalConsoleError.apply(console, args);
};
console.warn = (...args: unknown[]) => {
  const pattern = getMatchedPattern(args);
  if (pattern) {
    handleFiltered(pattern);
    return;
  }
  originalConsoleWarn.apply(console, args);
};
