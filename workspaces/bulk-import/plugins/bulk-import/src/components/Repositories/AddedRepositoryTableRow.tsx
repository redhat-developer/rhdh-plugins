/*
 * Copyright 2024 The Backstage Authors
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
import * as React from 'react';

import { Link } from '@backstage/core-components';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { makeStyles } from '@mui/styles';
import { useFormikContext } from 'formik';

import { AddRepositoriesFormValues, AddRepositoryData } from '../../types';
import {
  calculateLastUpdated,
  getImportStatus,
  urlHelper,
} from '../../utils/repository-utils';
import CatalogInfoAction from './CatalogInfoAction';
import DeleteRepository from './DeleteRepository';
import SyncRepository from './SyncRepository';

const useStyles = makeStyles(() => ({
  tableCellStyle: {
    lineHeight: '1.5rem',
    fontSize: '0.875rem',
  },
}));

const ImportStatus = ({ data }: { data: AddRepositoryData }) => {
  const { values } = useFormikContext<AddRepositoriesFormValues>();
  return getImportStatus(
    values.repositories?.[data.id]?.catalogInfoYaml?.status as string,
    true,
    values.repositories?.[data.id]?.catalogInfoYaml?.pullRequest as string,
  );
};

const LastUpdated = ({ data }: { data: AddRepositoryData }) => {
  const { values } = useFormikContext<AddRepositoriesFormValues>();
  return calculateLastUpdated(
    values.repositories?.[data.id]?.catalogInfoYaml?.lastUpdated || '',
  );
};

export const AddedRepositoryTableRow = ({
  data,
}: {
  data: AddRepositoryData;
}) => {
  const classes = useStyles();

  return (
    <TableRow hover>
      <TableCell component="th" scope="row" className={classes.tableCellStyle}>
        {data.repoName}
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        {data?.repoUrl ? (
          <Link to={data.repoUrl}>
            {urlHelper(data.repoUrl)}
            <OpenInNewIcon
              style={{ verticalAlign: 'sub', paddingTop: '7px' }}
            />
          </Link>
        ) : (
          <>-</>
        )}
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        {data?.organizationUrl ? (
          <Link to={data.organizationUrl}>
            {data.orgName}
            <OpenInNewIcon
              style={{ verticalAlign: 'sub', paddingTop: '7px' }}
            />
          </Link>
        ) : (
          <>-</>
        )}
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        <ImportStatus data={data} />
      </TableCell>

      <TableCell align="left" className={classes.tableCellStyle}>
        <LastUpdated data={data} />
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        <CatalogInfoAction data={data} />
        <DeleteRepository data={data} />
        <SyncRepository data={data} />
      </TableCell>
    </TableRow>
  );
};
