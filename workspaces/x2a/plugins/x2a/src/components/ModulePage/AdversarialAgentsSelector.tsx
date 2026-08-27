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

import { useEffect, useState } from 'react';
import { Box, Chip, TextField, Typography } from '@material-ui/core';
import { Alert, Autocomplete } from '@material-ui/lab';
import type { AdversarialAgent } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { extractResponseError, isHttpSuccessResponse } from '../tools';

interface AdversarialAgentsSelectorProps {
  selectedAgentIds: string[];
  onSelectionChange: (agentIds: string[]) => void;
  onAgentsLoaded?: (agents: AdversarialAgent[]) => void;
  phase?: 'analyze' | 'migrate';
}

export const AdversarialAgentsSelector = ({
  selectedAgentIds,
  onSelectionChange,
  onAgentsLoaded,
  phase,
}: AdversarialAgentsSelectorProps) => {
  const [agents, setAgents] = useState<AdversarialAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = useClientService();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await client.adversarialAgentsGet({
          query: phase ? { phase } : {},
        });
        if (!isHttpSuccessResponse(response)) {
          const message = await extractResponseError(
            response,
            t('modulePage.phases.adversarialAgents.loadingError'),
          );
          setError(message);
          return;
        }
        const data = await response.json();
        const loaded: AdversarialAgent[] = data.agents || [];
        setAgents(loaded);
        onAgentsLoaded?.(loaded);
      } catch {
        setError(t('modulePage.phases.adversarialAgents.loadingError'));
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, [client, t, phase, onAgentsLoaded]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const selectedAgents = agents.filter(a => selectedAgentIds.includes(a.id));

  return (
    <Autocomplete
      multiple
      loading={loading}
      options={agents}
      value={selectedAgents}
      getOptionLabel={agent => agent.name}
      getOptionSelected={(option, value) => option.id === value.id}
      onChange={(_event, newValue) => {
        onSelectionChange(newValue.map(a => a.id));
      }}
      noOptionsText={t('modulePage.phases.adversarialAgents.noAgentsAvailable')}
      renderTags={(value, getTagProps) =>
        value.map((agent, index) => (
          <Chip
            key={agent.id}
            label={agent.name}
            size="small"
            {...getTagProps({ index })}
          />
        ))
      }
      renderOption={agent => (
        <Box display="flex" flexDirection="column">
          <Box display="flex" alignItems="center" style={{ gap: 6 }}>
            <Typography variant="body2">{agent.name}</Typography>
            {agent.critical && (
              <Chip
                label={t('adversarialAgentsPage.table.critical')}
                size="small"
                color="secondary"
              />
            )}
          </Box>
          {agent.prompt && (
            <Typography variant="caption" color="textSecondary">
              {agent.prompt.length > 120
                ? `${agent.prompt.substring(0, 120)}…`
                : agent.prompt}
            </Typography>
          )}
        </Box>
      )}
      renderInput={params => (
        <TextField
          {...params}
          label={t('modulePage.phases.adversarialAgents.title')}
          placeholder={
            selectedAgents.length === 0
              ? t('modulePage.phases.adversarialAgents.placeholder')
              : undefined
          }
          variant="outlined"
          size="small"
        />
      )}
    />
  );
};
