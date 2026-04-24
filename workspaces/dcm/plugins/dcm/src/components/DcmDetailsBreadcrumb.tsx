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

import { Breadcrumbs, Link } from '@backstage/core-components';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  captionText: { fontSize: '10px' },
});

type DcmDetailsBreadcrumbProps = Readonly<{
  homePath: string;
  currentLabel: string;
  className?: string;
}>;

/** Shared breadcrumb for DCM details pages. */
export function DcmDetailsBreadcrumb({
  homePath,
  currentLabel,
  className,
}: DcmDetailsBreadcrumbProps) {
  const classes = useStyles();
  return (
    <Breadcrumbs aria-label="breadcrumb" separator="/" className={className}>
      <Link to={homePath}>Data Center</Link>
      <Typography
        variant="caption"
        color="textSecondary"
        className={classes.captionText}
      >
        {currentLabel}
      </Typography>
    </Breadcrumbs>
  );
}
