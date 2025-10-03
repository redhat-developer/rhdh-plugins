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

import type { ChangeEvent, FC } from 'react';

import HelpIcon from '@mui/icons-material/HelpOutline';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useTranslation } from '../../hooks/useTranslation';

interface ApprovalToolProps {
  approvalTool: string;
  setFieldValue: (field: string, value: any) => void; // Type for setFieldValue from Formik
}

const ApprovalTool: FC<ApprovalToolProps> = ({
  approvalTool,
  setFieldValue,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const handleApprovalToolChange = (
    _event: ChangeEvent<{}>,
    newValue: string,
  ) => {
    setFieldValue('approvalTool', newValue);
  };
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'left',
        alignItems: 'center',
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
        paddingLeft: theme.spacing(2),
        // backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        borderBottomColor: theme.palette.divider,
      }}
    >
      <Typography fontSize="14px" fontWeight="500">
        {t('addRepositories.approvalTool.title')}
      </Typography>
      <Tooltip
        placement="top"
        title={t('addRepositories.approvalTool.tooltip')}
      >
        <Typography
          sx={{
            paddingTop: theme.spacing(0.5),
            paddingRight: theme.spacing(3),
            paddingLeft: theme.spacing(0.5),
          }}
        >
          <HelpIcon fontSize="small" />
        </Typography>
      </Tooltip>
      <RadioGroup
        id="approval-tool"
        data-testid="approval-tool"
        row
        name="approvalTool"
        value={approvalTool}
        onChange={handleApprovalToolChange}
      >
        <FormControlLabel
          value="GIT"
          control={<Radio />}
          label={t('addRepositories.approvalTool.github')}
        />
        <FormControlLabel
          value="GITLAB"
          control={<Radio />}
          label={t('addRepositories.approvalTool.gitlab')}
        />
      </RadioGroup>
    </Box>
  );
};
export default ApprovalTool;
