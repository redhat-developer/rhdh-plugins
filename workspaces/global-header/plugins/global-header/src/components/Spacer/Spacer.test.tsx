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

import { render } from '@testing-library/react';

import { Spacer } from './Spacer';

describe('Spacer', () => {
  it('render some default styles', () => {
    const { container } = render(<Spacer />);
    expect(container.firstElementChild?.getAttribute('style')).toEqual(
      'flex-grow: 1; min-width: 8px;',
    );
  });

  it('accepts another grow factor', () => {
    const { container } = render(<Spacer growFactor={2} />);
    expect(container.firstElementChild?.getAttribute('style')).toEqual(
      'flex-grow: 2; min-width: 8px;',
    );
  });

  it('accepts number min width', () => {
    const { container } = render(<Spacer minWidth={2} />);
    expect(container.firstElementChild?.getAttribute('style')).toEqual(
      'flex-grow: 1; min-width: 16px;',
    );
  });

  it('accepts string min width', () => {
    const { container } = render(<Spacer minWidth="24px" />);
    expect(container.firstElementChild?.getAttribute('style')).toEqual(
      'flex-grow: 1; min-width: 24px;',
    );
  });

  it('accepts both', () => {
    const { container } = render(<Spacer growFactor={2} minWidth={2} />);
    expect(container.firstElementChild?.getAttribute('style')).toEqual(
      'flex-grow: 2; min-width: 16px;',
    );
  });
});
