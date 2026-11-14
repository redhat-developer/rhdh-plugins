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

import { Button, Flex, Text } from '@backstage/ui';

import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';

import { useTranslation } from '../../hooks/useTranslation';
import type { WorkflowBuilderIdentity } from './types';
import styles from './WorkflowBuilderHeader.module.css';

export type WorkflowBuilderHeaderProps = {
  identity: WorkflowBuilderIdentity;
  onIdentityChange: (next: WorkflowBuilderIdentity) => void;
  onEditFiles: () => void;
  onClose: () => void;
};

/**
 * Page-context header (prototype / BUI):
 * icon | editable name + description | Edit workflow files | Close
 *
 * BUI `Button` / `Flex` / `Text` are used with public props only (no style overrides).
 */
export const WorkflowBuilderHeader = ({
  identity,
  onIdentityChange,
  onEditFiles,
  onClose,
}: WorkflowBuilderHeaderProps) => {
  const { t } = useTranslation();

  return (
    <Flex
      align="center"
      justify="between"
      gap="4"
      p="4"
      data-testid="workflow-builder-header"
    >
      <Flex align="center" gap="3" grow={1} style={{ minWidth: 0 }}>
        <AccountTreeOutlinedIcon
          color="primary"
          fontSize="medium"
          aria-hidden
        />
        <Flex direction="column" gap="2" grow={1} style={{ minWidth: 0 }}>
          <input
            value={identity.name}
            onChange={event =>
              onIdentityChange({ ...identity, name: event.target.value })
            }
            placeholder={t('builder.page.defaultTitle')}
            aria-label={t('builder.identity.name')}
            data-testid="builder-header-name"
            className={`${styles.headerField} ${styles.nameField}`}
          />
          <Text as="span" variant="body-small" color="secondary">
            <input
              value={identity.description}
              onChange={event =>
                onIdentityChange({
                  ...identity,
                  description: event.target.value,
                })
              }
              placeholder={t('builder.page.addDescriptionPlaceholder')}
              aria-label={t('builder.identity.description')}
              data-testid="builder-header-description"
              className={`${styles.headerField} ${styles.descriptionField}`}
            />
          </Text>
        </Flex>
      </Flex>

      <Flex align="center" gap="2" shrink={false}>
        <Button
          variant="tertiary"
          size="small"
          iconStart={<CodeIcon fontSize="small" />}
          onClick={onEditFiles}
          data-testid="builder-edit-workflow-files"
        >
          {t('builder.actions.editWorkflowFiles')}
        </Button>
        <Button
          variant="tertiary"
          size="small"
          iconStart={<CloseIcon fontSize="small" />}
          onClick={onClose}
          data-testid="builder-close"
        >
          {t('common.close')}
        </Button>
      </Flex>
    </Flex>
  );
};
