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
  FeaturedDocsCard as PluginHomeFeaturedDocsCard,
  FeaturedDocsCardProps,
} from '@backstage/plugin-home';

import { useTranslation } from '../hooks/useTranslation';

/**
 * Overrides `FeaturedDocsCard` from the home plugin, but overrides the
 * `subLinkText` prop to be " Learn more" instead of "LEARN MORE".
 *
 * 1. To fix the all uppercase that is used in home plugin
 * 2. To add a small missing gap between the title and the button
 */
export const FeaturedDocsCard = (props: FeaturedDocsCardProps) => {
  const { t } = useTranslation();
  return (
    <PluginHomeFeaturedDocsCard
      subLinkText={` ${t('featuredDocs.learnMore')}`}
      {...props}
    />
  );
};
