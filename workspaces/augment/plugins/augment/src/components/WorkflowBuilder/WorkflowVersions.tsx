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

import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import RestoreIcon from '@mui/icons-material/Restore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import type { WorkflowVersion } from '@red-hat-developer-hub/backstage-plugin-augment-common';

interface WorkflowVersionsProps {
  versions: WorkflowVersion[];
  currentVersion: number;
  onRestore: (version: number) => void;
  onView: (version: WorkflowVersion) => void;
  onClose: () => void;
}

export function WorkflowVersions({
  versions,
  currentVersion,
  onRestore,
  onView,
  onClose,
}: WorkflowVersionsProps) {
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null);

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  const handleRestore = (version: number) => {
    setConfirmRestore(version);
  };

  const handleConfirmRestore = () => {
    if (confirmRestore !== null) {
      onRestore(confirmRestore);
      setConfirmRestore(null);
    }
  };

  return (
    <Paper
      sx={{
        width: 360,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid',
        borderColor: 'divider',
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
          Version History
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {sortedVersions.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mt: 4, px: 2 }}
          >
            No published versions yet. Publish the workflow to create version snapshots.
          </Typography>
        ) : (
          <List dense disablePadding>
            {sortedVersions.map(v => (
              <ListItem
                key={v.version}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: v.version === currentVersion ? 'action.selected' : undefined,
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        v{v.version}
                      </Typography>
                      {v.version === currentVersion && (
                        <Chip label="current" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" display="block">
                        {new Date(v.publishedAt).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        by {v.publishedBy}
                      </Typography>
                      {v.changelog && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                          {v.changelog}
                        </Typography>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="View this version">
                    <IconButton size="small" onClick={() => onView(v)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {v.version !== currentVersion && (
                    <Tooltip title="Restore this version">
                      <IconButton size="small" onClick={() => handleRestore(v.version)}>
                        <RestoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Dialog open={confirmRestore !== null} onClose={() => setConfirmRestore(null)}>
        <DialogTitle>Restore Version?</DialogTitle>
        <DialogContent>
          <Typography>
            This will replace the current draft with version {confirmRestore}.
            Any unsaved changes will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRestore(null)}>Cancel</Button>
          <Button onClick={handleConfirmRestore} variant="contained" color="primary">
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
