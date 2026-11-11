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

import type { CSSProperties, KeyboardEvent } from 'react';
import { Box, Flex, Text } from '@backstage/ui';
import { RiHand } from '@remixicon/react';

export type QuickstartMenuItemLayoutProps = {
  label: string;
  onActivate: () => void;
  style?: CSSProperties;
  as?: keyof JSX.IntrinsicElements;
  'data-testid'?: string;
};

/**
 * Shared help-menu row chrome for Quick start entries (hand icon + label).
 */
export const QuickstartMenuItemLayout = ({
  label,
  onActivate,
  style,
  as,
  'data-testid': testId,
}: QuickstartMenuItemLayoutProps) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
    }
  };

  return (
    <Box
      as={as}
      role="menuitem"
      tabIndex={0}
      data-testid={testId}
      style={{
        display: 'flex',
        width: '100%',
        boxSizing: 'border-box',
        padding: 0,
        border: 'none',
        backgroundColor: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        listStyle: 'none',
        ...style,
      }}
      onClick={onActivate}
      onKeyDown={handleKeyDown}
    >
      <Flex
        align="center"
        justify="between"
        px="4"
        my="2"
        style={{ width: '100%' }}
      >
        <Flex align="center" gap="2">
          <Box
            aria-hidden
            style={{ display: 'flex', color: 'var(--bui-fg-disabled)' }}
          >
            <RiHand size={20} />
          </Box>
          <Text variant="body-small">{label}</Text>
        </Flex>
      </Flex>
    </Box>
  );
};
