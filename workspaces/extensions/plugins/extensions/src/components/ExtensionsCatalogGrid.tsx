/*
 * Copyright The Backstage Authors
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

import Typography from '@mui/material/Typography';
import { useFilteredPlugins } from '../hooks/useFilteredPlugins';

import { PluginCard, PluginCardGrid, PluginCardSkeleton } from './PluginCard';
import { useTranslation } from '../hooks/useTranslation';

export const ExtensionsCatalogGrid = () => {
  const { t } = useTranslation();
  const filteredPlugins = useFilteredPlugins();
  const skeletonComponents = Array(4).fill(<PluginCardSkeleton />);

  if (filteredPlugins.isLoading) {
    return <PluginCardGrid>{skeletonComponents}</PluginCardGrid>;
  }

  if (filteredPlugins.data?.filteredItems === 0) {
    return (
      <Typography sx={{ textAlign: 'center', pb: '16px' }} component="span">
        {t('search.noResultsFound')}
      </Typography>
    );
  }

  return (
    <PluginCardGrid>
      {filteredPlugins.data?.items.map(plugin => (
        <PluginCard
          key={`${plugin.metadata.namespace}/${plugin.metadata.name}`}
          plugin={plugin}
        />
      ))}
    </PluginCardGrid>
  );
};
