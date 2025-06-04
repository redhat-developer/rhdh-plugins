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

import { Link } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useFormikContext } from 'formik';

import {
  AddedRepositories,
  AddRepositoriesFormValues,
  ApprovalTool,
} from '../../types';
import { gitlabFeatureFlag } from '../../utils/repository-utils';

const sPad = (repositories: AddedRepositories) =>
  Object.keys(repositories || []).length > 1 ? 's' : '';

export const AddRepositoriesFormFooter = () => {
  const { values, handleSubmit, isSubmitting } =
    useFormikContext<AddRepositoriesFormValues>();

  const label = {
    [ApprovalTool.ServiceNow]: {
      submitTitle: `Create ServiceNow ticket${sPad(values.repositories)}`,
      toolTipTitle: `Catalog-info.yaml files must be generated before creating a ServiceNow ticket`,
    },
    [ApprovalTool.Gitlab]: {
      submitTitle: `Import`,
      toolTipTitle:
        'The Catalog-info.yaml files need to be generated for import.',
    },
    [ApprovalTool.Git]: {
      submitTitle: gitlabFeatureFlag
        ? 'Import'
        : `Create pull request${sPad(values.repositories)}`,
      toolTipTitle: gitlabFeatureFlag
        ? 'The Catalog-info.yaml files need to be generated for import.'
        : `Catalog-info.yaml files must be generated before creating a pull request`,
    },
  };

  const disableCreate =
    values.approvalTool === ApprovalTool.Gitlab ||
    !values.repositories ||
    Object.values(values.repositories).length === 0;

  const submitButton = (
    <Button
      variant="contained"
      color="primary"
      onClick={handleSubmit as any}
      sx={{ mr: 1 }}
      disabled={disableCreate || isSubmitting}
      startIcon={
        isSubmitting && <CircularProgress size="20px" color="inherit" />
      }
    >
      {label[values.approvalTool]?.submitTitle}
    </Button>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'left',
        position: 'fixed',
        bottom: 0,
        pt: 3,
        pb: 3,
        pl: 3,
        backgroundColor: theme =>
          theme.palette.mode === 'light'
            ? '#fff'
            : theme.palette.navigation.background,
        width: '100%',
        borderTopStyle: 'groove',
        borderColor: 'divider',
        zIndex: 1,
      }}
      data-testid="add-repository-footer"
    >
      {disableCreate ? (
        <Tooltip
          title={label[values.approvalTool]?.toolTipTitle}
          sx={{
            maxWidth: 'none',
          }}
        >
          <Typography component="span">{submitButton}</Typography>
        </Tooltip>
      ) : (
        submitButton
      )}
      <Link to="/bulk-import/repositories">
        <Button variant="outlined">Cancel</Button>
      </Link>
    </Box>
  );
};
