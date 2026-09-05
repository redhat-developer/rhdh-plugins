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

import { styled } from '@mui/material/styles';
import { SourcesCardProps } from '@patternfly/chatbot';
import {
  Button,
  HelperText,
  HelperTextItem,
  List,
  ListItem,
  Popover,
  Tooltip,
} from '@patternfly/react-core';
import { InfoCircleIcon, LinkIcon } from '@patternfly/react-icons';

import { useTranslation } from '../hooks/useTranslation';
import { FileTypeIcon } from './notebooks/FileTypeIcon';

const POPOVER_WIDTH = '400px';

const StyledPopover = styled(Popover)(({ theme }) => ({
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
}));

const ChipButton = styled(Button)({
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
});

const SourcesHelperText = styled(HelperText)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  color: 'var(--pf-t--global--text--color--subtle, #c7c7c7)',
}));

const SourcesList = styled(List)({
  maxHeight: 320,
  overflowY: 'auto',
});

const SourceItem = styled(ListItem)({
  alignItems: 'center',
  '& .pf-v6-c-list__item-text': {
    minWidth: 0,
  },
});

const SourceContent = styled('div')({
  flex: 1,
  minWidth: 0,
});

const SourceTitle = styled('div')({
  fontSize: '0.875rem',
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const SourceBody = styled('div')({
  fontSize: '0.8125rem',
  color: 'var(--pf-t--global--text--color--subtle, #c7c7c7)',
  marginTop: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
});

type SourcesChipModalProps = {
  sources: SourcesCardProps;
};

export const SourcesChipModal = ({ sources }: SourcesChipModalProps) => {
  const { t } = useTranslation();

  const count = sources.sources?.length ?? 0;
  if (count === 0) return null;

  return (
    <StyledPopover
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
          <SourcesHelperText>
            <HelperTextItem variant="indeterminate" icon={<InfoCircleIcon />}>
              {t('sources.modal.description')}
            </HelperTextItem>
          </SourcesHelperText>
          <SourcesList isPlain aria-label={t('sources.modal.title')}>
            {sources.sources.map((source, index) => {
              const title = source.title ?? `Source ${index + 1}`;
              return (
                <SourceItem
                  key={`${source.title}-${index}`}
                  icon={<FileTypeIcon fileName={title} />}
                >
                  <SourceContent>
                    <Tooltip content={title}>
                      <SourceTitle>{title}</SourceTitle>
                    </Tooltip>
                    {source.body && <SourceBody>{source.body}</SourceBody>}
                  </SourceContent>
                </SourceItem>
              );
            })}
          </SourcesList>
        </>
      }
    >
      <ChipButton variant="link" icon={<LinkIcon />}>
        {(t as Function)('sources.chip.label', { count })}
      </ChipButton>
    </StyledPopover>
  );
};
