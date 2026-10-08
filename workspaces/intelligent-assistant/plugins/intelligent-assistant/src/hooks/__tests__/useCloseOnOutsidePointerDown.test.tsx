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

import { createRef } from 'react';

import { render, screen } from '@testing-library/react';

import { useCloseOnOutsidePointerDown } from '../useCloseOnOutsidePointerDown';

const Harness = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const rootRef = createRef<HTMLDivElement>();
  useCloseOnOutsidePointerDown(isOpen, onClose, rootRef);
  return (
    <div>
      <button type="button">outside</button>
      <div ref={rootRef}>
        <button type="button">inside</button>
      </div>
      <div className="pf-v6-c-menu">
        <button type="button">menu item</button>
      </div>
    </div>
  );
};

describe('useCloseOnOutsidePointerDown', () => {
  it('calls onClose for pointerdown outside the root and menu', () => {
    const onClose = jest.fn();
    render(<Harness isOpen onClose={onClose} />);

    screen
      .getByRole('button', { name: 'outside' })
      .dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
      );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose for pointerdown inside the root', () => {
    const onClose = jest.fn();
    render(<Harness isOpen onClose={onClose} />);

    screen
      .getByRole('button', { name: 'inside' })
      .dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
      );

    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose for pointerdown inside a portaled menu', () => {
    const onClose = jest.fn();
    render(<Harness isOpen onClose={onClose} />);

    screen
      .getByRole('button', { name: 'menu item' })
      .dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
      );

    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not listen when closed', () => {
    const onClose = jest.fn();
    render(<Harness isOpen={false} onClose={onClose} />);

    screen
      .getByRole('button', { name: 'outside' })
      .dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
      );

    expect(onClose).not.toHaveBeenCalled();
  });
});
