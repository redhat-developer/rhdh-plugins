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

import React from 'react';

import { useDrawer } from '@janus-idp/shared-react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import FormControl from '@mui/material/FormControl';
import { useFormikContext } from 'formik';
import { get } from 'lodash';

import { AddRepositoriesFormValues, PullRequestPreviewData } from '../../types';
import { PreviewFileSidebar } from '../PreviewFile/PreviewFileSidebar';
// import HelpIcon from '@mui/icons-material/HelpOutline';
// import FormControlLabel from '@mui/material/FormControlLabel';
// import Radio from '@mui/material/Radio';
// import RadioGroup from '@mui/material/RadioGroup';
// import Tooltip from '@mui/material/Tooltip';
// import Typography from '@mui/material/Typography';
// import { useFormikContext } from 'formik';
// import { AddRepositoriesFormValues } from '../../types';
import { AddRepositoriesFormFooter } from './AddRepositoriesFormFooter';
import { AddRepositoriesTable } from './AddRepositoriesTable';

// const useStyles = makeStyles(() => ({
//   // We would need this once the ServiceNow approval tool is incorporated in the plugin
//   approvalTool: {
//     display: 'flex',
//     flexDirection: 'row',
//     justifyContent: 'left',
//     alignItems: 'center',
//     paddingTop: '24px',
//     paddingBottom: '24px',
//     paddingLeft: '16px',
//     backgroundColor: theme.palette.background.paper,
//     borderBottomStyle: 'groove',
//     border: theme.palette.divider,
//   },
//   approvalToolTooltip: {
//     paddingTop: '4px',
//     paddingRight: '24px',
//     paddingLeft: '5px',
//   },
// }));

export const AddRepositories = ({ error }: { error: any }) => {
  const { openDrawer, setOpenDrawer, drawerData } = useDrawer();
  const { setFieldValue, values } =
    useFormikContext<AddRepositoriesFormValues>();

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
          {/* 
          // Enable this when ServiceNow approval tool is supported
          <span className={styles.approvalTool}>
            <Typography fontSize="16px" fontWeight="500">
              Approval tool
            </Typography>
            <Tooltip
              placement="top"
              title="When adding a new repository, it requires approval. Once the PR is approved or the ServiceNow ticket is closed, the repositories will be added to the Catalog page."
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
              <FormControlLabel value="git" control={<Radio />} label="Git" />
              <FormControlLabel
                value="servicenow"
                control={<Radio />}
                label="ServiceNow"
                disabled
              />
            </RadioGroup>
          </span> */}
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
