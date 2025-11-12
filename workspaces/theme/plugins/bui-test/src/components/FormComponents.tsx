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
  Button,
  ButtonProps,
  Checkbox,
  Flex,
  Switch,
  Text,
} from '@backstage/ui';
import CloudIcon from '@mui/icons-material/Cloud';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const Buttons = () => {
  const variants: ButtonProps['variant'][] = [
    'primary',
    'secondary',
    'tertiary',
  ];
  const sizes: ButtonProps['size'][] = [undefined, 'small', 'medium'];

  return (
    <Flex direction="column">
      {variants.map(variant => (
        <Flex direction="column" key={variant as string}>
          <Text>{variant as string}</Text>
          {sizes.map(size => (
            <Flex align="center" key={size as string}>
              <Button variant={variant} size={size}>
                Button
              </Button>
              <Button
                iconStart={<CloudIcon fontSize="small" />}
                variant={variant}
                size={size}
              >
                Button
              </Button>
              <Button
                iconEnd={<ChevronRightIcon fontSize="small" />}
                variant={variant}
                size={size}
              >
                Button
              </Button>
              <Button
                iconStart={<CloudIcon fontSize="small" />}
                iconEnd={<ChevronRightIcon fontSize="small" />}
                style={{
                  width: '200px',
                }}
                variant={variant}
                size={size}
              >
                Button
              </Button>
              <Button variant={variant} size={size} isDisabled>
                Button
              </Button>
              <Button
                iconStart={<CloudIcon fontSize="small" />}
                variant={variant}
                size={size}
                isDisabled
              >
                Button
              </Button>
              <Button
                iconEnd={<ChevronRightIcon fontSize="small" />}
                variant={variant}
                size={size}
                isDisabled
              >
                Button
              </Button>
            </Flex>
          ))}
        </Flex>
      ))}
    </Flex>
  );
};

const Checkboxes = () => {
  return (
    <Flex>
      <Text>Checkboxes</Text>
      <Flex align="center">
        <Checkbox />
        <Checkbox checked />
        <Checkbox label="Checkbox" />
        <Checkbox label="Checkbox" checked />
      </Flex>
    </Flex>
  );
};

const Switches = () => {
  return (
    <Flex>
      <Text>Switches</Text>
      <Flex align="center">
        <Switch />
        <Switch isSelected />
        <Switch label="Switch" />
        <Switch label="Switch" isSelected />
      </Flex>
    </Flex>
  );
};

export const FormComponents = () => {
  return (
    <div>
      <Buttons />
      <br />
      <Checkboxes />
      <br />
      <Switches />
    </div>
  );
};
