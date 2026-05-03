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
import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HubIcon from '@mui/icons-material/Hub';
import BuildIcon from '@mui/icons-material/Build';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useTheme, alpha } from '@mui/material/styles';
import { AgentListItem } from './AgentListItem';
import { AgentPreviewCard } from './AgentPreviewCard';
import { CapabilitiesTab } from './CapabilitiesTab';
import { ConnectionsTab } from './ConnectionsTab';
import { AdvancedTab } from './AdvancedTab';
import { InstructionsTab } from './InstructionsTab';
import type { AgentEditorState } from './useAgentEditor';

const LEFT_PANEL_WIDTH = 280;
const RIGHT_MAX_WIDTH = 780;

interface MultiAgentEditorProps {
  editor: AgentEditorState;
}

export const MultiAgentEditor = React.memo(function MultiAgentEditor({
  editor,
}: MultiAgentEditorProps) {
  const theme = useTheme();
  const {
    agents,
    agentKeys,
    selectedAgentKey,
    selectedAgent,
    defaultAgentKey,
    agentRoles,
    selectedAgentRole,
    showConnections,
    edgeCounts,
    isDirty,
    agentsSource,
    validation,
    topologyEdges,
    tabCompletion,
    activeTab,
    setActiveTab,
    showPreview,
    modelOptions,
    modelsLoading,
    generating,
    generateError,
    effectiveModel,
    availableMcpServers,
    vectorStores,
    handleSelectAgent,
    handleRemoveAgent,
    updateAgent,
    handleUpdateInstructions,
    handleGenerateForTab,
    refreshModels,
  } = editor;

  const connectionsTab = showConnections ? 1 : -1;
  const advancedTab = showConnections ? 2 : 1;
  const instructionsTab = showConnections ? 3 : 2;

  const tabHasError = (tabIndex: number): boolean => {
    if (!selectedAgentKey || !selectedAgent) return false;
    const nameErr = !selectedAgent.name.trim();
    const instrErr = !selectedAgent.instructions.trim();
    if (tabIndex === 0) return nameErr;
    if (tabIndex === instructionsTab) return instrErr;
    return false;
  };

  const renderTabLabel = (label: string, tabIndex: number, completionKey?: keyof NonNullable<typeof tabCompletion>) => {
    const hasError = tabHasError(tabIndex);
    const isComplete = completionKey && tabCompletion ? tabCompletion[completionKey] : false;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {label}
        {hasError && (
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: theme.palette.error.main, flexShrink: 0 }} />
        )}
        {!hasError && isComplete && (
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: theme.palette.success.main, flexShrink: 0 }} />
        )}
      </Box>
    );
  };

  const roleDescription = useMemo(() => {
    if (selectedAgentRole === 'router') return 'Visible in gallery \u2014 routes to other agents';
    if (selectedAgentRole === 'specialist') return 'Hidden \u2014 only reachable via handoffs';
    return 'Visible in gallery \u2014 independent agent';
  }, [selectedAgentRole]);

  return (
    <Box sx={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
      <Box
        data-tour="orch-agent-list"
        sx={{
          width: LEFT_PANEL_WIDTH,
          flexShrink: 0,
          borderRight: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
          {agentKeys.map(key => (
            <AgentListItem
              key={key}
              agentKey={key}
              agent={agents[key]}
              isSelected={key === selectedAgentKey}
              isDefault={key === defaultAgentKey}
              isSingleAgent={agentKeys.length === 1}
              outCount={edgeCounts[key]?.out ?? 0}
              inCount={edgeCounts[key]?.in ?? 0}
              effectiveRole={agentRoles[key] ?? 'standalone'}
              onSelect={handleSelectAgent}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {selectedAgentKey && selectedAgent ? (
            <Box sx={{ maxWidth: RIGHT_MAX_WIDTH, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Identity */}
              <Box data-tour="orch-identity" sx={{ flexShrink: 0, mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <TextField
                    value={selectedAgent.name}
                    onChange={e => updateAgent(selectedAgentKey, 'name', e.target.value)}
                    variant="standard"
                    placeholder="Agent name"
                    error={!selectedAgent.name.trim() && isDirty}
                    helperText={!selectedAgent.name.trim() && isDirty ? 'Name is required' : undefined}
                    InputProps={{ sx: { fontSize: '1.1rem', fontWeight: 600 }, disableUnderline: true }}
                    sx={{ flex: 1 }}
                  />
                  <Chip label={selectedAgentKey} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }} />
                  {agentsSource === 'database' && <Chip label="Modified" size="small" color="info" />}
                  <Tooltip title="Delete agent">
                    <IconButton
                      size="small"
                      aria-label="Delete agent"
                      onClick={() => handleRemoveAgent(selectedAgentKey)}
                      sx={{ color: theme.palette.error.main, opacity: 0.35, '&:hover': { opacity: 1 } }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip
                    size="small"
                    icon={
                      selectedAgentRole === 'router' ? <HubIcon sx={{ fontSize: 14 }} /> :
                      selectedAgentRole === 'specialist' ? <BuildIcon sx={{ fontSize: 14 }} /> :
                      <RocketLaunchIcon sx={{ fontSize: 14 }} />
                    }
                    label={selectedAgentRole.charAt(0).toUpperCase() + selectedAgentRole.slice(1)}
                    color={selectedAgentRole === 'router' ? 'primary' : selectedAgentRole === 'specialist' ? 'default' : 'success'}
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                  />
                  <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                    {roleDescription}
                  </Typography>
                </Box>
                {showConnections && (
                  <TextField
                    value={selectedAgent.handoffDescription}
                    onChange={e => updateAgent(selectedAgentKey, 'handoffDescription', e.target.value)}
                    variant="standard"
                    fullWidth
                    placeholder="Add a description \u2014 other agents read this when deciding to route here"
                    InputProps={{
                      sx: {
                        fontSize: '0.8rem',
                        color: theme.palette.text.secondary,
                        borderBottom: `1px dashed ${alpha(theme.palette.text.secondary, 0.25)}`,
                        '&:hover': { borderBottom: `1px dashed ${alpha(theme.palette.text.secondary, 0.5)}` },
                        '&.Mui-focused': { borderBottom: `1px solid ${theme.palette.primary.main}` },
                      },
                      disableUnderline: true,
                    }}
                  />
                )}
              </Box>

              {/* Validation */}
              {validation.errors.length > 0 && (
                <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 1, py: 0.25, flexShrink: 0 }}>
                  {validation.errors.map(err => (
                    <Typography key={err} variant="body2" sx={{ fontSize: '0.75rem' }}>&bull; {err}</Typography>
                  ))}
                </Alert>
              )}
              {validation.warnings.length > 0 && (
                <Alert severity="info" sx={{ mb: 1, py: 0.25, flexShrink: 0 }}>
                  {validation.warnings.map(w => (
                    <Typography key={w} variant="body2" sx={{ fontSize: '0.75rem' }}>&bull; {w}</Typography>
                  ))}
                </Alert>
              )}

              {/* Tabs */}
              <Box data-tour="orch-tabs" sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  aria-label="Agent configuration tabs"
                  sx={{
                    minHeight: 36,
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.8125rem', minHeight: 36, px: 2 },
                  }}
                >
                  <Tab label={renderTabLabel('Capabilities', 0, 'capabilities')} data-tour="orch-tab-capabilities" />
                  {showConnections && <Tab label={renderTabLabel('Connections', connectionsTab, 'connections')} data-tour="orch-tab-connections" />}
                  <Tab label={renderTabLabel('Advanced', advancedTab, 'advanced')} data-tour="orch-tab-advanced" />
                  <Tab label={renderTabLabel('Instructions', instructionsTab, 'instructions')} data-tour="orch-tab-instructions" />
                </Tabs>
              </Box>

              {/* Tab content */}
              <Box sx={{ flex: 1, overflow: 'auto', pt: 2 }}>
                {activeTab === 0 && (
                  <CapabilitiesTab
                    agent={selectedAgent}
                    agentKey={selectedAgentKey}
                    modelOptions={modelOptions}
                    modelsLoading={modelsLoading}
                    availableMcpServers={availableMcpServers}
                    vectorStores={vectorStores}
                    onUpdateAgent={updateAgent}
                    onRefreshModels={refreshModels}
                  />
                )}
                {activeTab === connectionsTab && (
                  <ConnectionsTab
                    agents={agents}
                    agentKeys={agentKeys}
                    selectedAgentKey={selectedAgentKey}
                    selectedAgent={selectedAgent}
                    topologyEdges={topologyEdges}
                    agentRoles={agentRoles}
                    onUpdateAgent={updateAgent}
                    onSelectAgent={handleSelectAgent}
                  />
                )}
                {activeTab === advancedTab && (
                  <AdvancedTab
                    agent={selectedAgent}
                    agentKey={selectedAgentKey}
                    onUpdateAgent={updateAgent}
                  />
                )}
                {activeTab === instructionsTab && (
                  <Box data-tour="orch-instructions">
                    <InstructionsTab
                      agent={selectedAgent}
                      agents={agents}
                      availableMcpServers={availableMcpServers}
                      modelOptions={modelOptions}
                      modelsLoading={modelsLoading}
                      effectiveModel={effectiveModel}
                      generating={generating}
                      generateError={generateError}
                      onUpdateInstructions={handleUpdateInstructions}
                      onGenerate={handleGenerateForTab}
                      onRefreshModels={refreshModels}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.palette.text.disabled }}>
              <Typography>Select an agent from the list</Typography>
            </Box>
          )}
        </Box>

        {showPreview && selectedAgent && <AgentPreviewCard agent={selectedAgent} />}
      </Box>
    </Box>
  );
});
