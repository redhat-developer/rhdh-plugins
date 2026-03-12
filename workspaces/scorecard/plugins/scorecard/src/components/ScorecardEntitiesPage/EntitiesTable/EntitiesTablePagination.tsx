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

import type { MouseEvent } from 'react';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import LastPageIcon from '@mui/icons-material/LastPage';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';

import { useTranslation } from '../../../hooks/useTranslation';

export interface EntitiesTablePaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: MouseEvent<HTMLButtonElement>, newPage: number) => void;
}

export const EntitiesTablePagination = (
  props: EntitiesTablePaginationProps,
) => {
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';
  const { count, page, rowsPerPage, onPageChange } = props;

  const { t } = useTranslation();

  const handleFirstPageButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 1);
  };
  const handlePreviousPageButtonClick = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    onPageChange(event, Math.max(1, page - 1));
  };
  const handleNextPageButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };
  const handleLastPageButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(1, Math.ceil(count / rowsPerPage)));
  };

  return (
    <Box sx={{ flexShrink: 0 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 1}
        aria-label="first page"
      >
        {isRtl ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handlePreviousPageButtonClick}
        disabled={page === 1}
        aria-label="previous page"
      >
        {isRtl ? <KeyboardArrowRightIcon /> : <KeyboardArrowLeftIcon />}
      </IconButton>
      {count === 0 ? 0 : (page - 1) * rowsPerPage + 1}-
      {Math.min(page * rowsPerPage, count)}{' '}
      {t('entitiesPage.entitiesTableFooter.of')} {count}
      <IconButton
        onClick={handleNextPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage)}
        aria-label="next page"
      >
        {isRtl ? <KeyboardArrowLeftIcon /> : <KeyboardArrowRightIcon />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage)}
        aria-label="last page"
      >
        {isRtl ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
};
