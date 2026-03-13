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
import MoreVert from '@material-ui/icons/MoreVert';
import DeleteIcon from '@material-ui/icons/Delete';
import PlaylistPlayIcon from '@material-ui/icons/PlaylistPlay';
import {
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  IconButton,
} from '@material-ui/core';
import { useTranslation } from '../../hooks/useTranslation';

export type ProjectActionsProps = {
  menuOpen: boolean;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  handleMenuClose: () => void;
  menuAnchorEl: HTMLElement | null;
  handleDeleteClick: () => void;
  handleRunAllClick: () => void;
  canRunAll: boolean;
  canDeleteProject: boolean;
};

export const ProjectActions = ({
  menuOpen,
  handleMenuOpen,
  handleMenuClose,
  menuAnchorEl,
  handleDeleteClick,
  handleRunAllClick,
  canRunAll,
  canDeleteProject,
}: ProjectActionsProps) => {
  const { t } = useTranslation();
  return (
    <>
      <Tooltip title={t('projectPage.actionsTooltip')}>
        <IconButton
          aria-label={t('projectPage.actionsTooltip')}
          aria-controls={menuOpen ? 'project-actions-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? 'true' : undefined}
          onClick={handleMenuOpen}
          color="inherit"
          size="small"
        >
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Menu
        id="project-actions-menu"
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleRunAllClick} disabled={!canRunAll}>
          <ListItemIcon>
            <PlaylistPlayIcon fontSize="small" />
          </ListItemIcon>
          {t('bulkRun.projectPageAction')}
        </MenuItem>

        <MenuItem onClick={handleDeleteClick} disabled={!canDeleteProject}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          {t('projectPage.deleteProject')}
        </MenuItem>
      </Menu>
    </>
  );
};
