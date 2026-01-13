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

import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import BuildIcon from '@mui/icons-material/Build';
import { Button, Label, LabelGroup } from '@patternfly/react-core';
import { CopyIcon } from '@patternfly/react-icons';

import { useTranslation } from '../hooks/useTranslation';
import { ToolCall } from '../types';

const useStyles = makeStyles(theme => ({
  thinkingText: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  summaryText: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  toolCallContainer: {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(0.5),
    border: `1px solid ${theme.palette.divider}`,
  },
  toolHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  leftSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  copyButton: {
    alignSelf: 'center',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
  },
  toolIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  toolName: {
    flex: 1,
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  executionTime: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(1),
  },
  section: {
    marginBottom: theme.spacing(2),
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
    marginBottom: theme.spacing(1),
  },
  sectionDescription: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  responseContainer: {
    padding: theme.spacing(1.5),
    fontFamily: 'Red Hat Text VF',
    fontSize: '0.8rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  responseCollapsed: {
    maxHeight: '80px',
    overflow: 'hidden',
  },
  showMoreButton: {
    color: theme.palette.primary.main,
    cursor: 'pointer',
    fontSize: '0.75rem',
    marginTop: theme.spacing(0.5),
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

interface ToolCallContentProps {
  toolCall: ToolCall;
}

/**
 * Lightweight component for rendering tool call expandable content.
 * Used inside PatternFly's ToolCall component's expandableContent prop.
 */
export const ToolCallContent = ({ toolCall }: ToolCallContentProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [showFullResponse, setShowFullResponse] = useState(false);

  const handleCopy = async () => {
    if (toolCall.response) {
      await globalThis.navigator.clipboard.writeText(toolCall.response);
    }
  };

  const formatExecutionTime = (seconds?: number): string => {
    if (seconds === undefined) return '';
    if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
    return `${seconds.toFixed(2)}s`;
  };

  const getParameterKeys = (): string[] => {
    if (!toolCall.arguments) return [];
    return Object.keys(toolCall.arguments).filter(
      key => toolCall.arguments[key] !== '' && toolCall.arguments[key] !== null,
    );
  };

  const getThinkingTime = (): number => {
    if (toolCall.startTime && toolCall.endTime) {
      return Math.round((toolCall.endTime - toolCall.startTime) / 1000);
    }
    return 0;
  };

  const thinkingTime = getThinkingTime();

  const getShowMoreText = (): string => {
    if (showFullResponse) {
      return t('toolCall.showLess');
    }
    return t('toolCall.showMore');
  };

  return (
    <>
      {/* Thinking Time */}
      {thinkingTime > 0 && (
        <div className={classes.thinkingText}>
          {t('toolCall.thinking' as any, {
            seconds: String(thinkingTime),
          })}
        </div>
      )}

      {/* Summary */}
      <div>
        <Typography className={classes.summaryText}>
          {t('toolCall.summary')}
        </Typography>
      </div>

      {/* Tool Call Details Container */}
      <div className={classes.toolCallContainer}>
        <div className={classes.toolHeader}>
          <div className={classes.leftSection}>
            <div className={classes.titleRow}>
              <BuildIcon
                className={classes.toolIcon}
                style={{ transform: 'rotate(90deg)' }}
                fontSize="inherit"
              />
              <Typography className={classes.toolName}>
                {t('toolCall.mcpServer')}
              </Typography>
            </div>
            {toolCall.executionTime !== undefined && (
              <Typography className={classes.executionTime}>
                {t('toolCall.executionTime')}
                {formatExecutionTime(toolCall.executionTime)}
              </Typography>
            )}
          </div>
          {toolCall.response && (
            <Button
              className={classes.copyButton}
              variant="plain"
              aria-label={t('toolCall.copyResponse')}
              onClick={handleCopy}
              icon={<CopyIcon />}
            />
          )}
        </div>

        {/* Parameters Section */}
        {getParameterKeys().length > 0 && (
          <div className={classes.section}>
            <div className={classes.sectionTitle}>
              {t('toolCall.parameters' as any, {
                defaultValue: 'Parameters',
              }) || 'Parameters'}
            </div>
            {toolCall.description && (
              <div className={classes.sectionDescription}>
                {toolCall.description}
              </div>
            )}
            <LabelGroup>
              {getParameterKeys().map(key => (
                <Label key={key}>{key}</Label>
              ))}
            </LabelGroup>
          </div>
        )}

        {/* Response Section */}
        {toolCall.response && (
          <div className={classes.section}>
            <div className={classes.sectionTitle}>{t('toolCall.response')}</div>
            <div
              className={`${classes.responseContainer} ${
                !showFullResponse && toolCall.response.length > 300
                  ? classes.responseCollapsed
                  : ''
              }`}
            >
              {toolCall.response}
            </div>
            {toolCall.response.length > 300 && (
              <div
                className={classes.showMoreButton}
                onClick={() => setShowFullResponse(!showFullResponse)}
                onKeyDown={e =>
                  e.key === 'Enter' && setShowFullResponse(!showFullResponse)
                }
                role="button"
                tabIndex={0}
              >
                {getShowMoreText()}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ToolCallContent;
