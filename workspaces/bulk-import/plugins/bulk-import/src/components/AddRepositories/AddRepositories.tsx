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

import { useDrawer } from '@janus-idp/shared-react';
import { makeStyles, Theme } from '@material-ui/core';
import HelpIcon from '@mui/icons-material/HelpOutline';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useFormikContext } from 'formik';
import { get } from 'lodash';

import { useNumberOfApprovalTools } from '../../hooks';
import { AddRepositoriesFormValues, PullRequestPreviewData } from '../../types';
import { gitlabFeatureFlag } from '../../utils/repository-utils';
import { PreviewFileSidebar } from '../PreviewFile/PreviewFileSidebar';
// import { useFormikContext } from 'formik';
// import { AddRepositoriesFormValues } from '../../types';
import { AddRepositoriesFormFooter } from './AddRepositoriesFormFooter';
import { AddRepositoriesTable } from './AddRepositoriesTable';

const useStyles = makeStyles((theme: Theme) => ({
  approvalTool: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'left',
    alignItems: 'center',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    paddingLeft: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderBottomStyle: 'groove',
    borderBottomColor: theme.palette.divider,
  },
  approvalToolTooltip: {
    paddingTop: theme.spacing(0.5),
    paddingRight: theme.spacing(3),
    paddingLeft: theme.spacing(0.5),
  },
}));

export const AddRepositories = ({ error }: { error: any }) => {
  const { openDrawer, setOpenDrawer, drawerData } = useDrawer();
  const { setFieldValue, values } =
    useFormikContext<AddRepositoriesFormValues>();

  const styles = useStyles();
  const theme = useTheme();
  const closeDrawer = () => {
    setOpenDrawer(false);
  };

  const handleSave = (pullRequest: PullRequestPreviewData, _event: any) => {
    Object.keys(pullRequest).forEach(pr => {
      setFieldValue(
        `repositories.${pr}.catalogInfoYaml.prTemplate`,
        pullRequest[pr],
      );
    });
    setOpenDrawer(false);
  };
  const { numberOfApprovalTools } = useNumberOfApprovalTools();
  return (
    <>
      <FormControl fullWidth>
        <div
          style={{
            marginBottom: '50px',
            padding: '24px',
          }}
        >
          {error && (
            <div style={{ paddingBottom: '10px' }}>
              <Alert severity="error">
                <AlertTitle>{get(error, 'name') || 'Error occured'}</AlertTitle>
                {get(error, 'err') || 'Failed to create pull request'}
              </Alert>
            </div>
          )}

          {/* Need to improve CSS */}
          {gitlabFeatureFlag && numberOfApprovalTools > 1 && (
            <Box
              sx={{
                height: '90px',
                backgroundColor: theme.palette.background.paper,
                border: `2px solid ${theme.palette.divider}`,
                borderRadius: '4px',
                borderBottom: `1px solid ${theme.palette.divider}`,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              <span className={styles.approvalTool}>
                <Typography fontSize="14px" fontWeight="500">
                  Approval tool
                </Typography>
                <Tooltip
                  placement="top"
                  title="Importing requires approval. After the pull request is approved, the repositories will be imported to the Catalog page."
                >
                  <span className={styles.approvalToolTooltip}>
                    <HelpIcon fontSize="small" />
                  </span>
                </Tooltip>
                <RadioGroup
                  id="approval-tool"
                  data-testid="approval-tool"
                  row
                  name="approvalTool"
                  value={values.approvalTool}
                  onChange={(_event, value: string) => {
                    setFieldValue('approvalTool', value);
                  }}
                >
                  <FormControlLabel
                    value="git"
                    control={<Radio />}
                    label="GitHub"
                  />
                  <FormControlLabel
                    value="gitlab"
                    control={<Radio />}
                    label="GitLab"
                  />
                </RadioGroup>
              </span>
            </Box>
          )}
          <AddRepositoriesTable title="Selected repositories" />
        </div>
        <br />
      </FormControl>
      <AddRepositoriesFormFooter />
      {openDrawer && (
        <PreviewFileSidebar
          open={openDrawer}
          onClose={closeDrawer}
          data={drawerData}
          repositoryType={values.repositoryType}
          handleSave={handleSave}
        />
      )}
    </>
  );
};
