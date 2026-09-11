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

import { useEffect, useRef, useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Text,
  VisuallyHidden,
} from '@backstage/ui';
import {
  RiCheckLine,
  RiDownload2Line,
  RiExternalLinkLine,
  RiFileCopyLine,
} from '@remixicon/react';

import { useTranslation } from '../../../hooks/useTranslation';
import { getUsageAction } from '../../../utils/usageActions';
import styles from './UsageCard.module.css';

const COPY_FEEDBACK_MS = 2000;

function CopyCommand({ value }: { value: string }) {
  const { t } = useTranslation();
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
        resetTimer.current = undefined;
      }
    };
  }, []);

  const handleCopy = async () => {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = undefined;
    }

    if (!navigator.clipboard?.writeText) {
      setCopyState('failed');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopyState('copied');
      resetTimer.current = setTimeout(() => {
        setCopyState('idle');
        resetTimer.current = undefined;
      }, COPY_FEEDBACK_MS);
    } catch {
      setCopyState('failed');
    }
  };

  let feedback = '';
  if (copyState === 'copied') feedback = t('catalog.card.copied');
  if (copyState === 'failed') feedback = t('catalog.card.copyFailed');

  return (
    <>
      <div className={styles.commandBlock}>
        <pre className={styles.command}>
          <code>{value}</code>
        </pre>
        <Button
          variant="tertiary"
          size="small"
          onPress={handleCopy}
          iconStart={
            copyState === 'copied' ? (
              <RiCheckLine size={16} />
            ) : (
              <RiFileCopyLine size={16} />
            )
          }
        >
          {copyState === 'copied'
            ? t('catalog.card.copied')
            : t('catalog.card.copyCommand')}
        </Button>
      </div>
      {copyState === 'failed' && (
        <Text variant="body-x-small" color="danger">
          {t('catalog.card.copyFailed')}
        </Text>
      )}
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        {feedback}
      </VisuallyHidden>
    </>
  );
}

export const UsageCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();

  const action = getUsageAction(entity);

  if (!action) return null;

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">{t('catalog.card.usageTitle')}</Text>
      </CardHeader>
      <CardBody>
        {action.type === 'copy' ? (
          <CopyCommand value={action.value} />
        ) : (
          <Button
            variant="tertiary"
            onPress={() =>
              window.open(action.value, '_blank', 'noopener,noreferrer')
            }
            iconStart={
              action.linkType === 'source' ? (
                <RiExternalLinkLine size={16} />
              ) : (
                <RiDownload2Line size={16} />
              )
            }
          >
            {action.linkType === 'source'
              ? t('catalog.card.usageViewSource')
              : t('catalog.card.usageDownloadZip')}
          </Button>
        )}
      </CardBody>
    </Card>
  );
};
