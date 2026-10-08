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
import { UserValueFields } from './UserValueFields';
import type { UserValueRow } from '../pages/catalog-item-instances/instanceFormTypes';

function makeRow(overrides: Partial<UserValueRow> = {}): UserValueRow {
  return {
    path: 'spec.size',
    displayName: 'Size',
    value: '',
    required: false,
    schemaType: undefined,
    schemaMin: undefined,
    schemaMax: undefined,
    enumValues: undefined,
    ...overrides,
  };
}

function renderFields(
  rows: UserValueRow[],
  overrides: Partial<React.ComponentProps<typeof UserValueFields>> = {},
) {
  const onValueChange = jest.fn();
  const onBlur = jest.fn();
  render(
    <UserValueFields
      rows={rows}
      errors={{}}
      touchedMap={{}}
      onValueChange={onValueChange}
      onBlur={onBlur}
      {...overrides}
    />,
  );
  return { onValueChange, onBlur };
}

describe('UserValueFields', () => {
  describe('text field', () => {
    it('renders a plain text input for a row without a specific schemaType', () => {
      renderFields([makeRow({ path: 'spec.name', displayName: 'Name' })]);
      // MUI v4 labels are not aria-associated in jsdom; query by role only.
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
      expect(inputs[0]).toHaveAttribute('type', 'text');
    });

    it('calls onValueChange and onBlur on input interaction', async () => {
      const { onValueChange, onBlur } = renderFields([makeRow()]);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'x');
      expect(onValueChange).toHaveBeenCalledWith(0, expect.any(String));
      fireEvent.blur(input);
      expect(onBlur).toHaveBeenCalledWith(0);
    });
  });

  describe('number field', () => {
    it('renders type="number" input for schemaType integer', () => {
      renderFields([makeRow({ schemaType: 'integer', displayName: 'Count' })]);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('renders type="number" input for schemaType number', () => {
      renderFields([makeRow({ schemaType: 'number', displayName: 'Price' })]);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('boolean field', () => {
    it('renders a Switch for schemaType boolean', () => {
      renderFields([
        makeRow({
          schemaType: 'boolean',
          displayName: 'Enabled',
          value: 'false',
        }),
      ]);
      const toggle = screen.getByRole('checkbox');
      expect(toggle).toBeInTheDocument();
    });

    it('calls onValueChange with string "true"/"false" on toggle', async () => {
      const { onValueChange } = renderFields([
        makeRow({
          schemaType: 'boolean',
          displayName: 'Enabled',
          value: 'false',
        }),
      ]);
      const toggle = screen.getByRole('checkbox');
      await userEvent.click(toggle);
      expect(onValueChange).toHaveBeenCalledWith(0, 'true');
    });
  });

  describe('enum field', () => {
    it('renders a Select for rows with enumValues', () => {
      renderFields([
        makeRow({
          displayName: 'Size',
          enumValues: ['small', 'medium', 'large'],
          value: 'small',
        }),
      ]);
      // MUI Select renders as a role="button" showing the current value.
      expect(
        screen.getByRole('button', { name: /small/i }),
      ).toBeInTheDocument();
    });
  });

  describe('required field', () => {
    it('appends * to the label when required is true', () => {
      renderFields([makeRow({ displayName: 'CPU', required: true })]);
      // MUI renders the label in two DOM nodes — use getAllByText.
      expect(screen.getAllByText('CPU *').length).toBeGreaterThan(0);
    });

    it('does not append * when required is false', () => {
      renderFields([makeRow({ displayName: 'CPU', required: false })]);
      expect(screen.queryAllByText('CPU *')).toHaveLength(0);
    });
  });

  describe('error display', () => {
    it('does not show error when touchedMap entry is false', () => {
      renderFields([makeRow({ displayName: 'Name', value: '' })], {
        errors: { 0: 'Required' },
        touchedMap: { 0: false },
      });
      expect(screen.queryByText('Required')).not.toBeInTheDocument();
    });

    it('shows error when touchedMap entry is true', () => {
      renderFields([makeRow({ displayName: 'Name', value: '' })], {
        errors: { 0: 'Required' },
        touchedMap: { 0: true },
      });
      expect(screen.getByText('Required')).toBeInTheDocument();
    });
  });
});
