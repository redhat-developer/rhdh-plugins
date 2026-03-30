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

import { useState } from 'react';

import { makeStyles } from '@material-ui/core';
import {
  ChatbotFooter,
  ChatbotFootnote,
  MessageBar,
} from '@patternfly/chatbot';
import {
  Alert,
  Button,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  Tooltip,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';

import { UNTITLED_NOTEBOOK_NAME } from '../../const';
import { useTranslation } from '../../hooks/useTranslation';
import { SessionDocument } from '../../types';
import { DocumentSidebar } from './DocumentSidebar';
import { AddCircleFilledIcon, SidebarExpandIcon } from './SidebarCollapseIcon';
import { UploadResourceScreen } from './UploadResourceScreen';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
  },
  drawerContainer: {
    flex: 1,
    minHeight: 0,
  },
  expandStrip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: theme.spacing(1.5),
    gap: theme.spacing(1),
    borderRight: '1px solid var(--pf-t--global--border--color--default)',
  },
  addIconButton: {
    padding: 0,
    minWidth: 0,
    lineHeight: 1,
  },
  mainArea: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    minWidth: 0,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px`,
  },
  closeButton: {
    textTransform: 'none',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  drawerContentBody: {
    backgroundColor:
      'var(--pf-t--global--background--color--secondary--default)',
  },
  contentColumn: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 816,
    margin: '0 auto',
    padding: `0 ${theme.spacing(3)}px ${theme.spacing(1)}px`,
  },
}));

type NotebookViewProps = {
  notebookName?: string;
  documents?: SessionDocument[];
  onClose: () => void;
  onUploadClick: () => void;
  onAddDocument: () => void;
};

export const NotebookView = ({
  notebookName = UNTITLED_NOTEBOOK_NAME,
  documents = [],
  onClose,
  onUploadClick,
  onAddDocument,
}: NotebookViewProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const hasDocuments = documents.length > 0;

  const panelContent = (
    <DrawerPanelContent
      isResizable
      defaultSize="310px"
      minSize="232px"
      maxSize="50%"
      resizeAriaLabel={t('notebook.view.sidebar.resize')}
    >
      <DocumentSidebar
        notebookName={notebookName}
        documents={documents}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        onAddDocument={onAddDocument}
      />
    </DrawerPanelContent>
  );

  return (
    <div className={classes.root}>
      <Drawer
        isExpanded={!sidebarCollapsed}
        isInline
        position="start"
        className={classes.drawerContainer}
      >
        <DrawerContent
          panelContent={!sidebarCollapsed ? panelContent : undefined}
        >
          <DrawerContentBody className={classes.drawerContentBody}>
            <div className={classes.mainArea}>
              {sidebarCollapsed && (
                <div className={classes.expandStrip}>
                  <Tooltip
                    content={t('notebook.view.sidebar.expand')}
                    position="right"
                  >
                    <Button
                      variant="plain"
                      onClick={() => setSidebarCollapsed(false)}
                      aria-label={t('notebook.view.sidebar.expand')}
                      size="sm"
                    >
                      <SidebarExpandIcon />
                    </Button>
                  </Tooltip>
                  <Tooltip
                    content={t('notebook.view.documents.add')}
                    position="right"
                  >
                    <Button
                      variant="plain"
                      className={classes.addIconButton}
                      onClick={onAddDocument}
                      aria-label={t('notebook.view.documents.add')}
                    >
                      <AddCircleFilledIcon />
                    </Button>
                  </Tooltip>
                </div>
              )}

              <div className={classes.contentColumn}>
                <div className={classes.topBar}>
                  <Button
                    variant="link"
                    className={classes.closeButton}
                    onClick={onClose}
                    icon={<TimesIcon />}
                    iconPosition="end"
                  >
                    {t('notebook.view.close')}
                  </Button>
                </div>

                <div className={classes.mainContent}>
                  {!hasDocuments && (
                    <UploadResourceScreen onUploadClick={onUploadClick} />
                  )}
                </div>

                <div className={classes.alertContainer}>
                  <Alert isInline variant="info" title={t('aria.important')}>
                    {t('disclaimer.withoutValidation')}
                  </Alert>
                </div>

                <ChatbotFooter>
                  <MessageBar
                    hasAttachButton={false}
                    hasMicrophoneButton
                    hasStopButton={false}
                    onSendMessage={() => {}}
                    placeholder={t('notebook.view.input.placeholder')}
                  />
                  <ChatbotFootnote label={t('footer.accuracy.label')} />
                </ChatbotFooter>
              </div>
            </div>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
