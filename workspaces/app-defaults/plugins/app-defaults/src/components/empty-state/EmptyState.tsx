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

import { Flex, Text } from '@backstage/ui';
import { SupportButton } from './SupportButton';

import notFoundImage from './notfound.png';

/**
 * @internal
 */
export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

/**
 * @internal
 */
export const EmptyState = (props: EmptyStateProps) => {
  return (
    <Flex
      direction={{ initial: 'column', md: 'row' }}
      align="center"
      style={{ minHeight: '80vh' }}
    >
      <Flex
        grow={{ initial: 0, md: 1 }}
        basis={0}
        direction="column"
        align="start"
        p="6"
      >
        <Text variant="title-medium">{props.title}</Text>
        <Text variant="body-medium" color="secondary">
          {props.description}
        </Text>
        <Flex gap="4">
          {props.action}
          <SupportButton />
        </Flex>
      </Flex>
      <Flex
        grow={{ initial: 0, md: 1 }}
        basis={0}
        aria-hidden
        style={{
          backgroundImage: `url(${notFoundImage})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain',
          minHeight: '300px',
          alignSelf: 'stretch',
        }}
      >
        {null}
      </Flex>
    </Flex>
  );
};
