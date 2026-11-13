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

import { styled } from '@mui/material/styles';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { AttachmentEdit } from '@patternfly/chatbot/dist/dynamic/AttachmentEdit';
import { PreviewAttachment } from '@patternfly/chatbot/dist/dynamic/PreviewAttachment';

import { ChatbotDisplayMode as IaDisplayMode } from '../const';
import { useLightspeedDrawerContext } from '../hooks/useLightspeedDrawerContext';
import { useTranslation } from '../hooks/useTranslation';
import { ensureMonacoEditorWorkerEnvironment } from '../monacoEditorWorkerEnvironment';
import { useFileAttachmentContext } from './AttachmentContext';
import {
  AttachmentScopedCodeModal,
  type ModalUserEvent,
} from './AttachmentScopedCodeModal';

ensureMonacoEditorWorkerEnvironment();

const MODAL_FOOTER_CLASS = 'ia-attachment-modal-footer';

const AttachmentScope = styled('div')({
  [`& .${MODAL_FOOTER_CLASS} > button`]: {
    width: '12% !important',
  },
});

type AttachmentProps = {
  appendTo?: () => HTMLElement;
};

const Attachment = ({ appendTo }: AttachmentProps) => {
  const { displayMode } = useLightspeedDrawerContext();
  const scopeToChatShell =
    (displayMode === IaDisplayMode.default ||
      displayMode === IaDisplayMode.docked) &&
    Boolean(appendTo);

  const {
    currentFileContent,
    setFileContents,
    modalState,
    setCurrentFileContent,
  } = useFileAttachmentContext();
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

  const openEdit = () => {
    setIsPreviewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const dismissAttachment = () => {
    setCurrentFileContent(undefined);
    setIsPreviewModalOpen(false);
  };

  const persistEditedContent = (content: string) => {
    setCurrentFileContent({ ...currentFileContent, content });
    setFileContents(prev => {
      const index = prev.findIndex(f => f.name === currentFileContent.name);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], content };
        return updated;
      }
      return [
        ...prev,
        {
          name: currentFileContent.name,
          type: currentFileContent.type,
          content,
        },
      ];
    });
    setPreviewModalKey(k => k + 1);
    setIsEditModalOpen(false);
    setIsPreviewModalOpen(true);
  };

  const handleEditPrimaryAction = (
    _event: ModalUserEvent,
    content?: string,
  ) => {
    if (content !== undefined) {
      persistEditedContent(content);
    }
  };

  const fileCode = currentFileContent.content;
  const fileName = currentFileContent.name;

  return (
    <AttachmentScope>
      {scopeToChatShell && appendTo ? (
        <>
          <AttachmentScopedCodeModal
            key={previewModalKey}
            appendTo={appendTo}
            code={fileCode}
            fileName={fileName}
            isModalOpen={isPreviewModalOpen}
            isReadOnly
            isCopyEnabled
            isLineNumbersVisible={false}
            title={t('modal.title.preview')}
            primaryActionBtn={t('modal.edit')}
            secondaryActionBtn={t('modal.close')}
            modalFooterClassName={MODAL_FOOTER_CLASS}
            codeEditorControlClassName="pf-chatbot__code-modal--controls"
            handleModalToggle={() => setIsPreviewModalOpen(false)}
            onPrimaryAction={() => openEdit()}
            onSecondaryAction={() => dismissAttachment()}
          />
          <AttachmentScopedCodeModal
            key={fileCode}
            appendTo={appendTo}
            code={fileCode}
            fileName={fileName}
            isModalOpen={isEditModalOpen}
            isCopyEnabled
            isLineNumbersVisible={false}
            title={t('modal.title.edit')}
            primaryActionBtn={t('modal.save')}
            secondaryActionBtn={t('modal.cancel')}
            modalFooterClassName={MODAL_FOOTER_CLASS}
            codeEditorControlClassName="pf-chatbot__code-modal--controls"
            handleModalToggle={() => setIsEditModalOpen(false)}
            onPrimaryAction={handleEditPrimaryAction}
            onSecondaryAction={() => setCurrentFileContent(undefined)}
          />
        </>
      ) : (
        <>
          <PreviewAttachment
            key={previewModalKey}
            code={fileCode}
            fileName={fileName}
            isModalOpen={isPreviewModalOpen}
            secondaryActionButtonText={t('modal.close')}
            primaryActionButtonText={t('modal.edit')}
            title={t('modal.title.preview')}
            modalFooterClassName={MODAL_FOOTER_CLASS}
            onEdit={openEdit}
            onDismiss={dismissAttachment}
            handleModalToggle={() => setIsPreviewModalOpen(false)}
            displayMode={ChatbotDisplayMode.fullscreen}
          />
          <AttachmentEdit
            key={fileCode}
            code={fileCode}
            fileName={fileName}
            isModalOpen={isEditModalOpen}
            title={t('modal.title.edit')}
            secondaryActionButtonText={t('modal.cancel')}
            primaryActionButtonText={t('modal.save')}
            modalFooterClassName={MODAL_FOOTER_CLASS}
            onSave={(_event, content) => persistEditedContent(content)}
            onCancel={() => setCurrentFileContent(undefined)}
            handleModalToggle={() => setIsEditModalOpen(false)}
            displayMode={ChatbotDisplayMode.fullscreen}
          />
        </>
      )}
    </AttachmentScope>
  );
};

export default Attachment;
