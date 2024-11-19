/*
 * Copyright 2024 The Backstage Authors
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
import React from 'react';
import ReactJson from 'react-json-view';

import { useTheme } from '@material-ui/core';

import { Paragraph } from './Paragraph';

interface ProcessVariablesViewerProps {
  variables?: object;
  emptyState?: React.ReactNode;
}

export const WorkflowVariablesViewer: React.FC<ProcessVariablesViewerProps> = ({
  variables = {},
  emptyState = <Paragraph>No data available</Paragraph>,
}) => {
  const theme = useTheme();

  return !variables ? (
    <>{emptyState}</>
  ) : (
    <ReactJson
      src={variables}
      name={false}
      theme={theme.palette.type === 'dark' ? 'monokai' : 'rjv-default'}
    />
  );
};
WorkflowVariablesViewer.displayName = 'WorkflowVariablesViewer';
