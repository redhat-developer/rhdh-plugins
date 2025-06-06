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

import { InfoCard } from '@backstage/core-components';
import Button, { ButtonProps } from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox, { CheckboxProps } from '@mui/material/Checkbox';
import Switch, { SwitchProps } from '@mui/material/Switch';

const Buttons = () => {
  const colors: ButtonProps['color'][] = [
    undefined,
    'inherit',
    'primary',
    'secondary',
    'success',
    'error',
    'info',
    'warning',
  ];
  const variants: ButtonProps['variant'][] = ['contained', 'outlined', 'text'];
  return (
    <table style={{ borderSpacing: 8 }}>
      <tr>
        <th>&nbsp;</th>
        <th colSpan={3}>enabled</th>
        <th colSpan={3}>disabled</th>
      </tr>
      <tr>
        <th>color</th>
        {variants.map(variant => (
          <th key={variant}>{variant}</th>
        ))}
      </tr>
      {colors.map(color => (
        <tr key={color}>
          <td>{color ?? 'no color'}</td>
          {variants.map(variant => (
            <td key={variant}>
              <Button color={color} variant={variant}>
                a button
              </Button>
            </td>
          ))}
          {variants.map(variant => (
            <td key={variant}>
              <Button color={color} variant={variant} disabled>
                a button
              </Button>
            </td>
          ))}
        </tr>
      ))}
    </table>
  );
};

const Checkboxes = () => {
  const colors: CheckboxProps['color'][] = [
    undefined,
    'primary',
    'secondary',
    'error',
    'info',
    'success',
    'warning',
    'default',
  ];
  return (
    <table>
      <tr>
        <th>color</th>
        <th>enabled</th>
        <th>disabled</th>
      </tr>
      {colors.map(color => (
        <tr key={color}>
          <td>{color ?? 'no color'}</td>
          <td>
            <FormControlLabel
              control={<Checkbox defaultChecked color={color} />}
              label="a checkbox"
            />
          </td>
          <td>
            <FormControlLabel
              control={<Checkbox defaultChecked color={color} />}
              label="a checkbox"
              disabled
            />
          </td>
        </tr>
      ))}
    </table>
  );
};

const Switches = () => {
  const colors: SwitchProps['color'][] = [
    undefined,
    'primary',
    'secondary',
    'error',
    'info',
    'success',
    'warning',
    'default',
  ];
  return (
    <table>
      <tr>
        <th>color</th>
        <th>enabled on</th>
        <th>enabled off</th>
        <th>disabled on</th>
        <th>disabled off</th>
      </tr>
      {colors.map(color => (
        <tr key={color}>
          <td>{color ?? 'no color'}</td>
          <td>
            <FormControlLabel
              control={<Switch checked color={color} />}
              label="a switch"
            />
          </td>
          <td>
            <FormControlLabel
              control={<Switch color={color} />}
              label="a switch"
            />
          </td>
          <td>
            <FormControlLabel
              control={<Switch color={color} />}
              label="a switch"
              disabled
            />
          </td>
          <td>
            <FormControlLabel
              control={<Switch checked color={color} />}
              label="a switch"
              disabled
            />
          </td>
        </tr>
      ))}
    </table>
  );
};

export const FormComponents = () => {
  return (
    <div>
      <InfoCard title="Information card">
        <Buttons />
        <br />
        <Checkboxes />
      </InfoCard>
      <br />
      <Buttons />
      <br />
      <Checkboxes />
      <br />
      <Switches />
    </div>
  );
};
