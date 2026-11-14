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

import {
  useCallback,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';

import {
  Box,
  Flex,
  Select,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  TextAreaField,
  TextField,
} from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';
import {
  DEFAULT_WORKFLOW_SPEC_VERSION,
  type WorkflowBuilderIdentity,
} from './types';
import styles from './WorkflowBuilderSidePanel.module.css';

/** Matches prototype side-panel width. */
export const SIDE_PANEL_MIN_WIDTH = 420;
export const SIDE_PANEL_DEFAULT_WIDTH = 420;
export const SIDE_PANEL_MAX_WIDTH = 760;
const SIDE_PANEL_RESIZE_STEP = 16;

export type WorkflowBuilderSidePanelProps = {
  identity: WorkflowBuilderIdentity;
  onIdentityChange: (next: WorkflowBuilderIdentity) => void;
  width: number;
  onWidthChange: (width: number) => void;
};

/**
 * Identity / Workflow side panel using BUI fields (label, description, size).
 *
 * BUI TextField/Select ship with `border: none` + filled backgrounds. The
 * prototype needs transparent fields with a visible outline, so Identity
 * controls are wrapped with a scoped CSS module (not global BUI overrides).
 */
export const WorkflowBuilderSidePanel = ({
  identity,
  onIdentityChange,
  width,
  onWidthChange,
}: WorkflowBuilderSidePanelProps) => {
  const { t } = useTranslation();
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const update = (patch: Partial<WorkflowBuilderIdentity>) => {
    onIdentityChange({ ...identity, ...patch });
  };

  const clampWidth = useCallback(
    (next: number) =>
      Math.min(SIDE_PANEL_MAX_WIDTH, Math.max(SIDE_PANEL_MIN_WIDTH, next)),
    [],
  );

  const onResizeMouseDown = useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault();
      dragRef.current = { startX: event.clientX, startWidth: width };

      const onMove = (moveEvent: MouseEvent) => {
        if (!dragRef.current) {
          return;
        }
        const delta = dragRef.current.startX - moveEvent.clientX;
        onWidthChange(clampWidth(dragRef.current.startWidth + delta));
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [clampWidth, onWidthChange, width],
  );

  const onResizeKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      // Horizontal slider: Right/Up increase value, Left/Down decrease (WAI-ARIA).
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        onWidthChange(clampWidth(width + SIDE_PANEL_RESIZE_STEP));
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        onWidthChange(clampWidth(width - SIDE_PANEL_RESIZE_STEP));
      } else if (event.key === 'Home') {
        event.preventDefault();
        onWidthChange(SIDE_PANEL_MIN_WIDTH);
      } else if (event.key === 'End') {
        event.preventDefault();
        onWidthChange(SIDE_PANEL_MAX_WIDTH);
      }
    },
    [clampWidth, onWidthChange, width],
  );

  return (
    <Box
      width={`${width}px`}
      position="relative"
      className={styles.panel}
      data-testid="workflow-builder-side-panel"
    >
      <div
        onMouseDown={onResizeMouseDown}
        onKeyDown={onResizeKeyDown}
        role="slider"
        tabIndex={0}
        aria-orientation="horizontal"
        aria-label={t('builder.sidePanel.resize')}
        aria-valuenow={width}
        aria-valuemin={SIDE_PANEL_MIN_WIDTH}
        aria-valuemax={SIDE_PANEL_MAX_WIDTH}
        data-testid="builder-side-panel-resize"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          marginLeft: -3,
          cursor: 'col-resize',
          zIndex: 2,
        }}
      />
      <Flex direction="column" style={{ flex: 1, minHeight: 0 }}>
        <Box p="4" pb="2">
          <Text variant="body-medium" weight="bold" as="span">
            {t('builder.sidePanel.workflow')}
          </Text>
        </Box>
        <Tabs selectedKey="identity" className={styles.tabs}>
          <TabList aria-label={t('builder.sidePanel.workflow')}>
            <Tab id="identity" data-testid="builder-tab-identity">
              {t('builder.sidePanel.tabs.identity')}
            </Tab>
            <Tab id="catalog" isDisabled>
              {t('builder.sidePanel.tabs.catalog')}
            </Tab>
            <Tab id="questions" isDisabled>
              {t('builder.sidePanel.tabs.questions')}
            </Tab>
            <Tab id="functions" isDisabled>
              {t('builder.sidePanel.tabs.functions')}
            </Tab>
          </TabList>
          <TabPanel id="identity">
            <Flex
              direction="column"
              gap="3"
              p="4"
              className={styles.outlinedFields}
            >
              <TextField
                label={t('builder.identity.name')}
                description={t('builder.identity.nameHelper')}
                value={identity.name}
                onChange={value => update({ name: value })}
                size="small"
                name="builder-identity-name"
                aria-label={t('builder.identity.name')}
                data-testid="builder-identity-name"
              />
              <TextAreaField
                label={t('builder.identity.description')}
                description={t('builder.identity.descriptionHelper')}
                value={identity.description}
                onChange={value => update({ description: value })}
                size="small"
                rows={3}
                name="builder-identity-description"
                aria-label={t('builder.identity.description')}
                data-testid="builder-identity-description"
              />
              <TextField
                label={t('builder.identity.workflowId')}
                description={t('builder.identity.workflowIdHelper')}
                value={identity.workflowId}
                onChange={value => update({ workflowId: value })}
                size="small"
                name="builder-identity-workflow-id"
                aria-label={t('builder.identity.workflowId')}
                data-testid="builder-identity-workflow-id"
              />
              <TextField
                label={t('builder.identity.version')}
                description={t('builder.identity.versionHelper')}
                value={identity.version}
                onChange={value => update({ version: value })}
                size="small"
                name="builder-identity-version"
                aria-label={t('builder.identity.version')}
                data-testid="builder-identity-version"
              />
              <Select
                label={t('builder.identity.specVersion')}
                description={t('builder.identity.specVersionHelper')}
                size="small"
                name="builder-identity-spec-version"
                aria-label={t('builder.identity.specVersion')}
                selectedKey={identity.specVersion}
                onSelectionChange={key => {
                  if (key !== null && key !== undefined) {
                    update({ specVersion: String(key) });
                  }
                }}
                options={[
                  {
                    id: DEFAULT_WORKFLOW_SPEC_VERSION,
                    label: DEFAULT_WORKFLOW_SPEC_VERSION,
                  },
                ]}
                data-testid="builder-identity-spec-version"
              />
            </Flex>
          </TabPanel>
        </Tabs>
      </Flex>
    </Box>
  );
};
