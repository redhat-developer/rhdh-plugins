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

import { useState, useCallback, type FC } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';
import Button from '@mui/material/Button';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CloseIcon from '@mui/icons-material/Close';
import { alpha, type Theme } from '@mui/material/styles';

export type FeedbackDirection = 'positive' | 'negative';

export interface MessageFeedbackData {
  messageId: string;
  direction: FeedbackDirection;
  reasons?: string[];
  comment?: string;
}

const POSITIVE_REASONS = [
  'Accurate',
  'Helpful',
  'Well-written',
  'Creative',
] as const;

const NEGATIVE_REASONS = [
  'Inaccurate',
  'Not helpful',
  'Incomplete',
  'Too verbose',
  'Off-topic',
] as const;

interface MessageFeedbackProps {
  messageId: string;
  theme: Theme;
  onSubmitFeedback?: (data: MessageFeedbackData) => void;
}

export const MessageFeedback: FC<MessageFeedbackProps> = ({
  messageId,
  theme,
  onSubmitFeedback,
}) => {
  const [direction, setDirection] = useState<FeedbackDirection | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const isDark = theme.palette.mode === 'dark';

  const handleThumbClick = useCallback(
    (dir: FeedbackDirection) => {
      if (submitted) return;
      if (direction === dir) {
        setDirection(null);
        setShowDetails(false);
        setSelectedReasons([]);
        setComment('');
        return;
      }
      setDirection(dir);
      setShowDetails(true);
      setSelectedReasons([]);
      setComment('');
    },
    [direction, submitted],
  );

  const toggleReason = useCallback((reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason],
    );
  }, []);

  const handleSubmit = useCallback(() => {
    if (!direction) return;
    const data: MessageFeedbackData = {
      messageId,
      direction,
      reasons: selectedReasons.length > 0 ? selectedReasons : undefined,
      comment: comment.trim() || undefined,
    };
    onSubmitFeedback?.(data);
    setSubmitted(true);
    setShowDetails(false);
  }, [direction, messageId, selectedReasons, comment, onSubmitFeedback]);

  const handleClose = useCallback(() => {
    setShowDetails(false);
  }, []);

  const reasons =
    direction === 'positive' ? POSITIVE_REASONS : NEGATIVE_REASONS;

  const btnSx = (active: boolean) => ({
    width: 28,
    height: 28,
    borderRadius: 1,
    // eslint-disable-next-line no-nested-ternary
    color: active
      ? direction === 'positive'
        ? theme.palette.success.main
        : theme.palette.error.main
      : theme.palette.text.disabled,
    transition: 'color 0.15s ease, background-color 0.15s ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.text.primary, 0.06),
      color: theme.palette.text.primary,
    },
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <Tooltip
          title={
            submitted && direction === 'positive' ? 'Thanks!' : 'Good response'
          }
          arrow
          placement="top"
        >
          <IconButton
            size="small"
            onClick={() => handleThumbClick('positive')}
            disabled={submitted && direction !== 'positive'}
            aria-label="Good response"
            sx={btnSx(direction === 'positive')}
          >
            {direction === 'positive' ? (
              <ThumbUpIcon sx={{ fontSize: 14 }} />
            ) : (
              <ThumbUpOutlinedIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip
          title={
            submitted && direction === 'negative' ? 'Thanks!' : 'Bad response'
          }
          arrow
          placement="top"
        >
          <IconButton
            size="small"
            onClick={() => handleThumbClick('negative')}
            disabled={submitted && direction !== 'negative'}
            aria-label="Bad response"
            sx={btnSx(direction === 'negative')}
          >
            {direction === 'negative' ? (
              <ThumbDownIcon sx={{ fontSize: 14 }} />
            ) : (
              <ThumbDownOutlinedIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Collapse in={showDetails && !submitted}>
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
            bgcolor: alpha(theme.palette.background.paper, isDark ? 0.6 : 0.95),
            maxWidth: 360,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {direction === 'positive' ? 'What was good?' : 'What went wrong?'}
            </Box>
            <IconButton size="small" onClick={handleClose} sx={{ p: 0.25 }}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
            {reasons.map(reason => (
              <Chip
                key={reason}
                label={reason}
                size="small"
                variant={
                  selectedReasons.includes(reason) ? 'filled' : 'outlined'
                }
                onClick={() => toggleReason(reason)}
                sx={{
                  fontSize: '0.7rem',
                  height: 26,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  ...(selectedReasons.includes(reason) && {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    borderColor: theme.palette.primary.main,
                  }),
                }}
              />
            ))}
          </Box>

          <TextField
            size="small"
            placeholder="Additional comments (optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            multiline
            minRows={1}
            maxRows={3}
            fullWidth
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': {
                fontSize: '0.75rem',
                borderRadius: 1.5,
              },
            }}
          />

          <Button
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disableElevation
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              borderRadius: 1.5,
              px: 2,
              py: 0.5,
            }}
          >
            Submit
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
};
