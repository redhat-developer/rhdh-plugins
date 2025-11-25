/* eslint-disable jsx-a11y/no-autofocus */
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
import type { FC, Dispatch, SetStateAction } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { isAfter, isBefore, isSameDay } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTranslation } from '../../hooks/useTranslation';

interface DateRangePickerProps {
  startDate: Date | null;
  setStartDate: Dispatch<SetStateAction<Date | null>>;
  endDate: Date | null;
  setEndDate: Dispatch<SetStateAction<Date | null>>;
}

const DateRangePicker: FC<DateRangePickerProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  const { t } = useTranslation();
  const handleDateChange = useCallback(
    (date: Date | null) => {
      if (!date) return;

      if (!startDate || (startDate && endDate)) {
        setStartDate(date);
        setEndDate(null);
      } else if (isBefore(date, startDate)) {
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    },
    [startDate, endDate, setStartDate, setEndDate],
  );

  const handleStartDateChange = useCallback(
    (date: Date | null) => {
      if (!date) return;

      if (date) {
        const year = date.getFullYear();
        if (year >= 1900 && year <= 2100) {
          if (endDate && isAfter(date, endDate)) {
            setEndDate(null);
          }
          setStartDate(date);
        }
      }
    },
    [endDate, setStartDate, setEndDate],
  );

  const handleEndDateChange = useCallback(
    (date: Date | null) => {
      if (!date) return;

      if (date) {
        const year = date.getFullYear();
        if (year >= 1900 && year <= 2100) {
          if (startDate && isBefore(date, startDate)) {
            setStartDate(null);
          }
          setEndDate(date);
        }
      }
    },
    [startDate, setStartDate, setEndDate],
  );

  const renderDay = (
    day: Date,
    _value: Date[],
    pickersDayProps: PickersDayProps<Date>,
  ) => {
    if (!startDate) return <PickersDay {...pickersDayProps} disableMargin />;

    const isStart = isSameDay(day, startDate);
    const isEnd = endDate && isSameDay(day, endDate);
    const inRange =
      startDate && endDate && isAfter(day, startDate) && isBefore(day, endDate);

    if (isStart || isEnd) {
      return (
        <PickersDay
          {...pickersDayProps}
          sx={{
            backgroundColor: theme => theme.palette.primary.main,
            color: theme => theme.palette.primary.contrastText,
            borderRadius: '50%',
            margin: 0,
            '&:focus': {
              backgroundColor: theme => theme.palette.primary.dark,
            },
          }}
        />
      );
    }

    if (inRange) {
      return (
        <PickersDay
          {...pickersDayProps}
          sx={{
            backgroundColor: theme => theme.palette.action.hover,
            borderRadius: 0,
            margin: 0,
          }}
        />
      );
    }

    return <PickersDay {...pickersDayProps} disableMargin />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h5" p={2} pb={0} fontWeight="400">
          {t('header.dateRange.title')}
        </Typography>
        <Divider sx={{ mt: 2 }} />
        <Grid
          container
          justifyContent="space-between"
          sx={{ width: '100%', margin: 'unset' }}
        >
          <Grid item xs={6} sx={{ padding: '16px 8px 16px 24px !important' }}>
            <DatePicker
              label={t('header.dateRange.startDate')}
              value={startDate}
              onChange={handleStartDateChange}
              renderInput={params => (
                <TextField
                  {...params}
                  sx={{ width: 172 }}
                  autoFocus={Boolean(!startDate)}
                />
              )}
              maxDate={new Date()}
              views={['day']}
            />
          </Grid>

          <Grid item xs={6} sx={{ padding: '16px 24px 16px 8px !important' }}>
            <DatePicker
              label={t('header.dateRange.endDate')}
              value={endDate}
              onChange={handleEndDateChange}
              renderInput={params => (
                <TextField
                  {...params}
                  sx={{ width: 172 }}
                  focused={Boolean(startDate && !endDate)}
                />
              )}
              maxDate={new Date()}
              views={['day']}
            />
          </Grid>
        </Grid>

        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          showDaysOutsideCurrentMonth
          maxDate={new Date()}
          views={['day']}
          renderInput={params => <TextField {...params} />}
          onChange={handleDateChange}
          value={null}
          renderDay={renderDay}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePicker;
