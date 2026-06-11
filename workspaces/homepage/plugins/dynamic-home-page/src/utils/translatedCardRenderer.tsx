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
import type { RendererProps } from '@backstage/plugin-home-react';

import { styled } from '@mui/material/styles';

import { useTranslation } from '../hooks/useTranslation';
import { getTranslatedTextWithFallback } from '../translations/utils';

const QuickAccessInfoCard = styled(InfoCard)({
  '& div > div > div > div > p': {
    textTransform: 'uppercase',
  },
});

/**
 * Creates a home page card Renderer that resolves the title via the plugin
 * translation system at render time (for NFS HomePageWidgetBlueprint widgets).
 */
export function createTranslatedCardRenderer(
  titleKey: string,
  options?: { quickAccessStyle?: boolean },
) {
  return function TranslatedCardRenderer({ Content, title }: RendererProps) {
    const { t } = useTranslation();
    const displayTitle = getTranslatedTextWithFallback(t, titleKey, title);

    if (options?.quickAccessStyle) {
      return (
        <QuickAccessInfoCard title={displayTitle} noPadding>
          <Content />
        </QuickAccessInfoCard>
      );
    }

    return (
      <InfoCard title={displayTitle} divider={!!displayTitle}>
        <Content />
      </InfoCard>
    );
  };
}
