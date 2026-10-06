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

import {
  isModelSelectorLabelTruncated,
  truncateModelSelectorLabel,
} from '../model-selector-utils';

describe('truncateModelSelectorLabel', () => {
  it('truncates long model names to 15 characters including ellipsis', () => {
    const long = 'meta-llama/Meta-Llama-3.1-70b:latest';
    expect(truncateModelSelectorLabel(long)).toBe('meta-llama/Met…');
    expect(truncateModelSelectorLabel(long).length).toBe(15);
  });

  it('leaves short names unchanged', () => {
    expect(truncateModelSelectorLabel('Granite 3.3')).toBe('Granite 3.3');
  });

  it('detects when a label was truncated', () => {
    expect(
      isModelSelectorLabelTruncated('meta-llama/Meta-Llama-3.1-70b:latest'),
    ).toBe(true);
    expect(isModelSelectorLabelTruncated('Granite 3.3')).toBe(false);
  });
});
