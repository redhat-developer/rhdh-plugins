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

import { useApi } from '@backstage/core-plugin-api';

import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import createStyles from '@mui/styles/createStyles';
import { useMutation } from '@tanstack/react-query';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { AddRepositoryData } from '../../types';
import { gitlabFeatureFlag } from '../../utils/repository-utils';

const useStyles = makeStyles(() =>
  createStyles({
    dialogContainer: {
      height: '70%',
    },
    dialogTitle: {
      padding: '16px 20px',
    },
    warningIcon: {
      alignContent: 'center',
      marginTop: '7px',
      marginBottom: '-5px',
      color: '#F0AB00',
    },
  }),
);

const DeleteRepositoryDialog = ({
  open,
  closeDialog,
  repository,
}: {
  open: boolean;
  repository: AddRepositoryData;
  closeDialog: () => void;
}) => {
  const classes = useStyles();
  const bulkImportApi = useApi(bulkImportApiRef);
  const deleteRepository = (deleteRepo: AddRepositoryData) => {
    return bulkImportApi.deleteImportAction(
      deleteRepo.repoUrl || '',
      deleteRepo.defaultBranch || 'main',
    );
  };
  const mutationDelete = useMutation(deleteRepository, {
    onSuccess: () => {
      closeDialog();
    },
  });
  const handleClickRemove = async () => {
    mutationDelete.mutate(repository);
  };

  const isUrlMissing = !repository.repoUrl;

  return (
    <Dialog
      maxWidth="md"
      open={open}
      onClose={closeDialog}
      className={classes.dialogContainer}
    >
      <DialogTitle
        id="delete-repository"
        title="Delete Repository"
        className={classes.dialogTitle}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography component="span" style={{ fontWeight: 'bold' }}>
            <WarningIcon className={classes.warningIcon} color="warning" />{' '}
            {`Remove ${repository.repoName} ${gitlabFeatureFlag ? '' : 'repository'}?`}
          </Typography>

          <IconButton
            aria-label="close"
            onClick={closeDialog}
            title="Close"
            size="large"
            sx={{
              position: 'absolute',
              right: 1,
              top: 1,
              color: 'grey.700',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          {`Removing ${gitlabFeatureFlag ? 'it will' : 'a repository'} erases all associated information from the
          Catalog page.`}
        </Typography>
      </DialogContent>
      {(isUrlMissing || mutationDelete.isError) && (
        <Box maxWidth="650px" marginLeft="20px">
          <Alert severity="error">
            {isUrlMissing &&
              'Cannot remove repository as the repository URL is missing.'}
            {mutationDelete.isError &&
              `Unable to remove repository. ${mutationDelete.error}`}
          </Alert>
        </Box>
      )}
      <DialogActions style={{ justifyContent: 'left', padding: '20px' }}>
        <Button
          variant="contained"
          onClick={() => handleClickRemove()}
          disabled={
            isUrlMissing || mutationDelete.isLoading || mutationDelete.isError
          }
          startIcon={
            mutationDelete.isLoading && (
              <CircularProgress size="20px" color="inherit" />
            )
          }
          sx={{
            backgroundColor: '#C9190B',
            textTransform: 'none',
            color: theme =>
              theme.palette.getContrastText(theme.palette.error.main),
            '&:hover': {
              backgroundColor: 'error.dark',
            },
          }}
        >
          {mutationDelete.isLoading ? 'Removing...' : 'Remove'}
        </Button>
        <Button
          variant="outlined"
          sx={{
            textTransform: 'none',
          }}
          onClick={() => closeDialog()}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteRepositoryDialog;
