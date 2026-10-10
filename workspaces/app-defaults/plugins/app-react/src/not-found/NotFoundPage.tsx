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
 * Props for the {@link NotFoundPage} component.
 *
 * @public
 */
export interface NotFoundPageProps {
  /** Heading displayed above the not-found illustration. */
  title: string;
  /** Explanatory text rendered below the heading. */
  description: string;
}

/**
 * A full-page "not found" state that matches the RHDH empty-state visual
 * language (illustration, headline, description, and a support link).
 *
 * @public
 */
export const NotFoundPage = (props: NotFoundPageProps) => {
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
