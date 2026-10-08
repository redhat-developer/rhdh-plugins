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

import type { CSSProperties, FunctionComponent } from 'react';

import type { WelcomePrompt } from '@patternfly/chatbot';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { CodeIcon } from '@patternfly/react-icons';

export type LightspeedWelcomePromptProps = {
  title: string;
  description: string;
  prompts?: WelcomePrompt[];
  className?: string;
  testId?: string;
  isCompact?: boolean;
  style?: CSSProperties;
};

/**
 * PatternFly ChatbotWelcomePrompt with icon affordances on suggestion cards.
 * Upstream WelcomePrompt has no icon slot; keep PF layout/classes and add icons here.
 */
export const LightspeedWelcomePrompt: FunctionComponent<
  LightspeedWelcomePromptProps
> = ({
  title,
  description,
  prompts,
  className,
  testId,
  isCompact = false,
  style,
  ...props
}) => (
  <div
    data-testid={testId}
    className={`pf-chatbot--layout--welcome ${isCompact ? 'pf-m-compact' : ''} ${className ?? ''}`}
    style={style}
    {...props}
  >
    <Content component={ContentVariants.h1}>
      <span className="pf-chatbot__hello">{title}</span>
      <br />
      <span className="pf-chatbot__question">{description}</span>
    </Content>

    {prompts && (
      <div className="pf-chatbot__prompt-suggestions">
        {prompts.map((prompt, index) => (
          <Card
            key={`welcome-prompt-${index}`}
            className="pf-chatbot__prompt-suggestion"
            isClickable
            isCompact={isCompact}
          >
            <CardHeader
              selectableActions={{
                onClickAction: prompt.onClick,
                selectableActionId: `welcome-prompt-input-${index}`,
                selectableActionAriaLabelledby: `welcome-prompt-title-${index}`,
              }}
            >
              <CardTitle id={`welcome-prompt-title-${index}`}>
                <span
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <CodeIcon
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      width: '1.25rem',
                      height: '1.25rem',
                      color: 'var(--pf-t--global--icon--color--brand--default)',
                    }}
                  />
                  {prompt.title}
                </span>
              </CardTitle>
            </CardHeader>
            {prompt.message && <CardBody>{prompt.message}</CardBody>}
          </Card>
        ))}
      </div>
    )}
  </div>
);
