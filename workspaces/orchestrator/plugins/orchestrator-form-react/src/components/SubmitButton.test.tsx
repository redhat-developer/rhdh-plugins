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

import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import SubmitButton from './SubmitButton';

describe('SubmitButton', () => {
  it('renders children and invokes handleClick', () => {
    const handleClick = jest.fn();
    render(
      <SubmitButton submitting={false} handleClick={handleClick}>
        Run
      </SubmitButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables the button while submitting', () => {
    render(
      <SubmitButton submitting handleClick={jest.fn()}>
        Run
      </SubmitButton>,
    );

    expect(screen.getByRole('button', { name: /Run/ })).toBeDisabled();
  });

  it('focuses the button when focusOnMount is set', () => {
    render(
      <SubmitButton submitting={false} focusOnMount>
        Run
      </SubmitButton>,
    );

    expect(screen.getByRole('button', { name: 'Run' })).toHaveFocus();
  });
});
