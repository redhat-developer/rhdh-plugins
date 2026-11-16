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

import { Link, StatusPending } from '@backstage/core-components';
import { Text } from '@backstage/ui';

import { useTranslation } from '../hooks/useTranslation';
import {
  BulkImportExternalLinkIcon,
  bulkImportExternalLinkLinkStyle,
} from './bulkImportIcons';

export const WaitingForPR = ({ url }: { url: string }) => {
  const { t } = useTranslation();

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <StatusPending />
      <Text>{t('status.waitingForApproval')}</Text>
      {url && (
        <Link
          to={url}
          data-testid="pull request url"
          style={{
            paddingLeft: '5px',
            ...bulkImportExternalLinkLinkStyle,
            whiteSpace: 'nowrap',
          }}
        >
          {t('repositories.pr')}
          <BulkImportExternalLinkIcon size={14} />
        </Link>
      )}
    </span>
  );
};
