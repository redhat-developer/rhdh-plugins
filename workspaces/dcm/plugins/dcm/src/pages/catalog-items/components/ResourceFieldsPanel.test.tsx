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

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourceFieldsPanel } from './ResourceFieldsPanel';
import { emptyFieldRow } from '../catalogItemFormTypes';
import type { FieldRow } from '../catalogItemFormTypes';

jest.mock('../../../hooks/useTranslation', () => {
  const mod = require('../../../test-utils/mockTranslations');
  return { useTranslation: mod.mockUseTranslation };
});

let uuidCounter = 0;

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => {
        uuidCounter += 1;
        return `test-uuid-${uuidCounter}`;
      },
    },
    writable: true,
    configurable: true,
  });
});

function renderPanel(
  fields: FieldRow[],
  overrides: Partial<React.ComponentProps<typeof ResourceFieldsPanel>> = {},
) {
  const onChange = jest.fn();
  const { rerender } = render(
    <ResourceFieldsPanel fields={fields} onChange={onChange} {...overrides} />,
  );
  return { onChange, rerender };
}

describe('ResourceFieldsPanel', () => {
  it('renders one empty row initially when given a single empty field', () => {
    const fields = [emptyFieldRow()];
    renderPanel(fields);
    const pathInputs = screen.getAllByRole('textbox');
    // At least the path input is present
    expect(pathInputs.length).toBeGreaterThan(0);
  });

  it('disables the Add button when the last row path is blank', () => {
    const fields = [emptyFieldRow()];
    renderPanel(fields);
    const addButton = screen.getByRole('button', { name: /add field/i });
    expect(addButton).toBeDisabled();
  });

  it('enables the Add button when the last row has a non-blank path', () => {
    const field = emptyFieldRow();
    const fields: FieldRow[] = [{ ...field, path: 'spec.cpu' }];
    renderPanel(fields);
    const addButton = screen.getByRole('button', { name: /add field/i });
    expect(addButton).not.toBeDisabled();
  });

  it('calls onChange with a new empty row appended when Add is clicked', async () => {
    const field = emptyFieldRow();
    const fields: FieldRow[] = [{ ...field, path: 'spec.cpu' }];
    const { onChange } = renderPanel(fields);
    await userEvent.click(screen.getByRole('button', { name: /add field/i }));
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ path: 'spec.cpu' }),
        expect.objectContaining({ path: '' }),
      ]),
    );
    expect(onChange.mock.calls[0][0]).toHaveLength(2);
  });

  it('calls onChange with the row removed when Remove is clicked', async () => {
    const f1 = { ...emptyFieldRow(), path: 'spec.cpu' };
    const f2 = { ...emptyFieldRow(), path: 'spec.mem' };
    const { onChange } = renderPanel([f1, f2]);
    const removeButtons = screen.getAllByRole('button', {
      name: /remove field/i,
    });
    await userEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ path: 'spec.mem' })]),
    );
    expect(onChange.mock.calls[0][0]).toHaveLength(1);
  });

  it('replaces the last row with an empty row when the only row is removed', async () => {
    const f = { ...emptyFieldRow(), path: 'spec.cpu' };
    const { onChange } = renderPanel([f]);
    await userEvent.click(
      screen.getByRole('button', { name: /remove field/i }),
    );
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ path: '' }),
    ]);
  });

  it('shows duplicate-path error when two rows share the same path', () => {
    const f1 = { ...emptyFieldRow(), path: 'spec.cpu' };
    const f2 = { ...emptyFieldRow(), path: 'spec.cpu' };
    renderPanel([f1, f2]);
    expect(screen.getAllByText(/Duplicate path/i).length).toBeGreaterThan(0);
  });

  it('shows empty-fields banner when submitAttempted is true and fields are invalid', () => {
    const fields = [emptyFieldRow()]; // empty path — not valid
    renderPanel(fields, { submitAttempted: true });
    expect(
      screen.getByText(/Add at least one field with a non-empty path/i),
    ).toBeInTheDocument();
  });

  it('does not show the empty-fields banner when submitAttempted is false', () => {
    const fields = [emptyFieldRow()];
    renderPanel(fields, { submitAttempted: false });
    expect(
      screen.queryByText(/Add at least one field with a non-empty path/i),
    ).not.toBeInTheDocument();
  });

  it('updates the path when the user types in the path field', () => {
    const fields = [emptyFieldRow()];
    const { onChange } = renderPanel(fields);
    const pathInputs = screen.getAllByRole('textbox');
    fireEvent.change(pathInputs[0], { target: { value: 'spec.ram' } });
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ path: 'spec.ram' }),
    ]);
  });
});
