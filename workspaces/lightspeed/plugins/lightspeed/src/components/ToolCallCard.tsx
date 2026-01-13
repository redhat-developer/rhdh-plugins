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
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import BuildIcon from '@mui/icons-material/Build';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import {
  Card,
  CardBody,
  Label,
  LabelGroup,
  Spinner,
} from '@patternfly/react-core';

import { useTranslation } from '../hooks/useTranslation';
import { ToolCall } from '../types';

const useStyles = makeStyles(theme => ({
  container: {
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1.5),
    overflow: 'hidden',
    width: '75%',
    padding: theme.spacing(2),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5),
    cursor: 'pointer',
    width: 'fit-content',
    borderRadius: theme.spacing(0.75),
  },
  headerExpanded: {
    backgroundColor: theme.palette.background.default,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  headerIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
    transition: 'transform 0.2s',
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
    color: theme.palette.primary.main,
  },
  thinkingText: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  summaryText: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
  cardContent: {
    paddingLeft: theme.spacing(3.5),
    marginTop: theme.spacing(0.5),
  },
  toolCallContainer: {
    width: '75%',
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(0.5),
    border: `1px solid ${theme.palette.divider}`,
  },
  toolHeader: {
    display: 'flex',
    alignItems: 'stretch',
    marginBottom: theme.spacing(1),
  },
  leftSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
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
  copyButton: {
    alignSelf: 'center',
    padding: theme.spacing(0.5),
    cursor: 'pointer',
    color: theme.palette.text.secondary,
    '&:hover': {
      color: theme.palette.primary.main,
    },
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
  parametersContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
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
    marginLeft: theme.spacing(5),
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    width: '75%',
  },
  loadingText: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
}));

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export const ToolCallCard = ({ toolCall }: ToolCallCardProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <Card className={classes.container}>
      <div
        className={`${classes.header} ${isExpanded ? classes.headerExpanded : ''}`}
        onClick={handleToggle}
        onKeyDown={e => e.key === 'Enter' && handleToggle()}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <ExpandLessIcon className={classes.headerIcon} />
        ) : (
          <ArrowForwardIosIcon
            className={classes.headerIcon}
            fontSize="inherit"
          />
        )}
        <div className={classes.headerTitle}>
          {t('toolCall.header' as any, { toolName: toolCall.toolName })}
        </div>
        {toolCall.isLoading && <Spinner size="sm" />}
      </div>

      {isExpanded && (
        <CardBody className={classes.cardContent}>
          {toolCall.isLoading ? (
            <div className={classes.loadingContainer}>
              <Spinner size="md" />
              <Typography className={classes.loadingText}>
                {t('toolCall.executing')}
              </Typography>
            </div>
          ) : (
            <>
              {/* Tool Header */}
              {thinkingTime > 0 && (
                <div className={classes.thinkingText}>
                  {t('toolCall.thinking' as any, {
                    seconds: String(thinkingTime),
                  })}
                </div>
              )}
              <div>
                <Typography className={classes.summaryText}>
                  {t('toolCall.summary')}
                </Typography>
              </div>
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
                  <FileCopyIcon
                    className={classes.copyButton}
                    fontSize="medium"
                    onClick={handleCopy}
                    aria-label="Copy response"
                  />
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
                    <div className={classes.sectionTitle}>
                      {t('toolCall.response')}
                    </div>
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
                          e.key === 'Enter' &&
                          setShowFullResponse(!showFullResponse)
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
          )}
        </CardBody>
      )}
    </Card>
  );
};

export default ToolCallCard;
