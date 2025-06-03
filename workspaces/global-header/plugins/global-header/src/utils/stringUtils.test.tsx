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

import { render, screen } from '@testing-library/react';
import { highlightMatch } from './stringUtils';
import '@testing-library/jest-dom';

describe('highlightMatch', () => {
  it('should highlight the query within the text', () => {
    const text = 'This is a test string';
    const query = 'test';
    const { container } = render(<>{highlightMatch(text, query)}</>);

    const highlighted = screen.getByText('test');
    expect(highlighted).toHaveStyle('font-weight: normal');

    const spans = container.querySelectorAll('span');
    expect(spans[0].textContent?.trim()).toBe('This is a');
    expect(spans[0]).toHaveStyle('font-weight: 700');
    expect(spans[2].textContent?.trim()).toBe('string');
    expect(spans[2]).toHaveStyle('font-weight: 700');
  });

  it('should highlight the query case-insensitively', () => {
    const text = 'This is a Test string';
    const query = 'test';
    render(<>{highlightMatch(text, query)}</>);

    const highlighted = screen.getByText('Test');
    expect(highlighted).toHaveStyle('font-weight: normal');
  });

  it('should handle special regex characters in the query', () => {
    const text = 'This is a [test] string';
    const query = '[test]';
    render(<>{highlightMatch(text, query)}</>);

    const highlighted = screen.getByText('[test]');
    expect(highlighted).toHaveStyle('font-weight: normal');
  });

  it('should not highlight anything if the query does not match', () => {
    const text = 'This is a test string';
    const query = 'notfound';
    const { container } = render(<>{highlightMatch(text, query)}</>);

    expect(container.textContent).toBe(text);
  });
});
