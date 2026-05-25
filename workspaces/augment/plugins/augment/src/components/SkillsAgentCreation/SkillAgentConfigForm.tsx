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

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export interface SkillAgentConfigFormProps {
  readonly runtimeId: string;
  readonly selectedSkills: string[];
  readonly onDeploy: (config: { name: string; systemPrompt: string }) => void;
  readonly deploying?: boolean;
}

export function SkillAgentConfigForm({
  runtimeId,
  selectedSkills,
  onDeploy,
  deploying,
}: SkillAgentConfigFormProps) {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    onDeploy({ name: name.trim(), systemPrompt: systemPrompt.trim() });
  }, [name, systemPrompt, onDeploy]);

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="h6">Agent Configuration</Typography>

      <TextField
        label="Agent Name"
        required
        fullWidth
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="my-skill-agent"
        size="small"
      />

      <TextField
        label="System Prompt"
        fullWidth
        multiline
        minRows={3}
        maxRows={8}
        value={systemPrompt}
        onChange={e => setSystemPrompt(e.target.value)}
        placeholder="Describe the agent's behavior..."
        size="small"
      />

      <TextField
        label="Runtime"
        fullWidth
        value={runtimeId}
        size="small"
        InputProps={{ readOnly: true }}
      />

      <TextField
        label="Selected Skills"
        fullWidth
        value={`${selectedSkills.length} skill${selectedSkills.length !== 1 ? 's' : ''} selected`}
        size="small"
        InputProps={{ readOnly: true }}
      />

      <Box pt={1}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!name.trim() || deploying}
        >
          {deploying ? 'Deploying...' : 'Deploy Agent'}
        </Button>
      </Box>
    </Box>
  );
}
