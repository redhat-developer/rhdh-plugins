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

import { Tooltip } from '@patternfly/react-core';
import * as dateTime from './datetime';
import { Typography } from '@material-ui/core';

export type TimestampProps = {
  timestamp: string | number;
  isUnix?: boolean;
  simple?: boolean;
  omitSuffix?: boolean;
  className?: string;
};

const timestampFor = (mdate: Date, now: Date, omitSuffix: boolean) => {
  if (!dateTime.isValid(mdate)) {
    return '-';
  }

  const timeDifference = now.getTime() - mdate.getTime();
  if (omitSuffix) {
    return dateTime.fromNow(mdate, undefined, { omitSuffix: true });
  }

  // Show a relative time if within 10.5 minutes in the past from the current time.
  if (timeDifference > dateTime.maxClockSkewMS && timeDifference < 630000) {
    return dateTime.fromNow(mdate);
  }

  // Apr 23, 2021, 4:33 PM
  return dateTime.dateTimeFormatter.format(mdate);
};

export const Timestamp: React.FC<React.PropsWithChildren<TimestampProps>> = ({
  timestamp,
  isUnix,
  omitSuffix,
  simple,
  className,
}) => {
  // Check for null. If props.timestamp is null, it returns incorrect date and time of Wed Dec 31 1969 19:00:00 GMT-0500 (Eastern Standard Time)
  if (!timestamp) {
    return <div>-</div>;
  }

  const mdate = isUnix
    ? new Date((timestamp as number) * 1000)
    : new Date(timestamp);

  const timeStamp = timestampFor(mdate, new Date(), !!omitSuffix);

  if (!dateTime.isValid(mdate)) {
    return <div>-</div>;
  }

  if (simple) {
    return <>{timeStamp}</>;
  }

  return (
    <div className={className}>
      <Tooltip
        content={[
          <Typography className="nowrap" key={timestamp}>
            {dateTime.utcDateTimeFormatter.format(mdate)}
          </Typography>,
        ]}
      >
        <Typography data-test="timestamp">{timeStamp}</Typography>
      </Tooltip>
    </div>
  );
};

Timestamp.displayName = 'Timestamp';
