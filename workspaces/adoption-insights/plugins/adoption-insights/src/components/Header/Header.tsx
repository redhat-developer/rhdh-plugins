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
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { FC, HTMLProps, MouseEvent } from 'react';

import { Header } from '@backstage/core-components';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import DateRangePicker from './DateRangePicker';
import { useDateRange } from './DateRangeContext';
import { DATE_RANGE_OPTIONS } from '../../utils/constants';
import { subDays } from 'date-fns';
import { formatDate } from '../../utils/utils';
import { getDateRange } from '../../utils/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useLanguage } from '../../hooks/useLanguage';

interface InsightsHeaderProps extends HTMLProps<HTMLDivElement> {
  title: string;
}

const InsightsHeader: FC<InsightsHeaderProps> = () => {
  const [selectedOption, setSelectedOption] = useState<string>('last-28-days');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();
  const locale = useLanguage();

  const {
    startDateRange,
    setStartDateRange,
    endDateRange,
    setEndDateRange,
    setIsDefaultDateRange,
  } = useDateRange();

  useEffect(() => {
    const today = new Date();
    setStartDateRange(subDays(today, 27));
    setEndDateRange(today);
  }, [setStartDateRange, setEndDateRange]);

  const handleChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const value = event.target.value;
      if (!value) return;

      const { startDate: newStartDate, endDate: newEndDate } =
        getDateRange(value);
      if (newStartDate && newEndDate) {
        setStartDateRange(new Date(newStartDate));
        setEndDateRange(new Date(newEndDate));
        setIsDefaultDateRange(false);
      }
      setStartDate(null);
      setEndDate(null);

      setSelectedOption(value);
    },
    [setStartDateRange, setEndDateRange, setIsDefaultDateRange],
  );

  const handleDateRangeClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDateRange = useCallback(() => {
    if (startDate && endDate) {
      setStartDateRange(startDate);
      setEndDateRange(endDate);
      setIsDefaultDateRange(false);
      setSelectedOption('dateRange');
      handleClose();
      setMenuOpen(false);
    }
  }, [
    startDate,
    endDate,
    setStartDateRange,
    setEndDateRange,
    handleClose,
    setIsDefaultDateRange,
  ]);

  const getLabel = useMemo(() => {
    return (value: string) => {
      if (value === 'dateRange' && startDateRange && endDateRange) {
        const startFormatted = formatDate(
          startDateRange,
          { year: 'numeric', month: 'short', day: 'numeric' },
          locale,
        );
        const endFormatted = formatDate(
          endDateRange,
          { year: 'numeric', month: 'short', day: 'numeric' },
          locale,
        );
        return `${startFormatted} - ${endFormatted}`;
      }

      const option = DATE_RANGE_OPTIONS.find(opt => opt.value === value);
      return option
        ? t(option.labelKey as any, {})
        : t('header.dateRange.defaultLabel');
    };
  }, [startDateRange, endDateRange, t, locale]);

  return (
    <Header title={t('header.title')} pageTitleOverride={t('header.title')}>
      <Select
        displayEmpty
        open={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
        value={selectedOption}
        onChange={handleChange}
        renderValue={(selected: string) => getLabel(selected)}
        sx={{
          minWidth: 190,
          marginRight: '10px',
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              minWidth: 190,
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
              border: theme => `1px solid ${theme.palette.grey[300]}`,
              overflow: 'hidden',
            },
            disableScrollLock: true,
          },
          MenuListProps: {
            autoFocusItem: false,
            sx: { display: 'block', flexDirection: 'column' },
          },
        }}
      >
        {DATE_RANGE_OPTIONS.map(option => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{ height: '52px' }}
          >
            {t(option.labelKey as any, {})}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          sx={{ height: '52px' }}
          onMouseDown={(event: MouseEvent<HTMLElement>) => {
            event.preventDefault();
            handleDateRangeClick(event);
          }}
        >
          {t('header.dateRange.dateRange')}
        </MenuItem>
      </Select>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)' },
          },
        }}
      >
        <DateRangePicker
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, m: 2 }}>
          <Button
            onClick={handleClose}
            color="primary"
            sx={{ textTransform: 'none' }}
          >
            {t('header.dateRange.cancel')}
          </Button>
          <Button
            onClick={handleDateRange}
            color="primary"
            disabled={!(startDate && endDate)}
          >
            {t('header.dateRange.ok')}
          </Button>
        </Box>
      </Popover>
    </Header>
  );
};

export default InsightsHeader;
