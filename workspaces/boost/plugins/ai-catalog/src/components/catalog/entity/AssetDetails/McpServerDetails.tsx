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

import { CodeSnippet } from '@backstage/core-components';
import { Flex, Link, Text } from '@backstage/ui';
import { Fragment } from 'react';

import { useTranslation } from '../../../../hooks/useTranslation';
import { DetailField } from './DetailField';
import type { McpServerDetailsData } from './assetDetailsData';

interface McpServerDetailsProps {
  readonly details: McpServerDetailsData;
}

const RemoteLinks = ({ remotes }: Pick<McpServerDetailsData, 'remotes'>) => {
  const renderRemote = (remote: (typeof remotes)[number]) => {
    const label = remote.type ? `${remote.type}: ${remote.url}` : remote.url;

    try {
      const url = new URL(remote.url);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return <Text color="secondary">{label}</Text>;
      }
    } catch {
      return <Text color="secondary">{label}</Text>;
    }

    return (
      <Link href={remote.url} target="_blank" rel="noopener noreferrer">
        {label}
      </Link>
    );
  };

  return (
    <Flex direction="column" gap="1">
      {remotes.map(remote => (
        <Fragment key={`${remote.type ?? 'remote'}:${remote.url}`}>
          {renderRemote(remote)}
        </Fragment>
      ))}
    </Flex>
  );
};

export const McpServerDetails = ({ details }: McpServerDetailsProps) => {
  const { t } = useTranslation();

  return (
    <>
      {details.remotes.length > 0 && (
        <DetailField label={t('catalog.card.remotesLabel')}>
          <RemoteLinks remotes={details.remotes} />
        </DetailField>
      )}
      {details.definition && (
        <DetailField label={t('catalog.card.definitionLabel')}>
          <CodeSnippet
            language="yaml"
            text={details.definition}
            showCopyCodeButton
            wrapLongLines
            customStyle={{
              margin: 0,
              padding: 'var(--bui-space-3)',
              border: '1px solid var(--bui-border-1)',
              borderRadius: 'var(--bui-radius-2)',
              background: 'var(--bui-bg-neutral-2)',
            }}
          />
        </DetailField>
      )}
    </>
  );
};
