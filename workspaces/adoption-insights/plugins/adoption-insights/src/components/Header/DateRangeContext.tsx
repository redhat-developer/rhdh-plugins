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
import React, { createContext, useContext } from 'react';

interface DateRange {
  startDateRange: Date | null;
  endDateRange: Date | null;
  setStartDateRange: (date: Date | null) => void;
  setEndDateRange: (date: Date | null) => void;
}

export const DateRangeContext = createContext<DateRange | undefined>(
  undefined as any,
);

export const DateRangeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [startDateRange, setStartDateRange] = React.useState<Date | null>(null);
  const [endDateRange, setEndDateRange] = React.useState<Date | null>(null);

  const value = React.useMemo(
    () => ({
      startDateRange,
      endDateRange,
      setStartDateRange,
      setEndDateRange,
    }),
    [startDateRange, endDateRange],
  );

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
};

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }

  return context;
};
