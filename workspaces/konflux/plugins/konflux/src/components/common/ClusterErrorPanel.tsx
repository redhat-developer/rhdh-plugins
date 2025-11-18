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

import { WarningPanel } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { ClusterError } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Typography } from '@material-ui/core';

type ClusterErrorPanelProps = {
  errors: ClusterError[];
};

export const ClusterErrorPanel = ({ errors }: ClusterErrorPanelProps) => {
  const {
    entity: {
      metadata: { name: entityName },
    },
  } = useEntity();

  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <WarningPanel
      title="Failed to retrieve resources from all clusters"
      message={`Unable to fetch resources for entity: ${entityName}. All cluster requests failed.`}
    >
      <div>
        <Typography variant="body2" style={{ marginBottom: '8px' }}>
          Cluster Errors:
        </Typography>
        {errors.map((err: ClusterError, index) => {
          const errorMessage = err.message || 'Unknown error';
          const errorDetails = [
            err.cluster && `Cluster: ${err.cluster}`,
            err.namespace && `Namespace: ${err.namespace}`,
            err.errorType && `Type: ${err.errorType}`,
            err.statusCode && `Status: ${err.statusCode}`,
            err.source && `Source: ${err.source}`,
          ]
            .filter(Boolean)
            .join(' | ');

          return (
            <Typography
              variant="body2"
              key={`${err.cluster}-${err.namespace}-${index}`}
              style={{ marginBottom: '4px' }}
            >
              <strong>{errorMessage}</strong>
              {errorDetails && (
                <Typography
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    color: '#666',
                  }}
                >
                  {errorDetails}
                </Typography>
              )}
            </Typography>
          );
        })}
      </div>
    </WarningPanel>
  );
};
