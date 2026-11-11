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

import { Box, ButtonLink, Flex, Text } from '@backstage/ui';

import { useTranslation } from '../hooks/useTranslation';

export type QuickstartFooterProps = {
  handleDrawerClose: () => void;
  progress: number;
};

/**
 * Hide uses ButtonLink (theme → PatternFly link / text style).
 * Progress bar uses BUI tokens via inline layout (no Progress component in BUI).
 */
export const QuickstartFooter = ({
  handleDrawerClose,
  progress,
}: QuickstartFooterProps) => {
  const { t } = useTranslation();
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const progressLabel =
    safeProgress > 0
      ? t('footer.progress' as any, { progress: safeProgress.toString() })
      : t('footer.notStarted');

  return (
    <div>
      <Box
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeProgress}
        aria-label={progressLabel}
        style={{
          height: 4,
          width: '100%',
          backgroundColor: 'var(--bui-bg-neutral-2)',
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            height: '100%',
            width: `${safeProgress}%`,
            backgroundColor: 'var(--bui-accent-bg)',
            transition: 'width 0.2s ease',
          }}
        >
          {null}
        </Box>
      </Box>
      <Flex align="center" justify="between" p="5">
        <Text variant="body-small">{progressLabel}</Text>
        <ButtonLink
          href="#"
          style={{ fontWeight: 400 }}
          onClick={event => {
            event.preventDefault();
          }}
          onPress={() => handleDrawerClose()}
        >
          {t('footer.hide')}
        </ButtonLink>
      </Flex>
    </div>
  );
};
