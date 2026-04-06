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
import StreamIcon from '@mui/icons-material/Stream';
import ChatIcon from '@mui/icons-material/Chat';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import {
  getAgentAvatarColor,
  isAgentReady,
  sanitizeDescription,
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

const SECTION_LABEL_SX = {
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  fontSize: '0.6rem',
  display: 'block',
  mb: 1,
};

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

  const starters = skills.flatMap(s => s.examples || []).slice(0, 4);
  const rawDesc = card?.description || agent.description || '';
  const cleanDesc = sanitizeDescription(rawDesc, 400);

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
          width: 420,
          maxWidth: '90vw',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header: Avatar + Name + Status */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          background: isDark
            ? `linear-gradient(180deg, ${alpha(avatarColor, 0.12)} 0%, transparent 100%)`
            : `linear-gradient(180deg, ${alpha(avatarColor, 0.06)} 0%, transparent 100%)`,
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    color: theme.palette.text.disabled,
                  }}
                >
                  v{card.version}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* CTA at top */}
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

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        {/* Try asking (starters first — they're actionable) */}
        {starters.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={SECTION_LABEL_SX}>
              Try asking
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {starters.map((example, eidx) => (
                <Tooltip
                  key={eidx}
                  title="Start a conversation with this prompt"
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
                        fontSize: '0.75rem',
                        whiteSpace: 'normal',
                        lineHeight: 1.4,
                      },
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: theme.palette.text.primary,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        )}

        {/* About */}
        {cleanDesc && cleanDesc !== 'No description available' && (
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={SECTION_LABEL_SX}>
              {t('agentDetail.about')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.primary, lineHeight: 1.6 }}
            >
              {cleanDesc}
            </Typography>
          </Box>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={SECTION_LABEL_SX}>
                {t('agentDetail.skillsWithCount', { count: skills.length })}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}

        {/* Capabilities */}
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={SECTION_LABEL_SX}>
            {t('agentDetail.capabilities')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {card?.streaming && (
              <Chip
                icon={<StreamIcon sx={{ fontSize: 14 }} />}
                label="Streaming"
                size="small"
                variant="outlined"
                color="info"
                sx={{ height: 24, fontSize: '0.7rem' }}
              />
            )}
            {agent.labels?.protocol && (
              <Chip
                icon={<SyncAltIcon sx={{ fontSize: 14 }} />}
                label="A2A Protocol"
                size="small"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.7rem' }}
              />
            )}
            {!card?.streaming && !agent.labels?.protocol && (
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.disabled }}
              >
                Standard request/response
              </Typography>
            )}
          </Box>
        </Box>

        {/* Technical details (at the bottom) */}
        <Divider sx={{ mb: 2 }} />
        <Box>
          <Typography variant="caption" sx={SECTION_LABEL_SX}>
            {t('agentDetail.details')}
          </Typography>
          <Box
            sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}
          >
            {agent.labels?.framework && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.disabled, display: 'block' }}
                >
                  Framework
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {agent.labels.framework}
                </Typography>
              </Box>
            )}
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
              <Box sx={{ gridColumn: '1 / -1' }}>
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
    </Drawer>
  );
};
