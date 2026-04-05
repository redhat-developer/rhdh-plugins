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

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { useTheme, alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StreamIcon from '@mui/icons-material/Stream';
import ChatIcon from '@mui/icons-material/Chat';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
  getAgentAvatarColor,
  isAgentReady,
  type AgentWithCard,
} from './agentUtils';
import { useTranslation } from '../../hooks/useTranslation';

interface AgentDetailDrawerProps {
  agent: AgentWithCard | null;
  open: boolean;
  onClose: () => void;
  onStartConversation: (agentId: string, agentName: string) => void;
}

function agentStatusChipColor(
  ready: boolean,
  status: string,
): 'success' | 'warning' | 'default' {
  if (ready) return 'success';
  if (['Pending', 'Building'].includes(status)) return 'warning';
  return 'default';
}

export const AgentDetailDrawer: React.FC<AgentDetailDrawerProps> = ({
  agent,
  open,
  onClose,
  onStartConversation,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!agent) return null;

  const card = agent.agentCard;
  const displayName = card?.name || agent.name;
  const avatarColor = getAgentAvatarColor(displayName);
  const skills = card?.skills || [];
  const ready = isAgentReady(agent.status);
  const agentId = `${agent.namespace}/${agent.name}`;
  const protocol = agent.labels?.protocol;
  const protocolLabel = protocol
    ? (Array.isArray(protocol) ? protocol.join(', ') : protocol).toUpperCase()
    : null;

  const handleStart = () => {
    onStartConversation(agentId, displayName);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 400,
          maxWidth: '90vw',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: isDark
            ? `linear-gradient(180deg, ${alpha(avatarColor, 0.15)} 0%, transparent 100%)`
            : `linear-gradient(180deg, ${alpha(avatarColor, 0.08)} 0%, transparent 100%)`,
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          size="small"
          aria-label={t('agentDetail.closeAriaLabel')}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: theme.palette.text.secondary,
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(avatarColor, isDark ? 0.25 : 0.15),
              color: avatarColor,
              fontWeight: 700,
              fontSize: '1.5rem',
              flexShrink: 0,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3 }}
            >
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              {agent.namespace}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={agent.status}
                size="small"
                color={agentStatusChipColor(ready, agent.status)}
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
              {card?.version && (
                <Chip
                  label={`v${card.version}`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
              {protocolLabel && (
                <Chip
                  label={protocolLabel}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    bgcolor: alpha(
                      theme.palette.info.main,
                      isDark ? 0.15 : 0.08,
                    ),
                    color: theme.palette.info.main,
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {/* Description */}
        {(card?.description || agent.description) && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                display: 'block',
                mb: 0.5,
              }}
            >
              {t('agentDetail.about')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.primary, lineHeight: 1.6 }}
            >
              {card?.description || agent.description}
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Skills with examples */}
        {skills.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                display: 'block',
                mb: 1,
              }}
            >
              {t('agentDetail.skillsWithCount', { count: skills.length })}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {skills.map((skill, idx) => (
                <Box
                  key={skill.id || idx}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(
                      theme.palette.text.primary,
                      isDark ? 0.04 : 0.02,
                    ),
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    {skill.name ||
                      skill.id ||
                      t('agentDetail.skillFallback', { n: idx + 1 })}
                  </Typography>
                  {skill.description && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        display: 'block',
                        mt: 0.25,
                        lineHeight: 1.4,
                      }}
                    >
                      {skill.description}
                    </Typography>
                  )}
                  {skill.examples && skill.examples.length > 0 && (
                    <Box
                      sx={{
                        mt: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.6rem',
                          color: theme.palette.text.disabled,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        Try asking
                      </Typography>
                      {skill.examples.map((example, eidx) => (
                        <Tooltip
                          key={eidx}
                          title="Click to start a conversation with this prompt"
                          placement="left"
                        >
                          <Chip
                            icon={<PlayArrowIcon sx={{ fontSize: 12 }} />}
                            label={example}
                            size="small"
                            variant="outlined"
                            onClick={e => {
                              e.stopPropagation();
                              handleStart();
                            }}
                            sx={{
                              height: 'auto',
                              py: 0.5,
                              justifyContent: 'flex-start',
                              '& .MuiChip-label': {
                                fontSize: '0.7rem',
                                whiteSpace: 'normal',
                                lineHeight: 1.3,
                              },
                              borderColor: alpha(
                                theme.palette.primary.main,
                                0.3,
                              ),
                              color: theme.palette.text.primary,
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: alpha(
                                  theme.palette.primary.main,
                                  0.06,
                                ),
                                borderColor: theme.palette.primary.main,
                              },
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Capabilities */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              display: 'block',
              mb: 1,
            }}
          >
            {t('agentDetail.capabilities')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<StreamIcon sx={{ fontSize: 14 }} />}
              label={
                card?.streaming
                  ? t('agentDetail.streaming')
                  : t('agentDetail.nonStreaming')
              }
              size="small"
              variant="outlined"
              color={card?.streaming ? 'info' : 'default'}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
            <Chip
              icon={<SmartToyIcon sx={{ fontSize: 14 }} />}
              label={t('agentDetail.a2aProtocol')}
              size="small"
              variant="outlined"
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
            {agent.labels?.framework && (
              <Chip
                label={agent.labels.framework}
                size="small"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.7rem' }}
              />
            )}
          </Box>
        </Box>

        {/* Metadata */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              display: 'block',
              mb: 1,
            }}
          >
            {t('agentDetail.details')}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.disabled, display: 'block' }}
              >
                {t('agentDetail.fieldNamespace')}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {agent.namespace}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.disabled, display: 'block' }}
              >
                {t('agentDetail.fieldName')}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {agent.name}
              </Typography>
            </Box>
            {card?.version && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.disabled, display: 'block' }}
                >
                  {t('agentDetail.fieldVersion')}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {card.version}
                </Typography>
              </Box>
            )}
            {card?.url && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.disabled, display: 'block' }}
                >
                  {t('agentDetail.fieldEndpoint')}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.75rem',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                  }}
                >
                  {card.url}
                </Typography>
              </Box>
            )}
            {agent.createdAt && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.disabled, display: 'block' }}
                >
                  Created
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {new Date(agent.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Footer CTA */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<ChatIcon />}
          onClick={handleStart}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            py: 1.25,
          }}
        >
          {t('agentDetail.startConversation')}
        </Button>
        {!ready && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 0.75,
              color: theme.palette.warning.main,
              fontSize: '0.65rem',
            }}
          >
            This agent is {agent.status.toLowerCase()} and may not respond
          </Typography>
        )}
      </Box>
    </Drawer>
  );
};
