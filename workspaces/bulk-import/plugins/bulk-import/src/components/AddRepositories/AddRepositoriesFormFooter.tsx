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

import { Link } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { useFormikContext } from 'formik';

import {
  AddedRepositories,
  AddRepositoriesFormValues,
  ApprovalTool,
} from '../../types';

const sPad = (repositories: AddedRepositories) =>
  Object.keys(repositories || []).length > 1 ? 's' : '';

export const AddRepositoriesFormFooter = () => {
  const { values, handleSubmit, isSubmitting } =
    useFormikContext<AddRepositoriesFormValues>();
  const approvalToolTitle =
    (values.approvalTool === ApprovalTool.Git
      ? 'pull request'
      : 'ServiceNow ticket') + sPad(values.repositories);
  const submitTitle = `Create ${approvalToolTitle}`;

  const disableCreate =
    !values.repositories || Object.values(values.repositories).length === 0;

  const toolTipTitle = disableCreate
    ? `Catalog-info.yaml files must be generated before creating a ${approvalToolTitle}`
    : null;

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
      {submitTitle}
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
      {toolTipTitle ? (
        <Tooltip
          title={toolTipTitle}
          sx={{
            maxWidth: 'none',
          }}
        >
          <span>{submitButton}</span>
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
