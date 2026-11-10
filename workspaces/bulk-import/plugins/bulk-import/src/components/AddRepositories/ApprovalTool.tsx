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

import type { FC } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  Flex,
  Radio,
  RadioGroup,
  Text,
  Tooltip,
  TooltipTrigger,
} from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';
import { BulkImportHelpIcon } from '../bulkImportIcons';
import { bulkImportTypographyApprovalToolTitle } from '../bulkImportTypography';

interface ApprovalToolProps {
  approvalTool: string;
  setFieldValue: (field: string, value: any) => void; // Type for setFieldValue from Formik
}

const ApprovalTool: FC<ApprovalToolProps> = ({
  approvalTool,
  setFieldValue,
}) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleApprovalToolChange = (newValue: string) => {
    setFieldValue('approvalTool', newValue);

    // Persist approval tool selection in URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('approvalTool', newValue);
    setSearchParams(newSearchParams, { replace: true });
  };

  return (
    <Flex
      align="center"
      gap="3"
      style={{
        paddingTop: '24px',
        paddingBottom: '24px',
        paddingLeft: '16px',
        // backgroundColor: theme.palette.background.paper,
        borderBottom: '1px solid var(--bui-border-1)',
      }}
    >
      <Text as="span" style={bulkImportTypographyApprovalToolTitle}>
        {t('addRepositories.approvalTool.title')}
      </Text>
      <TooltipTrigger>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <BulkImportHelpIcon />
        </span>
        <Tooltip placement="top">
          {t('addRepositories.approvalTool.tooltip')}
        </Tooltip>
      </TooltipTrigger>
      <RadioGroup
        id="approval-tool"
        data-testid="approval-tool"
        orientation="horizontal"
        value={approvalTool}
        onChange={handleApprovalToolChange}
      >
        <Radio value="GIT">{t('addRepositories.approvalTool.github')}</Radio>
        <Radio value="GITLAB">{t('addRepositories.approvalTool.gitlab')}</Radio>
      </RadioGroup>
    </Flex>
  );
};
export default ApprovalTool;
