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
import { formatValue } from './kagentiDisplayUtils';

export interface ToolSpecSectionProps {
  detailLoading: boolean;
  detailError: string | null;
  spec: Record<string, unknown> | undefined;
  protocol?: string | null;
  framework?: string | null;
}

function dig(obj: unknown, ...path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function extractContainerImage(spec: Record<string, unknown>): string | undefined {
  const image = dig(spec, 'template', 'spec', 'containers', '0', 'image') as
    | string
    | undefined;
  if (image) return image;

  const containers = dig(spec, 'template', 'spec', 'containers') as
    | unknown[]
    | undefined;
  if (Array.isArray(containers) && containers.length > 0) {
    return (containers[0] as Record<string, unknown>)?.image as
      | string
      | undefined;
  }
  return undefined;
}

function extractEnvVars(
  spec: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const containers = dig(spec, 'template', 'spec', 'containers') as
    | unknown[]
    | undefined;
  if (!Array.isArray(containers) || containers.length === 0) return [];
  const env = (containers[0] as Record<string, unknown>)?.env;
  return Array.isArray(env)
    ? env.map(e =>
        typeof e === 'object' && e !== null ? (e as Record<string, unknown>) : {},
      )
    : [];
}

function extractPorts(
  spec: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const containers = dig(spec, 'template', 'spec', 'containers') as
    | unknown[]
    | undefined;
  if (!Array.isArray(containers) || containers.length === 0) return [];
  const ports = (containers[0] as Record<string, unknown>)?.ports;
  return Array.isArray(ports)
    ? ports.map(p =>
        typeof p === 'object' && p !== null ? (p as Record<string, unknown>) : {},
      )
    : [];
}

export function ToolSpecSection({
  detailLoading,
  detailError,
  spec,
  protocol,
  framework,
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

  const image = extractContainerImage(spec);
  const envVars = extractEnvVars(spec);
  const ports = extractPorts(spec);

  const summaryFields: Array<{ label: string; value: unknown }> = [
    { label: 'Protocol', value: protocol },
    { label: 'Framework', value: framework },
    { label: 'Image', value: image },
  ].filter(
    f => f.value !== undefined && f.value !== null && f.value !== '',
  );

  return (
    <>
      {summaryFields.length > 0 ? (
        summaryFields.map(f => (
          <PropertyRow
            key={f.label}
            label={f.label}
            value={formatValue(f.value)}
          />
        ))
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
          No deployment-level spec fields set.
        </Typography>
      )}
      <Box sx={{ mb: 1.25 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', fontWeight: 600 }}
        >
          Environment variables ({envVars.length})
        </Typography>
        {envVars.length > 0 ? (
          <Box component="ul" sx={{ m: 0, pl: 2, listStyle: 'disc' }}>
            {envVars.map((ev, i) => (
              <Typography
                component="li"
                variant="body2"
                key={i}
                sx={{ wordBreak: 'break-all', fontSize: '0.8rem' }}
              >
                <strong>{String(ev.name ?? '')}</strong>
                {ev.value ? ` = ${String(ev.value)}` : ''}
                {ev.value_from || ev.valueFrom
                  ? ` (ref: ${formatValue(ev.value_from ?? ev.valueFrom)})`
                  : ''}
              </Typography>
            ))}
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
          Container ports ({ports.length})
        </Typography>
        {ports.length > 0 ? (
          <Box component="ul" sx={{ m: 0, pl: 2, listStyle: 'disc' }}>
            {ports.map((p, i) => (
              <Typography
                component="li"
                variant="body2"
                key={i}
                sx={{ fontSize: '0.8rem' }}
              >
                {p.name ? `${String(p.name)}: ` : ''}
                {String(p.container_port ?? p.containerPort ?? '')}
                {p.protocol ? ` (${String(p.protocol)})` : ''}
              </Typography>
            ))}
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
