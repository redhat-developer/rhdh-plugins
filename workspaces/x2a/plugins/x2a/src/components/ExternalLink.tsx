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

import { ReactNode } from 'react';
import { Link } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core';
import LaunchIcon from '@material-ui/icons/Launch';

const useStyles = makeStyles({
  externalIcon: {
    marginLeft: 4,
    fontSize: 'inherit',
  },
});

export const ExternalLink = ({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) => {
  const classes = useStyles();

  return (
    <Link
      to={to}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <LaunchIcon className={classes.externalIcon} aria-hidden />
    </Link>
  );
};
