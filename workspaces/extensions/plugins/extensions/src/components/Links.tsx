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

import { Link } from '@backstage/core-components';

import Typography from '@mui/material/Typography';

import { useTranslation } from '../hooks/useTranslation';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import {
  ExtensionsCollection,
  ExtensionsPackage,
  ExtensionsPlugin,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

export const Links = ({
  entity,
}: {
  entity: ExtensionsCollection | ExtensionsPlugin | ExtensionsPackage;
}) => {
  const { t } = useTranslation();
  const links = entity.metadata.links;

  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div>
      <Typography
        variant="h6"
        component="h3"
        sx={{ fontWeight: 500, fontSize: '1rem', mb: 0.5 }}
      >
        {t('common.links')}
      </Typography>
      <ul style={{ paddingLeft: '20px' }}>
        {links.map(link => (
          <li key={link.url} style={{ marginBottom: '8px' }}>
            <Link to={link.url}>
              {link.title ?? link.url}{' '}
              <OpenInNewIcon
                sx={{ fontSize: '1rem', verticalAlign: 'middle' }}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
