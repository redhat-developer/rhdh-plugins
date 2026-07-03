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

import { makeStyles } from '@material-ui/core';
import { SourcesCardProps } from '@patternfly/chatbot';
import { Button, Popover } from '@patternfly/react-core';
import { InfoCircleIcon, LinkIcon } from '@patternfly/react-icons';

import { useTranslation } from '../hooks/useTranslation';
import { FileTypeIcon } from './notebooks/FileTypeIcon';

const POPOVER_WIDTH = '400px';

const useStyles = makeStyles(theme => ({
  sourcesPopover: {
    '& .pf-v6-c-popover__title': {
      alignItems: 'flex-start',
    },
    '& .pf-v6-c-popover__title-text': {
      margin: 0,
    },
    '& .pf-v6-c-popover__header': {
      paddingBlockEnd: theme.spacing(2),
    },
    '& .pf-v6-c-popover__body': {
      paddingBlockStart: 0,
    },
  },
  chipButton: {
    padding: '4px 12px',
    fontSize: '0.8125rem',
    fontWeight: 500,
    borderRadius: 16,
    backgroundColor: 'transparent',
    color: 'var(--pf-t--global--text--color--regular, #1b1d21)',
    '&:hover': {
      backgroundColor:
        'var(--pf-t--global--background--color--secondary--default, #e0e0e0)',
    },
    '& .pf-v6-c-button__icon': {
      color: 'inherit',
    },
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
    fontSize: '0.8125rem',
    color: 'var(--pf-t--global--text--color--subtle, #c7c7c7)',
  },
  infoIcon: {
    flexShrink: 0,
    marginTop: 2,
    fontSize: '0.875rem',
    color: 'var(--pf-t--global--icon--color--status--info--default, #2b9af3)',
  },
  sourcesList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    maxHeight: 320,
    overflowY: 'auto',
  },
  sourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: `${theme.spacing(1.5)}px 0`,
    borderBottom: '1px solid var(--pf-t--global--border--color--default, #444)',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  sourceContent: {
    flex: 1,
    minWidth: 0,
  },
  sourceTitleButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    padding: 0,
    font: 'inherit',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--pf-t--global--text--color--link--default, #2b9af3)',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  sourceTitlePlain: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  sourceBody: {
    fontSize: '0.8125rem',
    color: 'var(--pf-t--global--text--color--subtle, #c7c7c7)',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
}));

type SourcesChipModalProps = {
  sources: SourcesCardProps;
};

export const SourcesChipModal = ({ sources }: SourcesChipModalProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const count = sources.sources?.length ?? 0;
  if (count === 0) return null;

  const handleSourceClick = (link: string, isExternal?: boolean) => {
    if (link) {
      window.open(
        link,
        isExternal ? '_blank' : '_self',
        isExternal ? 'noreferrer' : undefined,
      );
    }
  };

  return (
    <Popover
      className={classes.sourcesPopover}
      position="top-start"
      triggerAction="click"
      aria-label={t('sources.modal.title')}
      headerContent={t('sources.modal.title')}
      headerIcon={<LinkIcon />}
      closeBtnAriaLabel={t('sources.popover.closeAriaLabel')}
      minWidth={POPOVER_WIDTH}
      maxWidth={POPOVER_WIDTH}
      appendTo={() => document.body}
      bodyContent={
        <>
          <div className={classes.infoRow}>
            <InfoCircleIcon className={classes.infoIcon} />
            <span>{t('sources.modal.description')}</span>
          </div>
          <ul className={classes.sourcesList}>
            {sources.sources.map((source, index) => {
              const title = source.title ?? `Source ${index + 1}`;
              return (
                <li
                  key={`${source.title}-${index}`}
                  className={classes.sourceItem}
                >
                  <FileTypeIcon fileName={title} />
                  <div className={classes.sourceContent}>
                    {source.link ? (
                      <button
                        type="button"
                        className={classes.sourceTitleButton}
                        onClick={() =>
                          handleSourceClick(source.link, source.isExternal)
                        }
                      >
                        {title}
                      </button>
                    ) : (
                      <div className={classes.sourceTitlePlain}>{title}</div>
                    )}
                    {source.body && (
                      <div className={classes.sourceBody}>{source.body}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      }
    >
      <Button variant="link" icon={<LinkIcon />} className={classes.chipButton}>
        {(t as Function)('sources.chip.label', { count: String(count) })}
      </Button>
    </Popover>
  );
};
