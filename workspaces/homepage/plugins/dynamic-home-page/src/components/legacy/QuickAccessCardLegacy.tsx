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

import { InfoCard } from '@backstage/core-components';

import { styled } from '@mui/material/styles';

import {
  QuickAccessCardContent,
  type QuickAccessCardProps,
} from '../QuickAccessCard';
import { useTranslation } from '../../hooks/useTranslation';

const QuickAccessInfoCard = styled(InfoCard)({
  '& div > div > div > div > p': {
    textTransform: 'uppercase',
  },
});

/** @public */
export const QuickAccessCard = (props: QuickAccessCardProps) => {
  const { t } = useTranslation();

  return (
    <QuickAccessInfoCard
      title={props.title ?? t('quickAccess.title')}
      noPadding
    >
      <QuickAccessCardContent path={props.path} />
    </QuickAccessInfoCard>
  );
};
