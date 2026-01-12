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

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useEffect, useState } from 'react';
import { QuickstartItemIcon } from './QuickstartItemIcon';
import { QuickstartCtaLink } from './QuickstartCtaLink';
import IconButton from '@mui/material/IconButton';
import { QuickstartItemData } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { getTranslatedTextWithFallback } from '../../utils';

export type QuickstartItemProps = {
  item: QuickstartItemData;
  setProgress: () => void;
  index: number;
  open: boolean;
  handleOpen: () => void;
};

export const QuickstartItem = ({
  item,
  setProgress,
  index,
  open,
  handleOpen,
}: QuickstartItemProps) => {
  const { t } = useTranslation();
  const [stepCompleted, setStepCompleted] = useState<boolean>(false);
  const itemKey = `${item.title}-${index}`;

  useEffect(() => {
    const stepState = localStorage.getItem(itemKey);
    if (stepState === 'true') {
      setStepCompleted(true);
    }
  }, [itemKey]);

  useEffect(() => {
    localStorage.setItem(itemKey, stepCompleted.toString());
  }, [itemKey, stepCompleted]);

  useEffect(() => {
    if (stepCompleted) {
      setProgress();
    }
  }, [stepCompleted, setProgress]);

  return (
    <Box sx={{ marginBottom: theme => `${theme.spacing(0.2)}` }}>
      <ListItem
        key={itemKey}
        onClick={handleOpen}
        role="button"
        aria-expanded={open}
        aria-label={
          open
            ? t('item.collapseAriaLabel' as any, { title: item.title })
            : t('item.expandAriaLabel' as any, { title: item.title })
        }
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
        sx={{
          cursor: 'pointer',
          ...(stepCompleted
            ? {
                backgroundColor: theme =>
                  theme.palette.mode === 'light' ? '#F3FAF2' : '#223D2D',
              }
            : { backgroundColor: theme => theme.palette.background.paper }),
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: '40px',
          }}
        >
          <QuickstartItemIcon
            icon={item.icon}
            sx={{
              ...(open
                ? { color: theme => theme.palette.text.primary }
                : { color: theme => theme.palette.text.secondary }),
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={getTranslatedTextWithFallback(t, item.titleKey, item.title)}
          sx={{
            '& .v5-MuiTypography-root': {
              fontWeight: theme =>
                `${theme.typography.fontWeightMedium}!important`,
            },
            ...(open
              ? { color: theme => theme.palette.text.primary }
              : { color: theme => theme.palette.text.secondary }),
          }}
        />
        <IconButton
          aria-label={
            open
              ? t('item.collapseButtonAriaLabel')
              : t('item.expandButtonAriaLabel')
          }
          sx={{
            ...(open
              ? { color: theme => theme.palette.text.primary }
              : { color: theme => theme.palette.text.secondary }),
          }}
        >
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List
          component="div"
          disablePadding
          sx={{
            ...(stepCompleted
              ? {
                  backgroundColor: theme =>
                    theme.palette.mode === 'light' ? '#F3FAF2' : '#223D2D',
                }
              : { backgroundColor: theme => theme.palette.background.paper }),
            paddingBottom: '10px',
          }}
        >
          <ListItem>
            <ListItemText
              primary={getTranslatedTextWithFallback(
                t,
                item.descriptionKey,
                item.description,
              )}
            />
          </ListItem>
          <ListItem>
            <QuickstartCtaLink
              cta={item.cta}
              onClick={() => {
                setStepCompleted(true);
              }}
            />
          </ListItem>
        </List>
      </Collapse>
    </Box>
  );
};
