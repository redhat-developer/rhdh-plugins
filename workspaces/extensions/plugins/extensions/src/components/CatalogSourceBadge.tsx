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

import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

import {
  useCatalogSourceConfig,
  getCatalogSourceLabel,
} from '../hooks/useCatalogSourceConfig';

export const CatalogSourceBadge = ({ sourceKey }: { sourceKey?: string }) => {
  const sourcesConfig = useCatalogSourceConfig();

  if (!sourceKey) return null;

  const meta = sourcesConfig[sourceKey];
  const badgeLabel =
    meta?.badge ?? getCatalogSourceLabel(sourceKey, sourcesConfig);

  const chip = <Chip label={badgeLabel} variant="outlined" size="small" />;

  if (meta?.description) {
    return (
      <Tooltip title={meta.description} placement="right" arrow>
        {chip}
      </Tooltip>
    );
  }

  return chip;
};
