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
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import type { AgentWizardFormData } from '../types';
import { validateAll } from '../validation';

interface ReviewStepProps {
  formData: AgentWizardFormData;
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <TableRow>
      <TableCell
        sx={{
          fontWeight: 600,
          width: 180,
          verticalAlign: 'top',
          border: 'none',
          py: 1,
        }}
      >
        {label}
      </TableCell>
      <TableCell sx={{ border: 'none', py: 1 }}>{value}</TableCell>
    </TableRow>
  );
}

export function ReviewStep({ formData }: ReviewStepProps) {
  const errors = validateAll(formData);
  const isReady = errors.length === 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Review and Create
      </Typography>

      {isReady ? (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          All required fields are configured. Ready to create the agent.
        </Alert>
      ) : (
        <Alert severity="warning" icon={<WarningIcon />}>
          {errors.length} validation issue(s) found. Go back and fix them before
          creating.
        </Alert>
      )}

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Identity
        </Typography>
        <Table size="small">
          <TableBody>
            <ReviewRow label="Name" value={formData.name || '—'} />
            <ReviewRow
              label="Key"
              value={
                formData.key ? (
                  <Chip label={formData.key} size="small" variant="outlined" />
                ) : (
                  '—'
                )
              }
            />
            <ReviewRow
              label="Role"
              value={
                <Chip
                  label={formData.role}
                  size="small"
                  color={
                    formData.role === 'router'
                      ? 'primary'
                      : formData.role === 'specialist'
                        ? 'secondary'
                        : 'default'
                  }
                />
              }
            />
            <ReviewRow
              label="Description"
              value={formData.description || '—'}
            />
          </TableBody>
        </Table>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Instructions
        </Typography>
        <Box
          sx={{
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 1,
            maxHeight: 120,
            overflow: 'auto',
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
          >
            {formData.instructions || '(none)'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Model
        </Typography>
        <Table size="small">
          <TableBody>
            <ReviewRow
              label="Model"
              value={formData.model || '(default)'}
            />
            <ReviewRow label="Temperature" value={formData.temperature} />
            <ReviewRow
              label="Max Tokens"
              value={formData.maxOutputTokens}
            />
            <ReviewRow label="Tool Choice" value={formData.toolChoice} />
            <ReviewRow
              label="Reasoning"
              value={formData.reasoningEffort}
            />
          </TableBody>
        </Table>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Tools and Capabilities
        </Typography>
        <Table size="small">
          <TableBody>
            <ReviewRow
              label="MCP Servers"
              value={
                formData.mcpServers.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {formData.mcpServers.map(s => (
                      <Chip key={s} label={s} size="small" />
                    ))}
                  </Box>
                ) : (
                  'None'
                )
              }
            />
            <ReviewRow
              label="RAG"
              value={formData.enableRAG ? 'Enabled' : 'Disabled'}
            />
            <ReviewRow
              label="Web Search"
              value={formData.enableWebSearch ? 'Enabled' : 'Disabled'}
            />
            <ReviewRow
              label="Code Interpreter"
              value={
                formData.enableCodeInterpreter ? 'Enabled' : 'Disabled'
              }
            />
          </TableBody>
        </Table>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Connections
        </Typography>
        <Table size="small">
          <TableBody>
            <ReviewRow
              label="Handoffs"
              value={
                formData.handoffs.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {formData.handoffs.map(h => (
                      <Chip
                        key={h}
                        label={h}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  'None'
                )
              }
            />
            <ReviewRow
              label="Delegations"
              value={
                formData.asTools.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {formData.asTools.map(a => (
                      <Chip
                        key={a}
                        label={a}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  'None'
                )
              }
            />
          </TableBody>
        </Table>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Guardrails
        </Typography>
        <Table size="small">
          <TableBody>
            <ReviewRow
              label="Shields"
              value={
                formData.guardrails.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {formData.guardrails.map(g => (
                      <Chip key={g} label={g} size="small" />
                    ))}
                  </Box>
                ) : (
                  'None'
                )
              }
            />
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
