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

import { Entity } from '@backstage/catalog-model';
import { CodeSnippet } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { Card, CardBody, CardHeader, Text } from '@backstage/ui';

import YAML from 'yaml';

import { bulkImportTypographyH6 } from '../bulkImportTypography';

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

export const PreviewCatalogInfoPreviewCard = ({
  repositoryUrl,
  entities,
  className,
}: {
  repositoryUrl: string;
  entities: Entity[];
  className?: string;
}) => {
  const configApi = useApi(configApiRef);
  const catalogFilename =
    configApi.getOptionalString('catalog.import.entityFilename') ??
    'catalog-info.yaml';
  const headerPath = `${trimTrailingSlashes(repositoryUrl)}/${catalogFilename}`;
  const yamlText = entities
    .map(entity => YAML.stringify(entity))
    .join('---\n')
    .trim();

  return (
    <Card className={className}>
      <CardHeader>
        <Text
          as="span"
          style={{ ...bulkImportTypographyH6, fontFamily: 'monospace' }}
        >
          {headerPath}
        </Text>
      </CardHeader>
      <CardBody style={{ paddingTop: 0 }}>
        <CodeSnippet
          text={yamlText}
          language="yaml"
          customStyle={{
            margin: 0,
            padding: '0.5rem 0.75rem',
          }}
        />
      </CardBody>
    </Card>
  );
};
