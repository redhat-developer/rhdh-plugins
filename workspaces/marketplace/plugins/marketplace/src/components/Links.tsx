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

import {
  MarketplaceCollection,
  MarketplacePackage,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

export const Links = ({
  entity,
}: {
  entity: MarketplaceCollection | MarketplacePlugin | MarketplacePackage;
}) => {
  const links = entity.metadata.links;

  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div>
      <Typography variant="h5" sx={{ pt: 2 }}>
        Links
      </Typography>
      <ul>
        {links.map(link => (
          <li key={link.url}>
            <Link to={link.url} externalLinkIcon>
              {link.title ?? link.url}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
