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

export const QuickstartItem = ({ item, setProgress, index }: any) => {
  const [currentOpen, setCurrentOpen] = useState<boolean>(false);
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

  return (
    <Box sx={{ marginBottom: theme => `${theme.spacing(0.2)}` }}>
      <ListItem
        key={itemKey}
        sx={{
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
              ...(currentOpen
                ? { color: theme => theme.palette.text.primary }
                : { color: theme => theme.palette.text.secondary }),
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={item.title}
          sx={{
            '& .v5-MuiTypography-root': {
              fontWeight: theme =>
                `${theme.typography.fontWeightMedium}!important`,
            },
            ...(currentOpen
              ? { color: theme => theme.palette.text.primary }
              : { color: theme => theme.palette.text.secondary }),
          }}
        />
        <IconButton
          onClick={() => {
            setCurrentOpen(!currentOpen);
          }}
          sx={{
            ...(currentOpen
              ? { color: theme => theme.palette.text.primary }
              : { color: theme => theme.palette.text.secondary }),
          }}
        >
          {currentOpen ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </ListItem>
      <Collapse in={currentOpen} timeout="auto" unmountOnExit>
        <List
          component="div"
          disablePadding
          sx={{
            backgroundColor: theme => theme.palette.background.paper,
            paddingBottom: '10px',
          }}
        >
          <ListItem>
            <ListItemText primary={item.description} />
          </ListItem>
          <ListItem>
            <QuickstartCtaLink
              cta={item.cta}
              onClick={() => {
                setProgress();
                setStepCompleted(true);
              }}
            />
          </ListItem>
        </List>
      </Collapse>
    </Box>
  );
};
