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

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { ExtensionsPlugin } from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { ExtensionsAnnotation } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import {
  useCatalogSourceConfig,
  getCatalogSourceLabel,
} from '../hooks/useCatalogSourceConfig';
import { useTranslation } from '../hooks/useTranslation';

export const CatalogSourceLabel = ({
  plugin,
}: {
  plugin: ExtensionsPlugin;
}) => {
  const { t } = useTranslation();
  const sourcesConfig = useCatalogSourceConfig();
  const sourceKey =
    plugin.metadata?.annotations?.[ExtensionsAnnotation.CATALOG_SOURCE];

  if (!sourceKey) return null;

  const label = getCatalogSourceLabel(plugin, sourcesConfig);
  const meta = sourcesConfig[sourceKey];

  const content = (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        component="h3"
        sx={{ fontWeight: 500, fontSize: '1rem', mb: 0.5 }}
      >
        {t('metadata.catalogSource')}
      </Typography>
      <Typography variant="body2">{label}</Typography>
    </Box>
  );

  if (meta?.description) {
    return (
      <Tooltip title={meta.description} placement="right" arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
};
