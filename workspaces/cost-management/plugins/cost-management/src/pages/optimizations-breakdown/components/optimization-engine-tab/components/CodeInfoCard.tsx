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

import React, { useMemo } from 'react';
import YAML from 'yaml';
import { CodeSnippet, InfoCard } from '@backstage/core-components';
import { YamlCodeData } from '../../../models/YamlCodeData';
import { InfoCardTitle } from '../../../../../components/InfoCardTitle';

const generateYAMLCode = (yamlCodeData?: YamlCodeData) => {
  const yamlCode = {
    limits: {
      cpu: yamlCodeData?.limits.cpu ?? '-',
      memory: yamlCodeData?.limits.memory ?? '-',
    },
    requests: {
      cpu: yamlCodeData?.requests.cpu ?? '-',
      memory: yamlCodeData?.requests.memory ?? '-',
    },
  };

  const yamlCodeString = YAML.stringify(yamlCode).replace(/"/g, ''); // prettify;

  return yamlCodeString;
};

type InfoCardProps = Parameters<typeof InfoCard>[0];

interface CodeInfoCardProps {
  cardTitle: string;
  showCopyCodeButton?: boolean;
  yamlCodeData?: YamlCodeData;
  action?: InfoCardProps['action'];
}

export const CodeInfoCard: React.FC<CodeInfoCardProps> = props => {
  const { cardTitle, showCopyCodeButton = false, yamlCodeData } = props;

  const YAMLCode = useMemo(
    () => generateYAMLCode(yamlCodeData),
    [yamlCodeData],
  );

  return (
    <InfoCard title={<InfoCardTitle title={cardTitle} />} action={props.action}>
      <CodeSnippet
        text={YAMLCode}
        language="yaml"
        showCopyCodeButton={showCopyCodeButton}
      />
    </InfoCard>
  );
};
