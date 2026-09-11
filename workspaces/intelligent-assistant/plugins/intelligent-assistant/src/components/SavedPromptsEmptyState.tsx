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
import { Button, Content, ContentVariants } from '@patternfly/react-core';
import { FileAltIcon } from '@patternfly/react-icons';
import { makeStyles } from 'tss-react/mui';

import { useTranslation } from '../hooks/useTranslation';

type SavedPromptsEmptyStateProps = {
  onNewPrompt: () => void;
};

const useStyles = makeStyles()(theme => ({
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: theme.spacing(3, 2),
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: 420,
  },
  icon: {
    fontSize: 48,
    color: 'var(--pf-t--global--icon--color--subtle)',
    marginBottom: theme.spacing(1.5),
  },
  title: {
    margin: 0,
    marginBottom: theme.spacing(1),
    fontWeight: 600,
  },
  description: {
    margin: 0,
    marginBottom: theme.spacing(3),
    color: 'var(--pf-t--global--text--color--subtle)',
  },
  action: {
    borderRadius: 999,
  },
}));

export const SavedPromptsEmptyState = ({
  onNewPrompt,
}: SavedPromptsEmptyStateProps) => {
  const { classes } = useStyles();
  const { t } = useTranslation();

  return (
    <div className={classes.root} data-testid="saved-prompts-empty-state">
      <div className={classes.inner}>
        <FileAltIcon className={classes.icon} aria-hidden />
        <Content component={ContentVariants.p} className={classes.title}>
          {t('savedPrompts.count.zero')}
        </Content>
        <Content component={ContentVariants.p} className={classes.description}>
          {t('savedPrompts.empty.description')}
        </Content>
        <Button
          variant="secondary"
          className={classes.action}
          onClick={onNewPrompt}
        >
          {t('savedPrompts.newPrompt')}
        </Button>
      </div>
    </div>
  );
};
