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

import { useMemo } from 'react';
import {
  DCM_REQUEST_HISTORY_COLUMNS,
  DcmRequestHistoryTableCard,
  useDcmRequestHistoryListState,
} from '../../../components/DcmRequestHistoryTable';
import {
  MOCK_REQUEST_HISTORY,
  type Environment,
  type RequestHistoryRow,
} from '../../../data/environments';
import { useDcmStyles } from '../../../components/dcmStyles';

export function RequestHistoryTab(props: Readonly<{ env: Environment }>) {
  const { env } = props;
  const classes = useDcmStyles();

  const allHistoryForEnv = useMemo(
    () => MOCK_REQUEST_HISTORY.filter(h => h.envId === env.id),
    [env.id],
  );

  const tableState =
    useDcmRequestHistoryListState<RequestHistoryRow>(allHistoryForEnv);

  return (
    <DcmRequestHistoryTableCard
      {...tableState}
      columns={DCM_REQUEST_HISTORY_COLUMNS}
      classes={classes}
    />
  );
}
