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

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRouteRef } from '@backstage/core-plugin-api';
import { Button, Menu, MenuItem, MenuTrigger } from '@backstage/ui';

import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useTranslation } from '../../hooks/useTranslation';
import { workflowBuilderRouteRef } from '../../routes';

export type CreateWorkflowMenuProps = {
  /** Optional; Story 2 will wire Import Local Files. */
  onImportLocalFiles?: () => void;
};

/**
 * Create dropdown on the Workflows list: Start from scratch / Import Local Files.
 */
export const CreateWorkflowMenu = ({
  onImportLocalFiles,
}: CreateWorkflowMenuProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const builderLink = useRouteRef(workflowBuilderRouteRef);

  const handleStartFromScratch = useCallback(() => {
    navigate(builderLink());
  }, [builderLink, navigate]);

  const handleImport = useCallback(() => {
    onImportLocalFiles?.();
  }, [onImportLocalFiles]);

  return (
    <MenuTrigger>
      <Button
        variant="primary"
        iconEnd={<ExpandMoreIcon fontSize="small" />}
        data-testid="create-workflow-menu-button"
      >
        {t('builder.create.button')}
      </Button>
      <Menu data-testid="create-workflow-menu">
        <MenuItem
          id="start-from-scratch"
          iconStart={<AccountTreeOutlinedIcon fontSize="small" />}
          onAction={handleStartFromScratch}
          data-testid="create-workflow-start-from-scratch"
        >
          {t('builder.create.startFromScratch')}
        </MenuItem>
        <MenuItem
          id="import-local-files"
          iconStart={<AttachFileIcon fontSize="small" />}
          // Story 2 wires Import Local Files; keep visible but disabled for now.
          isDisabled
          onAction={handleImport}
          data-testid="create-workflow-import-local-files"
        >
          {t('builder.create.importLocalFiles')}
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
};
