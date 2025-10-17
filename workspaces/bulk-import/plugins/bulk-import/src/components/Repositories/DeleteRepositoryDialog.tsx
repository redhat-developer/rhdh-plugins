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
import { useGitlabConfigured } from '../../hooks';
import { useImportFlow } from '../../hooks/useImportFlow';
import { useTranslation } from '../../hooks/useTranslation';
import { AddRepositoryData } from '../../types';

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
  const { t } = useTranslation();
  const classes = useStyles();
  const bulkImportApi = useApi(bulkImportApiRef);
  const deleteRepository = (deleteRepo: AddRepositoryData) => {
    return bulkImportApi.deleteImportAction(
      deleteRepo.repoUrl || '',
      deleteRepo.defaultBranch || 'main',
      deleteRepo.approvalTool,
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
  const gitlabConfigured = useGitlabConfigured();

  const importFlow = useImportFlow();
  let deleteMsg;
  if (importFlow === 'scaffolder') {
    deleteMsg = t('repositories.removeRepositoryWarningScaffolder');
  } else {
    deleteMsg = gitlabConfigured
      ? t('repositories.removeRepositoryWarningGitlab')
      : t('repositories.removeRepositoryWarning');
  }

  return (
    <Dialog
      maxWidth="md"
      open={open}
      onClose={closeDialog}
      className={classes.dialogContainer}
    >
      <DialogTitle
        id="delete-repository"
        title={t('repositories.deleteRepository')}
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
            {t('repositories.removeRepositoryQuestion' as any, {
              repoName: repository.repoName || '',
              repositoryText: gitlabConfigured
                ? ''
                : t('repositories.repositoryText'),
            })}
          </Typography>

          <IconButton
            aria-label="close"
            onClick={closeDialog}
            title={t('common.close')}
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
        <Typography variant="body1">{`${deleteMsg}`}</Typography>
      </DialogContent>
      {(isUrlMissing || mutationDelete.isError) && (
        <Box maxWidth="650px" marginLeft="20px">
          <Alert severity="error">
            {isUrlMissing && t('repositories.cannotRemoveRepositoryUrl')}
            {mutationDelete.isError &&
              t('repositories.unableToRemoveRepository' as any, {
                error: String(mutationDelete.error),
              })}
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
          {mutationDelete.isLoading
            ? t('repositories.removing')
            : t('common.remove')}
        </Button>
        <Button
          variant="outlined"
          sx={{
            textTransform: 'none',
          }}
          onClick={() => closeDialog()}
        >
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteRepositoryDialog;
