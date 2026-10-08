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

import type { ReactNode } from 'react';

import Box from '@mui/material/Box';

import { DataSourcesDialog } from '../MetricGroupCard/DataSourcesDialog';
import { MetricGroupCardMenu } from '../MetricGroupCard/MetricGroupCardMenu';
import {
  useSparklineDataSources,
  type UseSparklineDataSourcesOptions,
} from '../../hooks/useSparklineDataSources';

export type SparklineDataSourcesProps = UseSparklineDataSourcesOptions & {
  title: string;
  extraInfo?: ReactNode;
};

export const SparklineDataSources = ({
  title,
  extraInfo,
  ...options
}: SparklineDataSourcesProps) => {
  const { isOpen, menuActions, menuAriaLabel, dialogProps } =
    useSparklineDataSources(options);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {extraInfo}
        <MetricGroupCardMenu ariaLabel={menuAriaLabel} actions={menuActions} />
      </Box>
      {isOpen && <DataSourcesDialog title={title} {...dialogProps} />}
    </>
  );
};
