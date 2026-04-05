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
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { PropertyRow } from './KagentiPropertyRow';
import { formatValue, readSpecField } from './kagentiDisplayUtils';

export interface ToolSpecSectionProps {
  detailLoading: boolean;
  detailError: string | null;
  spec: Record<string, unknown> | undefined;
}

export function ToolSpecSection({
  detailLoading,
  detailError,
  spec,
}: ToolSpecSectionProps): ReactNode {
  if (detailLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (detailError) {
    return <Alert severity="error">{detailError}</Alert>;
  }
  if (!spec || Object.keys(spec).length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No spec available.
      </Typography>
    );
  }

  const envVars = readSpecField(spec, 'envVars', 'env_vars') as
    | unknown[]
    | undefined;
  const servicePorts = readSpecField(spec, 'servicePorts', 'service_ports') as
    | unknown[]
    | undefined;
  const protocol = readSpecField(spec, 'protocol');
  const framework = readSpecField(spec, 'framework');
  const image =
    readSpecField(spec, 'containerImage', 'image', 'container_image') ??
    readSpecField(spec, 'image');
  const gitUrl = readSpecField(spec, 'gitUrl', 'git_url');
  const gitRevision = readSpecField(
    spec,
    'gitRevision',
    'git_revision',
    'gitBranch',
  );

  return (
    <>
      <PropertyRow label="Protocol" value={formatValue(protocol)} />
      <PropertyRow label="Framework" value={formatValue(framework)} />
      <PropertyRow label="Image" value={formatValue(image)} />
      <PropertyRow label="Git URL" value={formatValue(gitUrl)} />
      <PropertyRow label="Git revision" value={formatValue(gitRevision)} />
      <Box sx={{ mb: 1.25 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', fontWeight: 600 }}
        >
          Environment variables ({Array.isArray(envVars) ? envVars.length : 0})
        </Typography>
        {Array.isArray(envVars) && envVars.length > 0 ? (
          <Box component="ul" sx={{ m: 0, pl: 2, listStyle: 'disc' }}>
            {envVars.map((raw: unknown, i: number) => {
              const ev = (
                typeof raw === 'object' && raw !== null ? raw : {}
              ) as Record<string, unknown>;
              return (
                <Typography
                  component="li"
                  variant="body2"
                  key={i}
                  sx={{ wordBreak: 'break-all', fontSize: '0.8rem' }}
                >
                  <strong>{String(ev.name ?? '')}</strong>
                  {ev.value ? ` = ${String(ev.value)}` : ''}
                  {ev.valueFrom ? ` (ref: ${formatValue(ev.valueFrom)})` : ''}
                </Typography>
              );
            })}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        )}
      </Box>
      <Box sx={{ mb: 1.25 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', fontWeight: 600 }}
        >
          Service ports ({Array.isArray(servicePorts) ? servicePorts.length : 0}
          )
        </Typography>
        {Array.isArray(servicePorts) && servicePorts.length > 0 ? (
          <Box component="ul" sx={{ m: 0, pl: 2, listStyle: 'disc' }}>
            {servicePorts.map((raw: unknown, i: number) => {
              const sp = (
                typeof raw === 'object' && raw !== null ? raw : {}
              ) as Record<string, unknown>;
              return (
                <Typography
                  component="li"
                  variant="body2"
                  key={i}
                  sx={{ fontSize: '0.8rem' }}
                >
                  {sp.name ? `${String(sp.name)}: ` : ''}
                  {String(sp.port ?? '')}
                  {sp.targetPort ? ` \u2192 ${String(sp.targetPort)}` : ''}
                  {sp.protocol ? ` (${String(sp.protocol)})` : ''}
                </Typography>
              );
            })}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        )}
      </Box>
    </>
  );
}
