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

import quickstartImage from '../assets/quickstart-image.png';
import { useIsDarkTheme } from '../hooks/useIsDarkTheme';
import { useTranslation } from '../hooks/useTranslation';

export const QuickstartHeader = () => {
  const { t } = useTranslation();
  const isDark = useIsDarkTheme();

  return (
    <Flex direction="column" align="center">
      <img
        src={quickstartImage}
        alt=""
        width={128}
        style={{
          height: 'auto',
          // Dark logo asset → white in dark mode
          filter: isDark ? 'brightness(0) invert(1)' : undefined,
        }}
      />
      <Flex direction="column" align="center" py="6">
        {/* title-small = 24px; body-large = --bui-font-size-4 = 18px under RHDH theme */}
        <Text as="h2" variant="body-large">
          {t('header.title')}
        </Text>
        <Text variant="body-small" color="secondary">
          {t('header.subtitle')}
        </Text>
      </Flex>
    </Flex>
  );
};
