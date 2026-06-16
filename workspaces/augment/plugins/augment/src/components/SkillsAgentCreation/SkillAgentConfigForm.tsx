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

import { useState, useCallback, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export interface SkillForDeploy {
  name: string;
  skillName?: string;
  slug?: string;
  gitPath?: string;
  pluginName?: string;
  body?: string;
  description?: string;
}

export interface SkillAgentConfigFormProps {
  readonly runtimeId: string;
  readonly selectedSkills: SkillForDeploy[];
  readonly onDeploy: (config: { name: string; systemPrompt: string }) => void;
  readonly deploying?: boolean;
}

function deriveAgentName(skills: SkillForDeploy[]): string {
  if (skills.length === 1) {
    return (skills[0].skillName ?? skills[0].name)
      .toLocaleLowerCase('en-US')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  const domain = skills[0]?.pluginName ?? 'multi';
  return `${domain}-agent`
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9-]/g, '-');
}

function deriveSystemPrompt(skills: SkillForDeploy[]): string {
  const names = skills.map(s => s.skillName ?? s.name).join(', ');
  return `You are a specialized AI agent with expertise in: ${names}. Use the load_skill tool to leverage your mounted skills when answering questions.`;
}

export function SkillAgentConfigForm({
  runtimeId,
  selectedSkills,
  onDeploy,
  deploying,
}: SkillAgentConfigFormProps) {
  const defaultName = useMemo(
    () => deriveAgentName(selectedSkills),
    [selectedSkills],
  );
  const defaultPrompt = useMemo(
    () => deriveSystemPrompt(selectedSkills),
    [selectedSkills],
  );

  const [name, setName] = useState(defaultName);
  const [systemPrompt, setSystemPrompt] = useState(defaultPrompt);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    setName(defaultName);
    setSystemPrompt(defaultPrompt);
  }, [defaultName, defaultPrompt]);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    onDeploy({ name: name.trim(), systemPrompt: systemPrompt.trim() });
  }, [name, systemPrompt, onDeploy]);

  const skillBodies = useMemo(
    () =>
      selectedSkills
        .filter(s => s.body?.trim())
        .map(s => ({
          name: s.skillName ?? s.name,
          body: s.body!.trim(),
        })),
    [selectedSkills],
  );

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        label="Agent Name"
        required
        fullWidth
        value={name}
        onChange={e => setName(e.target.value)}
        helperText="Lowercase, alphanumeric, and hyphens only"
        size="small"
      />

      <TextField
        label="System Prompt"
        fullWidth
        multiline
        minRows={2}
        maxRows={6}
        value={systemPrompt}
        onChange={e => setSystemPrompt(e.target.value)}
        helperText="Agent persona. Mounted at /config/agent/system-prompt.txt"
        size="small"
      />

      <Box>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Runtime
        </Typography>
        <Typography variant="body2">{runtimeId}</Typography>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Skills ({selectedSkills.length})
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
          {selectedSkills.map(s => (
            <Chip
              key={s.name}
              label={s.skillName ?? s.name}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      {skillBodies.length > 0 && (
        <Box>
          <Box
            display="flex"
            alignItems="center"
            gap={0.5}
            sx={{ cursor: 'pointer' }}
            onClick={() => setShowInstructions(v => !v)}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              Skill Instructions (preview)
            </Typography>
            <IconButton size="small" sx={{ p: 0 }}>
              {showInstructions ? (
                <ExpandLessIcon sx={{ fontSize: 16 }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary">
            These instructions will be fetched from the OCI registry and mounted
            into the DocsClaw runtime at /skills/ when the pod starts.
          </Typography>
          <Collapse in={showInstructions}>
            {skillBodies.map(s => (
              <Box
                key={s.name}
                sx={{
                  mt: 1,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  p: 1.5,
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}
                >
                  {s.name} (SKILL.md)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {s.body}
                </Typography>
              </Box>
            ))}
          </Collapse>
        </Box>
      )}

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
