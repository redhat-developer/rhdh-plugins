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

import { useCallback, useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Grow from '@mui/material/Grow';
import { useTheme, alpha } from '@mui/material/styles';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import type { TourId } from './tourDefinitions';
import { useTour } from './TourProvider';
import { DEFAULT_TOURS, type TourDefinition } from './defaultTours';

const WELCOME_STORAGE_PREFIX = 'augment:welcome-seen';

function getWelcomeKey(page?: string): string {
  return page ? `${WELCOME_STORAGE_PREFIX}:${page}` : WELCOME_STORAGE_PREFIX;
}

function hasSeenWelcome(page?: string): boolean {
  try {
    return localStorage.getItem(getWelcomeKey(page)) === '1';
  } catch {
    return false;
  }
}

function markWelcomeSeen(page?: string): void {
  try {
    localStorage.setItem(getWelcomeKey(page), '1');
  } catch {
    /* noop */
  }
}

const TOUR_ICONS: Record<TourId, React.ReactNode> = {
  'marketplace-welcome': <StorefrontOutlinedIcon />,
  'marketplace-import-agent': <CloudDownloadOutlinedIcon />,
  'marketplace-develop-agent': <TerminalOutlinedIcon />,
  'marketplace-configure-agent': <HubOutlinedIcon />,
  'marketplace-create-tool': <ExtensionOutlinedIcon />,
  'cc-overview': <ExploreOutlinedIcon />,
  'cc-agents': <SmartToyOutlinedIcon />,
  'cc-platform': <ExtensionOutlinedIcon />,
  'cc-settings': <SettingsOutlinedIcon />,
};

interface TourLauncherDialogProps {
  open: boolean;
  onClose: () => void;
  tours?: TourDefinition[];
  persona?: 'developer' | 'admin';
  page?: 'marketplace' | 'command-center';
}

export function TourLauncherDialog({
  open,
  onClose,
  tours,
  persona,
  page,
}: TourLauncherDialogProps) {
  const allTours = tours && tours.length > 0 ? tours : DEFAULT_TOURS;
  const TOUR_LIST = useMemo(
    () =>
      allTours.filter(t => {
        if (
          persona &&
          t.persona &&
          t.persona !== 'both' &&
          t.persona !== persona
        )
          return false;
        if (page && t.page && t.page !== 'any' && t.page !== page) return false;
        return true;
      }),
    [allTours, persona, page],
  );
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: { key: string; label: string }[] = [];
    for (const t of TOUR_LIST) {
      const cat = t.category || 'general';
      if (!seen.has(cat)) {
        seen.add(cat);
        cats.push({
          key: cat,
          label: cat
            .split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
        });
      }
    }
    return cats;
  }, [TOUR_LIST]);
  const getTourStepCount = (id: string) =>
    TOUR_LIST.find(t => t.id === id)?.steps.length ?? 0;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { startTour, isCompleted, startAutoPlay, voice } = useTour();
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (open) setVersion(v => v + 1);
  }, [open]);

  const handleLaunch = useCallback(
    (id: TourId) => {
      onClose();
      setTimeout(() => startTour(id), 300);
    },
    [onClose, startTour],
  );

  const handleAutoPlay = useCallback(() => {
    onClose();
    const ids = TOUR_LIST.map(t => t.id);
    setTimeout(() => startAutoPlay(ids), 300);
  }, [onClose, startAutoPlay, TOUR_LIST]);

  const totalMinutes = useMemo(
    () => TOUR_LIST.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0),
    [TOUR_LIST],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, TourDefinition[]>();
    for (const cat of categories) {
      map.set(
        cat.key,
        TOUR_LIST.filter(t => (t.category || 'general') === cat.key),
      );
    }
    return map;
  }, [categories, TOUR_LIST]);

  const completedCount = TOUR_LIST.filter(t => isCompleted(t.id)).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Grow}
      TransitionProps={{ timeout: 350 } as object}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          bgcolor: 'background.default',
        },
      }}
    >
      {/* Hero header — compact */}
      <Box
        sx={{
          background: isDark
            ? 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)'
            : 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
          px: 4,
          pt: 3,
          pb: 2.5,
          textAlign: 'center',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            pointerEvents: 'none',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            mb: 1,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RocketLaunchIcon
              sx={{ fontSize: 22, color: 'rgba(255,255,255,0.95)' }}
            />
          </Box>
          <Box sx={{ textAlign: 'left' }}>
            <Typography
              variant="h6"
              sx={{
                color: '#fff',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontSize: '1.1rem',
                lineHeight: 1.2,
              }}
            >
              Guided Experience
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}
            >
              Choose a walkthrough to learn the platform step by step
            </Typography>
          </Box>
          {completedCount > 0 && (
            <Chip
              size="small"
              label={`${completedCount}/${TOUR_LIST.length}`}
              sx={{
                bgcolor: 'rgba(255,255,255,0.18)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.6875rem',
                height: 22,
                backdropFilter: 'blur(4px)',
              }}
            />
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={
              <PlayCircleOutlineIcon sx={{ fontSize: '16px !important' }} />
            }
            onClick={handleAutoPlay}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              backdropFilter: 'blur(8px)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              borderRadius: 1.5,
              px: 2,
              py: 0.5,
              border: '1px solid rgba(255,255,255,0.25)',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              },
            }}
          >
            Auto-Play All Tours
          </Button>
          {voice.isSupported && (
            <Tooltip
              title={
                voice.isVoiceEnabled
                  ? 'Default voice on (per-tour overrides below)'
                  : 'Default voice off (per-tour overrides below)'
              }
              arrow
            >
              <IconButton
                size="small"
                onClick={() => voice.setVoiceEnabled(!voice.isVoiceEnabled)}
                sx={{
                  color: '#fff',
                  bgcolor: voice.isVoiceEnabled
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  width: 30,
                  height: 30,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                {voice.isVoiceEnabled ? (
                  <VolumeUpIcon sx={{ fontSize: 16 }} />
                ) : (
                  <VolumeOffIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </Tooltip>
          )}
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.625rem',
            }}
          >
            ~{totalMinutes} min
            {voice.isSupported && (
              <> &middot; {voice.isVoiceEnabled ? 'Voice on' : 'Voice off'}</>
            )}
          </Typography>
        </Box>
      </Box>

      {/* Tour cards */}
      <DialogContent sx={{ px: 3, py: 2 }}>
        {categories.map(cat => {
          const catTours = grouped.get(cat.key);
          if (!catTours?.length) return null;
          return (
            <Box key={cat.key} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
              <Typography
                variant="overline"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  fontSize: '0.625rem',
                  mb: 1,
                  display: 'block',
                }}
              >
                {cat.label}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1,
                }}
              >
                {catTours.map(tour => {
                  const done = isCompleted(tour.id);
                  const steps = getTourStepCount(tour.id);
                  return (
                    <Card
                      key={tour.id}
                      variant="outlined"
                      sx={{
                        borderColor: done
                          ? alpha(theme.palette.success.main, 0.4)
                          : theme.palette.divider,
                        bgcolor: 'background.paper',
                        transition:
                          'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
                        '&:hover': {
                          borderColor: done
                            ? theme.palette.success.main
                            : theme.palette.primary.main,
                          boxShadow: isDark
                            ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                            : `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <CardActionArea
                        onClick={() => handleLaunch(tour.id)}
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            position: 'relative',
                            bgcolor: done
                              ? alpha(
                                  theme.palette.success.main,
                                  isDark ? 0.15 : 0.08,
                                )
                              : alpha(
                                  theme.palette.primary.main,
                                  isDark ? 0.15 : 0.08,
                                ),
                            color: done
                              ? theme.palette.success.main
                              : theme.palette.primary.main,
                            '& > .MuiSvgIcon-root': {
                              fontSize: 18,
                            },
                          }}
                        >
                          {TOUR_ICONS[tour.id]}
                          {done && (
                            <CheckCircleIcon
                              sx={{
                                position: 'absolute',
                                bottom: -3,
                                right: -3,
                                fontSize: 14,
                                color: 'success.main',
                                bgcolor: 'background.paper',
                                borderRadius: '50%',
                              }}
                            />
                          )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                color: 'text.primary',
                                lineHeight: 1.3,
                                flex: 1,
                              }}
                            >
                              {tour.title}
                            </Typography>
                            {voice.isSupported && (
                              <Tooltip
                                title={
                                  voice.isVoiceEnabledForTour(tour.id)
                                    ? 'Voice on for this tour'
                                    : 'Voice off for this tour'
                                }
                                arrow
                              >
                                <IconButton
                                  size="small"
                                  onClick={e => {
                                    e.stopPropagation();
                                    voice.setVoiceEnabledForTour(
                                      tour.id,
                                      !voice.isVoiceEnabledForTour(tour.id),
                                    );
                                    setVersion(v => v + 1);
                                  }}
                                  sx={{
                                    p: 0.25,
                                    flexShrink: 0,
                                    color: voice.isVoiceEnabledForTour(tour.id)
                                      ? 'primary.main'
                                      : 'text.disabled',
                                  }}
                                >
                                  {voice.isVoiceEnabledForTour(tour.id) ? (
                                    <VolumeUpIcon sx={{ fontSize: 14 }} />
                                  ) : (
                                    <VolumeOffIcon sx={{ fontSize: 14 }} />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                            <PlayArrowRoundedIcon
                              sx={{
                                fontSize: 16,
                                color: 'text.disabled',
                                flexShrink: 0,
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mt: 0.125,
                              lineHeight: 1.35,
                              fontSize: '0.6875rem',
                            }}
                          >
                            {tour.description}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.75,
                              mt: 0.5,
                            }}
                          >
                            <Chip
                              size="small"
                              label={`${steps} steps`}
                              sx={{
                                height: 18,
                                fontSize: '0.625rem',
                                fontWeight: 600,
                                bgcolor: alpha(
                                  theme.palette.text.primary,
                                  isDark ? 0.08 : 0.05,
                                ),
                                color: 'text.secondary',
                              }}
                            />
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.25,
                                color: 'text.disabled',
                              }}
                            >
                              <AccessTimeIcon sx={{ fontSize: 11 }} />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.625rem',
                                  fontWeight: 600,
                                }}
                              >
                                ~{tour.estimatedMinutes} min
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          pt: 0.75,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 1.5,
            px: 2.5,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function useFirstVisitTourDialog(
  page?: 'marketplace' | 'command-center',
) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasSeenWelcome(page)) {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [page]);

  const close = useCallback(() => {
    setOpen(false);
    markWelcomeSeen(page);
  }, [page]);

  const openDialog = useCallback(() => {
    setOpen(true);
  }, []);

  return { open, close, openDialog };
}
