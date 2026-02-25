/**
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

import { Job } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { makeStyles } from '@material-ui/core';

import { formatRelativeTime } from '../tools';

const useStyles = makeStyles(theme => ({
  timing: {
    color: theme.palette.text.secondary,
  },
}));

export const TimingCell = ({ lastJob }: { lastJob: Job | undefined }) => {
  const classes = useStyles();

  if (!lastJob) {
    return <div className={classes.timing}>-</div>;
  }

  const timingText = formatRelativeTime(lastJob.startedAt, lastJob.finishedAt);
  return <div className={classes.timing}>{timingText}</div>;
};
