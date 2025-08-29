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

import { makeStyles } from '@material-ui/core';
import {
  AttachmentEdit,
  ChatbotDisplayMode,
  PreviewAttachment,
} from '@patternfly/chatbot';

import { useTranslation } from '../hooks/useTranslation';
import { useFileAttachmentContext } from './AttachmentContext';

const useStyles = makeStyles(() => ({
  modalFooter: {
    '&>button': {
      width: '12% !important',
    },
  },
}));
const Attachment = () => {
  const {
    currentFileContent,
    setFileContents,
    modalState,
    setCurrentFileContent,
  } = useFileAttachmentContext();
  const classes = useStyles();
  const { t } = useTranslation();

  if (!currentFileContent) {
    return null;
  }
  const {
    previewModalKey,
    isPreviewModalOpen,
    isEditModalOpen,
    setPreviewModalKey,
    setIsEditModalOpen,
    setIsPreviewModalOpen,
  } = modalState;

  return (
    <>
      <PreviewAttachment
        key={previewModalKey}
        code={currentFileContent?.content}
        fileName={currentFileContent?.name}
        isModalOpen={isPreviewModalOpen}
        secondaryActionButtonText={t('modal.close')}
        primaryActionButtonText={t('modal.edit')}
        title={t('modal.title.preview')}
        modalFooterClassName={classes.modalFooter}
        onEdit={() => {
          setIsPreviewModalOpen(false);
          setIsEditModalOpen(true);
        }}
        onDismiss={() => {
          setCurrentFileContent(undefined);
          setIsPreviewModalOpen(false);
        }}
        handleModalToggle={() => setIsPreviewModalOpen(false)}
        displayMode={ChatbotDisplayMode.fullscreen}
      />
      <AttachmentEdit
        key={currentFileContent?.content}
        code={currentFileContent?.content}
        fileName={currentFileContent?.name}
        isModalOpen={isEditModalOpen}
        title={t('modal.title.edit')}
        secondaryActionButtonText={t('modal.cancel')}
        primaryActionButtonText={t('modal.save')}
        modalFooterClassName={classes.modalFooter}
        onSave={(_, content) => {
          setCurrentFileContent({
            ...currentFileContent,
            content,
          });
          setFileContents(prev => {
            const existingIndex = prev.findIndex(
              f => f.name === currentFileContent?.name,
            );

            if (existingIndex !== -1) {
              // Update the existing file's content
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                content: content as string,
              };
              return updated;
            }

            // File doesn't exist, add a new one
            return [
              ...prev,
              {
                name: currentFileContent?.name,
                type: currentFileContent?.type,
                content: content as string,
              },
            ];
          });

          setPreviewModalKey(prev => prev + 1);
          setIsEditModalOpen(false);
          setIsPreviewModalOpen(true);
        }}
        onCancel={() => setCurrentFileContent(undefined)}
        handleModalToggle={() => setIsEditModalOpen(false)}
        displayMode={ChatbotDisplayMode.fullscreen}
      />
    </>
  );
};

export default Attachment;
