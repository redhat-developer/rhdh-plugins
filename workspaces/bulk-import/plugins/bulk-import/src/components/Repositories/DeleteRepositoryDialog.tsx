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
import {
  Alert,
  Button,
  ButtonIcon,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Flex,
  Text,
} from '@backstage/ui';

import { useMutation } from '@tanstack/react-query';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { useGitlabConfigured } from '../../hooks';
import { useImportFlow } from '../../hooks/useImportFlow';
import { useTranslation } from '../../hooks/useTranslation';
import { AddRepositoryData, ImportFlow } from '../../types';
import { BulkImportCloseIcon, BulkImportWarningIcon } from '../bulkImportIcons';

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
  if (importFlow === ImportFlow.Scaffolder) {
    deleteMsg = t('repositories.removeRepositoryWarningScaffolder');
  } else if (importFlow === ImportFlow.Orchestrator) {
    deleteMsg = t('repositories.removeRepositoryWarningOrchestrator');
  } else {
    deleteMsg = gitlabConfigured
      ? t('repositories.removeRepositoryWarningGitlab')
      : t('repositories.removeRepositoryWarning');
  }

  const dialogTitle = t('repositories.removeRepositoryQuestion' as any, {
    repoName: repository.repoName || '',
    repositoryText: gitlabConfigured ? '' : t('repositories.repositoryText'),
  });

  return (
    <Dialog
      isOpen={open}
      onOpenChange={isOpen => !isOpen && closeDialog()}
      width={720}
    >
      <DialogHeader
        id="delete-repository"
        style={{ padding: '16px 20px', position: 'relative' }}
      >
        <Flex align="center" gap="2" style={{ paddingRight: '40px' }}>
          <BulkImportWarningIcon size={14} />
          <Text style={{ fontWeight: 'bold' }}>{dialogTitle}</Text>
        </Flex>
        <ButtonIcon
          icon={<BulkImportCloseIcon size={14} />}
          aria-label={t('common.close')}
          variant="tertiary"
          onPress={closeDialog}
          style={{
            position: 'absolute',
            right: '8px',
            top: '8px',
          }}
        />
      </DialogHeader>
      <DialogBody style={{ padding: '0 20px' }}>
        <Text>{deleteMsg}</Text>
        {(isUrlMissing || mutationDelete.isError) && (
          <div style={{ maxWidth: '650px', marginTop: '16px' }}>
            <Alert
              status="danger"
              icon
              description={[
                isUrlMissing ? t('repositories.cannotRemoveRepositoryUrl') : '',
                mutationDelete.isError
                  ? t('repositories.unableToRemoveRepository' as any, {
                      error: String(mutationDelete.error),
                    })
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          </div>
        )}
      </DialogBody>
      <DialogFooter style={{ justifyContent: 'flex-start', padding: '20px' }}>
        <Flex gap="3" align="center">
          <Button
            variant="primary"
            onPress={handleClickRemove}
            isDisabled={
              isUrlMissing || mutationDelete.isLoading || mutationDelete.isError
            }
            isPending={mutationDelete.isLoading}
            style={{
              backgroundColor: '#C9190B',
            }}
          >
            {mutationDelete.isLoading
              ? t('repositories.removing')
              : t('common.remove')}
          </Button>
          <Button variant="secondary" onPress={closeDialog}>
            {t('common.cancel')}
          </Button>
        </Flex>
      </DialogFooter>
    </Dialog>
  );
};

export default DeleteRepositoryDialog;
