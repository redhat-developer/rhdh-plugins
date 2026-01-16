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

import {
  Button,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Label,
  Tooltip,
} from '@patternfly/react-core';
import { CopyIcon, WrenchIcon } from '@patternfly/react-icons';

import { useTranslation } from '../hooks/useTranslation';
import { ToolCall } from '../types';

interface ToolCallContentProps {
  toolCall: ToolCall;
}

/**
 * Lightweight component for rendering tool call expandable content.
 * Used inside PatternFly's ToolCall component's expandableContent prop.
 */
export const ToolCallContent = ({ toolCall }: ToolCallContentProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

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
  const parameterKeys = getParameterKeys();

  return (
    <Flex
      direction={{ default: 'column' }}
      spaceItems={{ default: 'spaceItemsSm' }}
    >
      {/* Thinking Time */}
      {thinkingTime > 0 && (
        <FlexItem>
          <Content component={ContentVariants.small}>
            {t('toolCall.thinking' as any, {
              seconds: String(thinkingTime),
            })}
          </Content>
        </FlexItem>
      )}

      {/* Summary */}
      <FlexItem>
        <Content component={ContentVariants.p}>{t('toolCall.summary')}</Content>
      </FlexItem>

      {/* Tool Header with MCP Server */}
      <FlexItem>
        <div
          style={{
            border: '1px solid var(--pf-t--global--border--color--default)',
            borderRadius: 'var(--pf-t--global--border--radius--small)',
            padding: 'var(--pf-t--global--spacer--md)',
          }}
        >
          <Flex
            direction={{ default: 'column' }}
            spaceItems={{ default: 'spaceItemsSm' }}
          >
            <FlexItem
              style={{
                borderBottom:
                  '1px solid var(--pf-t--global--border--color--default)',
                paddingBottom: 'var(--pf-t--global--spacer--sm)',
              }}
            >
              <Content
                component={ContentVariants.p}
                style={{ marginBlockEnd: 0 }}
              >
                <WrenchIcon
                  style={{
                    color: 'var(--pf-t--global--icon--color--brand--default)',
                    marginRight: '0.5em',
                  }}
                />
                <strong>{t('toolCall.mcpServer')}</strong>
              </Content>
              {toolCall.executionTime !== undefined && (
                <Content component={ContentVariants.small}>
                  {t('toolCall.executionTime')}
                  {formatExecutionTime(toolCall.executionTime)}
                </Content>
              )}
            </FlexItem>

            {/* Description List for Parameters and Response */}
            <FlexItem>
              <DescriptionList
                style={
                  {
                    '--pf-v6-c-description-list--RowGap':
                      'var(--pf-t--global--spacer--md)',
                  } as any
                }
                aria-label="Tool response"
              >
                {/* Parameters Section */}
                {parameterKeys.length > 0 && (
                  <DescriptionListGroup
                    style={
                      {
                        '--pf-v6-c-description-list__group--RowGap':
                          'var(--pf-t--global--spacer--xs)',
                      } as any
                    }
                  >
                    <DescriptionListTerm>
                      {t('toolCall.parameters' as any, {
                        defaultValue: 'Parameters',
                      }) || 'Parameters'}
                    </DescriptionListTerm>
                    <DescriptionListDescription
                      style={{ marginInlineStart: 0 }}
                    >
                      <Flex direction={{ default: 'column' }}>
                        {toolCall.description && (
                          <FlexItem>
                            <Content component={ContentVariants.small}>
                              {toolCall.description}
                            </Content>
                          </FlexItem>
                        )}
                        <FlexItem>
                          <Flex
                            gap={{ default: 'gapSm' }}
                            flexWrap={{ default: 'wrap' }}
                          >
                            {parameterKeys.map(key => (
                              <FlexItem key={key}>
                                <Label variant="outline" color="blue">
                                  {key}
                                </Label>
                              </FlexItem>
                            ))}
                          </Flex>
                        </FlexItem>
                      </Flex>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {/* Response Section */}
                {toolCall.response && (
                  <DescriptionListGroup
                    style={
                      {
                        '--pf-v6-c-description-list__group--RowGap':
                          'var(--pf-t--global--spacer--xs)',
                      } as any
                    }
                  >
                    {/* <DescriptionListTerm> */}
                    <Flex
                      alignItems={{ default: 'alignItemsCenter' }}
                      justifyContent={{ default: 'justifyContentSpaceBetween' }}
                    >
                      <FlexItem flex={{ default: 'flex_1' }}>
                        <strong> {t('toolCall.response')}</strong>
                      </FlexItem>
                      <FlexItem>
                        <Tooltip content={t('toolCall.copyResponse')}>
                          <Button
                            variant="plain"
                            aria-label={t('toolCall.copyResponse')}
                            onClick={handleCopy}
                            icon={<CopyIcon />}
                          />
                        </Tooltip>
                      </FlexItem>
                    </Flex>
                    {/* </DescriptionListTerm> */}
                    <DescriptionListDescription
                      style={{ marginInlineStart: 0 }}
                    >
                      <Flex
                        direction={{ default: 'column' }}
                        spaceItems={{ default: 'spaceItemsXs' }}
                      >
                        <FlexItem>
                          <div
                            style={{
                              fontFamily:
                                'Red Hat Mono, Monaco, Consolas, monospace',
                              fontSize: '0.875rem',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              padding: 'var(--pf-t--global--spacer--sm)',
                              borderRadius:
                                'var(--pf-t--global--border--radius--small)',
                              maxHeight: isExpanded ? '300px' : '105px',
                              overflowY: 'auto',
                              transition: 'max-height 0.3s ease',
                            }}
                          >
                            {toolCall.response}
                          </div>
                        </FlexItem>
                        {toolCall.response.length > 300 && (
                          <FlexItem>
                            <Button
                              variant="link"
                              isInline
                              onClick={() => setIsExpanded(!isExpanded)}
                            >
                              {isExpanded
                                ? t('toolCall.showLess')
                                : t('toolCall.showMore')}
                            </Button>
                          </FlexItem>
                        )}
                      </Flex>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </FlexItem>
          </Flex>
        </div>
      </FlexItem>
    </Flex>
  );
};

export default ToolCallContent;
