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

import React, { useMemo, useState, useCallback } from 'react';
import {
  Table,
  TableColumn,
  InfoCard,
  ResponseErrorPanel,
} from '@backstage/core-components';
import Typography from '@material-ui/core/Typography';
import { BasePage } from '../../components/BasePage';
import { PageLayout } from '../../components/PageLayout';
import { Filters } from './components/Filters';
import { Divider } from '@material-ui/core';
import { PageHeader } from './components/PageHeader';
import { TableToolbar } from './components/TableToolbar';
import BlackSvgIcon from './components/black-csv-icon.svg';
import { useApi } from '@backstage/core-plugin-api';
import { optimizationsApiRef } from '../../apis';
import useAsync from 'react-use/lib/useAsync';
import { CURRENCY_SYMBOLS } from '../../constants/currencies';

const formatCurrency = (value: number, currencyCode: string): string => {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface ProjectCost {
  id: string;
  projectName: string;
  cost: number;
  costPercentage: number;
  monthOverMonthChange: number;
  monthOverMonthValue: number;
  includesOverhead: boolean;
  previousPeriodCost: number;
}

/** @public */
export function OpenShiftPage() {
  const api = useApi(optimizationsApiRef);
  const [groupBy, setGroupBy] = useState('project');
  const [overheadDistribution, setOverheadDistribution] =
    useState('distribute');
  const [timeRange, setTimeRange] = useState('month-to-date');
  const [currency, setCurrency] = useState('USD');
  const [filterBy, setFilterBy] = useState('project');
  const [filterOperation, setFilterOperation] = useState('includes');
  const [filterValue, setFilterValue] = useState('');
  const [showPlatformSum, setShowPlatformSum] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedTagKey, setSelectedTagKey] = useState<string>('');
  const [selectedTagValue, setSelectedTagValue] = useState<string>('');

  // Fetch tags on first load
  useAsync(async () => {
    try {
      const timeScopeValue = timeRange === 'month-to-date' ? -1 : -2;
      const response = await api.getOpenShiftTags(timeScopeValue);
      const tagsData = await response.json();
      setTags(tagsData.data || []);
    } catch {
      // Silently fail if tags can't be loaded
      setTags([]);
    }
  }, [api, timeRange]);

  const {
    value: costData,
    loading,
    error,
  } = useAsync(async () => {
    // Don't make API call if groupBy is 'tag' but no tag is selected
    if (groupBy === 'tag' && !selectedTag) {
      return null;
    }

    try {
      let groupByParam: string;
      if (groupBy === 'tag') {
        groupByParam = `group_by[tag:${selectedTag}]`;
      } else {
        groupByParam = `group_by[${groupBy}]`;
      }

      let deltaParam = 'cost';
      if (groupBy === 'project' && overheadDistribution === 'distribute') {
        deltaParam = 'distributed_cost';
      }

      const timeScopeValue = timeRange === 'month-to-date' ? -1 : -2;
      const timeScopeUnits = 'month';

      const offset = currentPage * pageSize;
      const queryParams: Record<string, string | number> = {
        currency,
        delta: deltaParam,
        'filter[limit]': pageSize,
        'filter[offset]': offset,
        'filter[resolution]': 'monthly',
        'filter[time_scope_units]': timeScopeUnits,
        'filter[time_scope_value]': timeScopeValue,
      };

      // Add category parameter when showPlatformSum is enabled
      if (showPlatformSum) {
        queryParams.category = 'Platform';
      }

      queryParams[groupByParam] = '*';

      // Handle filtering based on operation (includes/excludes)
      if (filterBy === 'tag' && selectedTagKey && selectedTagValue) {
        // Tag filtering uses filter[tag:key] or exclude[tag:key]
        if (filterOperation === 'excludes') {
          queryParams[`exclude[tag:${selectedTagKey}]`] = selectedTagValue;
        } else {
          queryParams[`filter[tag:${selectedTagKey}]`] = selectedTagValue;
        }
      } else if (filterValue) {
        // Regular filtering uses filter[field] or exclude[field]
        if (filterOperation === 'excludes') {
          queryParams[`exclude[${filterBy}]`] = filterValue;
        } else {
          queryParams[`filter[${filterBy}]`] = filterValue;
        }
      }

      if (sortField) {
        let apiSortField: string;
        if (sortField === 'cost') {
          apiSortField = deltaParam;
        } else if (sortField === 'projectName') {
          apiSortField = groupBy;
        } else {
          apiSortField = deltaParam;
        }
        const orderByParam = `order_by[${apiSortField}]`;
        queryParams[orderByParam] = sortDirection;
      } else {
        const orderByParam = `order_by[${deltaParam}]`;
        queryParams[orderByParam] = 'desc';
      }

      const response = await api.getCostManagementReport({
        query: queryParams,
      });
      return response.json();
    } catch {
      return null;
    }
  }, [
    currency,
    overheadDistribution,
    timeRange,
    groupBy,
    filterBy,
    filterValue,
    filterOperation,
    showPlatformSum,
    api,
    currentPage,
    pageSize,
    sortField,
    sortDirection,
    selectedTag,
    selectedTagKey,
    selectedTagValue,
  ]);

  const displayData = useMemo(() => {
    // If costData is null, return empty structure to keep table visible during loading
    if (!costData) {
      const today = new Date();
      const month =
        timeRange === 'previous-month'
          ? new Date(
              today.getFullYear(),
              today.getMonth() - 1,
              1,
            ).toLocaleString('en-US', { month: 'long' })
          : today.toLocaleString('en-US', { month: 'long' });
      const endDate =
        timeRange === 'previous-month'
          ? new Date(today.getFullYear(), today.getMonth(), 0)
              .getDate()
              .toString()
          : today.getDate().toString();

      return {
        totalCost: 0,
        month,
        endDate,
        currencyCode: currency,
        projects: [],
      };
    }

    const arrayKey = `${groupBy}s` as keyof (typeof costData.data)[0];
    const groupedArray = costData.data?.[0]?.[arrayKey] as
      | Array<{ [key: string]: unknown; values: unknown[] }>
      | undefined;

    const projects =
      groupedArray?.map((item, index) => {
        const value =
          (item.values?.[0] as {
            cost?: {
              distributed?: { value?: number };
              total?: { value?: number };
              network_unattributed_distributed?: { value?: number };
              worker_unallocated_distributed?: { value?: number };
              platform_distributed?: { value?: number };
              storage_unattributed_distributed?: { value?: number };
            };
            delta_percent?: number;
            delta_value?: number;
          }) || {};

        const nameField = groupBy as keyof typeof item;
        const itemName = (item[nameField] as string) || 'Unknown';

        const costField =
          groupBy === 'project' && overheadDistribution === 'distribute'
            ? 'distributed'
            : 'total';
        const costValue =
          value?.cost?.[costField as keyof typeof value.cost]?.value || 0;

        const deltaPercent = value?.delta_percent || 0;
        const deltaValue = value?.delta_value || 0;

        return {
          id: `${index}`,
          projectName: itemName,
          cost: costValue,
          costPercentage: 0,
          monthOverMonthChange: deltaPercent,
          monthOverMonthValue: Math.abs(deltaValue),
          includesOverhead:
            value?.cost?.network_unattributed_distributed?.value !== 0 ||
            value?.cost?.worker_unallocated_distributed?.value !== 0 ||
            value?.cost?.platform_distributed?.value !== 0 ||
            value?.cost?.storage_unattributed_distributed?.value !== 0,
          previousPeriodCost: costValue + Math.abs(deltaValue),
        };
      }) || [];

    const totalCost = costData.meta?.total?.cost?.distributed?.value || 0;

    const currencyCode = costData.meta?.currency || currency;

    const projectsWithPercentage = projects.map(p => ({
      ...p,
      costPercentage: totalCost > 0 ? (p.cost / totalCost) * 100 : 0,
    }));

    let month: string;
    let endDate: string;

    if (timeRange === 'previous-month') {
      const today = new Date();
      const previousMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1,
      );
      month = previousMonth.toLocaleString('en-US', { month: 'long' });
      const lastDayOfPreviousMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        0,
      ).getDate();
      endDate = lastDayOfPreviousMonth.toString();
    } else {
      const today = new Date();
      month = today.toLocaleString('en-US', { month: 'long' });
      endDate = today.getDate().toString();
    }

    return {
      totalCost,
      month,
      endDate,
      currencyCode,
      projects: projectsWithPercentage,
    };
  }, [costData, currency, groupBy, overheadDistribution, timeRange]);

  const handleRowSelect = useCallback(
    (rowId: string, isSelected: boolean) => {
      const newSelectedRows = new Set(selectedRows);
      if (isSelected) {
        newSelectedRows.add(rowId);
      } else {
        newSelectedRows.delete(rowId);
      }
      setSelectedRows(newSelectedRows);
    },
    [selectedRows],
  );

  const handleSelectAll = useCallback(
    (isSelected: boolean) => {
      if (isSelected && displayData) {
        setSelectedRows(
          new Set(displayData.projects.map(project => project.id)),
        );
      } else {
        setSelectedRows(new Set());
      }
    },
    [displayData],
  );

  const handlePageChange = useCallback((page: number, newPageSize: number) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  }, []);

  const handleRowsPerPageChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(0);
  }, []);

  const totalCount = costData?.meta?.count || 0;

  const isAllSelected =
    displayData !== null &&
    selectedRows.size === displayData.projects.length &&
    displayData.projects.length > 0;
  const isIndeterminate =
    displayData !== null &&
    selectedRows.size > 0 &&
    selectedRows.size < displayData.projects.length;

  const columns = useMemo<TableColumn<ProjectCost>[]>(
    () => [
      {
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '18px',
                height: '18px',
              }}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={input => {
                  if (input) input.indeterminate = isIndeterminate;
                }}
                onChange={e => {
                  e.stopPropagation();
                  handleSelectAll(e.target.checked);
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                }}
              />
            </div>

            <Typography variant="body2" style={{ fontWeight: 'bold' }}>
              {groupBy.charAt(0).toLocaleUpperCase('en-US') + groupBy.slice(1)}{' '}
              name
            </Typography>
          </div>
        ),
        field: 'projectName',
        render: data => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selectedRows.has(data.id)}
              onChange={e => handleRowSelect(data.id, e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
              }}
            />
            <Typography variant="body2">{data.projectName}</Typography>
            {data.includesOverhead && (
              <Typography
                variant="caption"
                style={{
                  padding: '2px 6px',
                  backgroundColor: '#F5F5F5',
                  border: '1px solid #D2D2D2',
                  borderRadius: '16px',
                  color: 'black',
                }}
              >
                Includes overhead
              </Typography>
            )}
          </div>
        ),
      },
      {
        title: 'Month over month change',
        field: 'monthOverMonthChange',
        sorting: false,
        render: data => (
          <div>
            <div
              style={{
                color: data.monthOverMonthChange > 0 ? '#d32f2f' : '#2e7d32',
              }}
            >
              {Math.abs(data.monthOverMonthChange).toFixed(2)}%
              {data.monthOverMonthChange > 0 ? ' ▲' : ' ▼'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              {formatCurrency(
                data.monthOverMonthValue,
                displayData?.currencyCode || '',
              )}{' '}
              for January 1-11
            </div>
          </div>
        ),
      },
      {
        title: 'Cost',
        field: 'cost',
        render: data => (
          <div>
            <div>
              {formatCurrency(data.cost, displayData?.currencyCode || '')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              {data.costPercentage.toFixed(2)}% of cost
            </div>
          </div>
        ),
      },
      {
        title: 'Actions',
        field: 'actions',
        sorting: false,
        render: () => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <img src={BlackSvgIcon} alt="CSV" style={{ cursor: 'pointer' }} />
          </div>
        ),
      },
    ],
    [
      handleRowSelect,
      isAllSelected,
      isIndeterminate,
      selectedRows,
      handleSelectAll,
      displayData?.currencyCode,
      groupBy,
    ],
  );

  const handleOrderChange = useCallback(
    (orderBy: number, orderDirection: 'asc' | 'desc') => {
      // If orderBy is -1, it means "no sorting" - ignore it to prevent removing sorting
      if (orderBy === -1) {
        return;
      }

      const column = columns[orderBy];
      if (
        column?.field &&
        column.field !== 'actions' &&
        column.sorting !== false
      ) {
        const newField = column.field as string;
        setSortField(newField);
        setSortDirection(orderDirection);

        setCurrentPage(0);
      }
    },
    [columns],
  );

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <BasePage pageTitle="" withContentPadding>
      <PageHeader
        totalCost={displayData.totalCost}
        month={displayData.month}
        endDate={displayData.endDate}
        currencyCode={displayData.currencyCode}
        customStyle={{ marginTop: '-24px' }}
      />

      <Divider
        style={{
          marginBottom: 24,
          marginLeft: '-24px',
          marginRight: '-24px',
          width: 'calc(100% + 48px)',
        }}
      />

      <PageLayout>
        <PageLayout.Filters>
          <Filters
            groupBy={groupBy}
            overheadDistribution={overheadDistribution}
            timeRange={timeRange}
            currency={currency}
            filterBy={filterBy}
            filterOperation={filterOperation}
            filterValue={filterValue}
            tags={tags}
            onGroupByChange={value => {
              setGroupBy(value);
              setCurrentPage(0);
              if (value !== 'tag') {
                setSelectedTag('');
              }
              // Reset showPlatformSum when groupBy changes away from 'project'
              if (value !== 'project') {
                setShowPlatformSum(false);
              }
            }}
            selectedTag={selectedTag}
            onSelectedTagChange={value => {
              setSelectedTag(value);
              setCurrentPage(0);
            }}
            onOverheadDistributionChange={value => {
              setOverheadDistribution(value);
              setCurrentPage(0);
            }}
            onTimeRangeChange={value => {
              setTimeRange(value);
              setCurrentPage(0);
            }}
            onCurrencyChange={value => {
              setCurrency(value);
              setCurrentPage(0);
            }}
            onFilterByChange={value => {
              setFilterBy(value);
              setCurrentPage(0);
              // Clear tag-related selections when filterBy changes away from 'tag'
              if (value !== 'tag') {
                setSelectedTagKey('');
                setSelectedTagValue('');
              }
            }}
            onFilterOperationChange={value => {
              setFilterOperation(value);
              setCurrentPage(0);
            }}
            onFilterValueChange={value => {
              setFilterValue(value);
              setCurrentPage(0);
            }}
            selectedTagKey={selectedTagKey}
            selectedTagValue={selectedTagValue}
            onSelectedTagKeyChange={value => {
              setSelectedTagKey(value);
              setSelectedTagValue('');
              setCurrentPage(0);
            }}
            onSelectedTagValueChange={value => {
              setSelectedTagValue(value);
              setCurrentPage(0);
            }}
          />
        </PageLayout.Filters>
        <PageLayout.Table>
          <div style={{ flex: 1 }}>
            <InfoCard>
              <Table<ProjectCost>
                data={displayData?.projects || []}
                isLoading={loading}
                components={{
                  Toolbar: () => (
                    <TableToolbar
                      showPlatformSum={showPlatformSum}
                      setShowPlatformSum={setShowPlatformSum}
                      projectsCount={displayData?.projects?.length || 0}
                      groupBy={groupBy}
                    />
                  ),
                }}
                columns={columns}
                options={{
                  paging: true,
                  pageSize: pageSize,
                  pageSizeOptions: [5, 10, 25, 50],
                  search: false,
                  sorting: true,
                  padding: 'dense',
                  thirdSortClick: false,
                }}
                totalCount={totalCount}
                page={currentPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                onOrderChange={handleOrderChange}
                style={{ outline: 'none' }}
                localization={{
                  pagination: {
                    labelRowsPerPage: 'rows',
                  },
                }}
              />
            </InfoCard>
          </div>
        </PageLayout.Table>
      </PageLayout>
    </BasePage>
  );
}
OpenShiftPage.displayName = 'OpenShiftPage';
