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

import { parseCommaSeparatedString } from './parseCommaSeparatedString';

describe('parseCommaSeparatedString', () => {
  it('should return array with single value for non-comma string', () => {
    const result = parseCommaSeparatedString('github.open_prs');
    expect(result).toEqual(['github.open_prs']);
  });

  it('should return array with trimmed whitespace multiple values when values are comma and space separated', () => {
    const result = parseCommaSeparatedString(
      ' github.open_prs , github.open_issues ',
    );

    expect(result).toEqual(['github.open_prs', 'github.open_issues']);
  });

  it('should handle string with only whitespace', () => {
    const result = parseCommaSeparatedString('    ');
    expect(result).toEqual(['']);
  });

  it('should handle string with only commas', () => {
    const result = parseCommaSeparatedString(' , , ');
    expect(result).toEqual(['', '', '']);
  });

  it('should handle empty values between commas', () => {
    const result = parseCommaSeparatedString('metric1, ,metric2');
    expect(result).toEqual(['metric1', '', 'metric2']);
  });
});
