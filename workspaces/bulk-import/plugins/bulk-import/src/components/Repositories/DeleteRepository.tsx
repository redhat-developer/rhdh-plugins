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

import Delete from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useTranslation } from '../../hooks/useTranslation';
import { AddRepositoryData } from '../../types';
import { useDeleteDialog } from '../DeleteDialogContext';

const DeleteRepository = ({ data }: { data: AddRepositoryData }) => {
  const { t } = useTranslation();
  const { setDeleteComponent, setOpenDialog } = useDeleteDialog();

  const openDialog = (dialogData: AddRepositoryData) => {
    setDeleteComponent(dialogData);
    setOpenDialog(true);
  };

  const tooltipMessage =
    data.source === 'location'
      ? t('common.remove')
      : t('repositories.removeTooltipDisabled');

  return (
    <Tooltip title={tooltipMessage}>
      <Typography component="span" data-testid="delete-repository">
        <IconButton
          color="inherit"
          onClick={() => openDialog(data)}
          aria-label={t('common.delete')}
          size="large"
          disabled={data.source !== 'location'}
        >
          <Delete />
        </IconButton>
      </Typography>
    </Tooltip>
  );
};

export default DeleteRepository;
