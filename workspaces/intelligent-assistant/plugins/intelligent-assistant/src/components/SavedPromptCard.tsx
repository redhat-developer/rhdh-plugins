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
import { Content, ContentVariants, Tooltip } from '@patternfly/react-core';
import { makeStyles } from 'tss-react/mui';

import { SavedPrompt } from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import {
  SavedPromptKebabMenu,
  SavedPromptKebabVariant,
} from './SavedPromptKebabMenu';

type SavedPromptCardProps = {
  prompt: SavedPrompt;
  variant: SavedPromptKebabVariant;
  onApplyToInput?: (content: string) => void;
  onSendDirectly: (content: string) => void;
  onDelete: (prompt: SavedPrompt) => void;
  isSendDirectlyDisabled?: boolean;
};

const useStyles = makeStyles()(theme => ({
  card: {
    padding: `${theme.spacing(1.5)} 0`,
    borderBottom: '1px solid var(--pf-t--global--border--color--default)',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  content: {
    flex: '1 1 0%',
    minWidth: 0,
  },
  title: {
    margin: 0,
    marginBottom: theme.spacing(0.5),
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  body: {
    margin: 0,
    marginBottom: theme.spacing(0.5),
    color: 'var(--pf-t--global--text--color--subtle) !important',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  date: {
    margin: 0,
    color: 'var(--pf-t--global--text--color--disabled) !important',
  },
  actions: {
    flexShrink: 0,
  },
}));

const formatSavedDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
};

export const SavedPromptCard = ({
  prompt,
  variant,
  onApplyToInput,
  onSendDirectly,
  onDelete,
  isSendDirectlyDisabled,
}: SavedPromptCardProps) => {
  const { classes } = useStyles();

  return (
    <div
      className={classes.card}
      data-testid={`saved-prompt-card-${prompt.id}`}
    >
      <div className={classes.row}>
        <div className={classes.content}>
          <Tooltip content={prompt.name}>
            <Content component={ContentVariants.p} className={classes.title}>
              {prompt.name}
            </Content>
          </Tooltip>
          <Tooltip content={prompt.content}>
            <Content component={ContentVariants.p} className={classes.body}>
              {prompt.content}
            </Content>
          </Tooltip>
          <Content component={ContentVariants.small} className={classes.date}>
            {formatSavedDate(prompt.created_at)}
          </Content>
        </div>
        <div className={classes.actions}>
          <SavedPromptKebabMenu
            prompt={prompt}
            variant={variant}
            onApplyToInput={onApplyToInput}
            onSendDirectly={onSendDirectly}
            onDelete={onDelete}
            isSendDirectlyDisabled={isSendDirectlyDisabled}
          />
        </div>
      </div>
    </div>
  );
};
