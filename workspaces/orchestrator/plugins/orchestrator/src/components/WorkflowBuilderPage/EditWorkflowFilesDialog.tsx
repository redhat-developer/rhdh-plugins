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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  Button,
  ButtonIcon,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Flex,
  List,
  ListRow,
  Tooltip,
  TooltipTrigger,
} from '@backstage/ui';

import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';

import { useTranslation } from '../../hooks/useTranslation';
import styles from './EditWorkflowFilesDialog.module.css';
import { getBuilderFileName } from './starterFiles';
import type { WorkflowBuilderFiles } from './types';

const COPIED_TOOLTIP_MS = 5000;

type FileTabKey = keyof WorkflowBuilderFiles;

const FILE_TABS: FileTabKey[] = [
  'workflowYaml',
  'templateYaml',
  'inputSchemaJson',
  'outputSchemaJson',
];

export type EditWorkflowFilesDialogProps = {
  open: boolean;
  files: WorkflowBuilderFiles;
  workflowId: string;
  onClose: () => void;
};

/**
 * Story 1: view starter files. Copy / Download work for the active file.
 * Download ZIP + Apply changes are shown disabled (wired in later stories).
 */
export const EditWorkflowFilesDialog = ({
  open,
  files,
  workflowId,
  onClose,
}: EditWorkflowFilesDialogProps) => {
  const { t } = useTranslation();
  const [activeFile, setActiveFile] = useState<FileTabKey>('workflowYaml');
  const [copied, setCopied] = useState(false);
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);
  const copiedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileLabels = useMemo(
    () => ({
      workflowYaml: t('builder.files.workflow'),
      templateYaml: t('builder.files.template'),
      inputSchemaJson: t('builder.files.inputSchema'),
      outputSchemaJson: t('builder.files.outputSchema'),
    }),
    [t],
  );

  const activeContent =
    files[activeFile] || t('builder.files.emptyOutputSchema');
  const activeFileName = getBuilderFileName(activeFile, workflowId);

  const clearCopiedTimer = useCallback(() => {
    if (copiedResetRef.current) {
      clearTimeout(copiedResetRef.current);
      copiedResetRef.current = null;
    }
  }, []);

  useEffect(() => clearCopiedTimer, [clearCopiedTimer]);

  useEffect(() => {
    setCopied(false);
    setCopyTooltipOpen(false);
    clearCopiedTimer();
  }, [activeFile, clearCopiedTimer]);

  const handleCopy = useCallback(async () => {
    try {
      await window.navigator.clipboard.writeText(activeContent);
    } catch {
      return;
    }
    setCopied(true);
    setCopyTooltipOpen(true);
    clearCopiedTimer();
    copiedResetRef.current = setTimeout(() => {
      setCopied(false);
      setCopyTooltipOpen(false);
      copiedResetRef.current = null;
    }, COPIED_TOOLTIP_MS);
  }, [activeContent, clearCopiedTimer]);

  const handleCopyTooltipOpenChange = useCallback(
    (isTooltipOpen: boolean) => {
      // Keep "Copied" visible for the full duration; ignore hover-out closes.
      if (copied) {
        setCopyTooltipOpen(true);
        return;
      }
      setCopyTooltipOpen(isTooltipOpen);
    },
    [copied],
  );

  const handleDownload = useCallback(() => {
    const blob = new Blob([activeContent], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = activeFileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [activeContent, activeFileName]);

  if (!open) {
    return null;
  }

  return (
    <Dialog
      isOpen
      onOpenChange={isOpen => {
        if (!isOpen) {
          onClose();
        }
      }}
      width="min(800px, calc(100vw - 32px))"
      height="min(750px, calc(100vh - 64px))"
      data-testid="builder-edit-files-dialog"
    >
      <DialogHeader>{t('builder.files.dialogTitle')}</DialogHeader>
      <DialogBody>
        <div className={styles.body}>
          <div className={styles.fileList}>
            <List
              aria-label={t('builder.files.dialogTitle')}
              selectionMode="single"
              selectedKeys={[activeFile]}
              onSelectionChange={keys => {
                const selected = [...keys][0];
                if (typeof selected === 'string') {
                  setActiveFile(selected as FileTabKey);
                }
              }}
            >
              {FILE_TABS.map(key => (
                <ListRow
                  key={key}
                  id={key}
                  description={getBuilderFileName(key, workflowId)}
                  data-testid={`builder-file-tab-${key}`}
                >
                  {fileLabels[key]}
                </ListRow>
              ))}
            </List>
          </div>

          <div className={styles.previewColumn}>
            <Alert
              status="warning"
              icon
              title={t('builder.files.starterWarning')}
              data-testid="builder-files-starter-warning"
            />
            <div className={styles.previewBox}>
              <div className={styles.previewActions}>
                <TooltipTrigger
                  delay={0}
                  isOpen={copyTooltipOpen}
                  onOpenChange={handleCopyTooltipOpenChange}
                >
                  <ButtonIcon
                    variant="tertiary"
                    size="small"
                    icon={<ContentCopyIcon fontSize="small" />}
                    aria-label={
                      copied
                        ? t('builder.files.copied')
                        : t('builder.files.copy')
                    }
                    onClick={handleCopy}
                    data-testid="builder-files-copy"
                  />
                  <Tooltip>
                    {copied
                      ? t('builder.files.copied')
                      : t('builder.files.copy')}
                  </Tooltip>
                </TooltipTrigger>
                <TooltipTrigger>
                  <ButtonIcon
                    variant="tertiary"
                    size="small"
                    icon={<DownloadIcon fontSize="small" />}
                    aria-label={t('builder.files.download')}
                    onClick={handleDownload}
                    data-testid="builder-files-download"
                  />
                  <Tooltip>{t('builder.files.download')}</Tooltip>
                </TooltipTrigger>
              </div>
              <pre
                className={styles.previewContent}
                data-testid="builder-file-content"
              >
                {activeContent}
              </pre>
            </div>
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Flex
          style={{ width: '100%' }}
          align="center"
          justify="between"
          gap="2"
        >
          <Button
            variant="secondary"
            isDisabled
            data-testid="builder-files-download-zip"
          >
            {t('builder.files.downloadZip')}
          </Button>
          <Flex gap="2">
            <Button
              variant="secondary"
              onClick={onClose}
              data-testid="builder-files-close"
            >
              {t('common.close')}
            </Button>
            <Button
              variant="primary"
              isDisabled
              iconStart={<CodeIcon fontSize="small" />}
              data-testid="builder-files-apply"
            >
              {t('builder.files.applyChanges')}
            </Button>
          </Flex>
        </Flex>
      </DialogFooter>
    </Dialog>
  );
};
