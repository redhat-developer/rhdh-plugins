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
import { useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TimelineIcon from '@mui/icons-material/Timeline';
import HubIcon from '@mui/icons-material/Hub';
import SearchIcon from '@mui/icons-material/Search';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useTheme, alpha } from '@mui/material/styles';
import type { KagentiDashboardConfig } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';

function appendNamespaceQueryParam(href: string, namespace?: string): string {
  const trimmed = namespace?.trim();
  if (!trimmed) return href;
  const sep = href.includes('?') ? '&' : '?';
  return `${href}${sep}namespace=${encodeURIComponent(trimmed)}`;
}

export interface KagentiDashboardLinksProps {
  namespace?: string;
}

interface LinkDef {
  key: keyof KagentiDashboardConfig;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'Observability' | 'Security' | 'Development';
}

const LINK_DEFS: LinkDef[] = [
  {
    key: 'traces',
    label: 'Traces',
    description: 'Distributed tracing for agent requests and A2A calls',
    icon: TimelineIcon,
    category: 'Observability',
  },
  {
    key: 'network',
    label: 'Network',
    description: 'Network topology and service mesh visualization',
    icon: HubIcon,
    category: 'Observability',
  },
  {
    key: 'mcpInspector',
    label: 'MCP Inspector',
    description: 'Inspect and debug MCP tool connections',
    icon: SearchIcon,
    category: 'Development',
  },
  {
    key: 'mcpProxy',
    label: 'MCP Proxy',
    description: 'Manage MCP proxy routing and endpoints',
    icon: SyncAltIcon,
    category: 'Development',
  },
  {
    key: 'keycloakConsole',
    label: 'Keycloak Console',
    description: 'Identity and access management for agents',
    icon: VpnKeyIcon,
    category: 'Security',
  },
];

const CATEGORY_ORDER: Array<LinkDef['category']> = [
  'Observability',
  'Development',
  'Security',
];

export function KagentiDashboardLinks({ namespace }: KagentiDashboardLinksProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const [cfg, setCfg] = useState<KagentiDashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getKagentiDashboards()
      .then(c => {
        if (!cancelled) setCfg(c);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2 }}>
            Dashboards
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} variant="rounded" width={260} height={100} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const entries = LINK_DEFS.flatMap(d => {
    const href = cfg?.[d.key];
    if (typeof href !== 'string' || !href) return [];
    return [{ ...d, href: appendNamespaceQueryParam(href, namespace) }];
  });

  if (entries.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2 }}>
            Dashboards
          </Typography>
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              border: `1px dashed ${alpha(theme.palette.text.disabled, 0.3)}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              No dashboard URLs configured
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled, display: 'block', mt: 0.5 }}>
              Configure dashboard URLs in the Kagenti backend settings
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    items: entries.filter(e => e.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2 }}>
          Dashboards
        </Typography>

        {grouped.map(group => (
          <Box key={group.category} sx={{ mb: 3, '&:last-child': { mb: 0 } }}>
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
              {group.category}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {group.items.map(({ key, label, description, href, icon: Icon }) => (
                <Card
                  key={String(key)}
                  variant="outlined"
                  sx={{
                    width: 260,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, isDark ? 0.12 : 0.08)}`,
                    },
                  }}
                >
                  <CardActionArea
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ height: '100%' }}
                  >
                    <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
                          color: theme.palette.primary.main,
                          flexShrink: 0,
                        }}
                      >
                        <Icon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                          >
                            {label}
                          </Typography>
                          <OpenInNewIcon sx={{ fontSize: 12, color: theme.palette.text.disabled }} />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            display: 'block',
                            lineHeight: 1.4,
                            mt: 0.25,
                          }}
                        >
                          {description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
