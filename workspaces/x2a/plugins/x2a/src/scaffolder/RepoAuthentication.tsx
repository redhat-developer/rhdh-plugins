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
 * See the License for the specific language governing permissions and limitations under the License.
 */

import {
  type CustomFieldValidator,
  FieldExtensionComponentProps,
  useTemplateSecrets,
} from '@backstage/plugin-scaffolder-react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  StatusError,
  StatusOK,
  StatusPending,
} from '@backstage/core-components';

import { useScmHostMap } from '../hooks/useScmHostMap';
import { useRepoAuthentication } from '../repoAuth';
import { type ProviderAuthStatus, useProviderAuth } from './useProviderAuth';

const useStyles = makeStyles(theme => ({
  errorText: {
    color: theme.palette.error.main,
  },
}));

const StatusIcon = ({
  status,
  children,
}: {
  status: ProviderAuthStatus;
  children?: React.ReactNode;
}) => {
  switch (status) {
    case 'authenticated':
      return <StatusOK>{children}</StatusOK>;
    case 'error':
      return <StatusError>{children}</StatusError>;
    default:
      return <StatusPending>{children}</StatusPending>;
  }
};

/**
 * RepoAuthentication extension requests authentication tokens for all the SCM providers
 * listed in the CSV bulk project import and stores them among scaffolder secrets.
 *
 * @public
 */
export const RepoAuthentication = ({
  onChange,
  formContext,
  uiSchema,
  schema,
}: FieldExtensionComponentProps<string>) => {
  const classes = useStyles();
  const hostProviderMap = useScmHostMap();
  const { secrets, setSecrets } = useTemplateSecrets();
  const { authenticate } = useRepoAuthentication();

  const { title, description } = schema;
  const csvFieldName =
    (uiSchema?.['ui:options']?.csvFieldName as string) || undefined;
  const csvContent = csvFieldName
    ? formContext?.formData?.[csvFieldName]
    : undefined;

  const { providerRows, retryProvider, parseError } = useProviderAuth({
    csvContent,
    hostProviderMap,
    authenticate,
    onChange,
    secrets: secrets as Record<string, string>,
    setSecrets,
  });

  return (
    <>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body1">{description}</Typography>

      {providerRows.length > 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Provider</TableCell>
                <TableCell>Access</TableCell>
                <TableCell>OAuth scope</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {providerRows.map(row => (
                <TableRow key={row.provider.name}>
                  <TableCell>{row.provider.name}</TableCell>
                  <TableCell>
                    {row.readOnly ? 'Read-only' : 'Read / Write'}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(row.scope)
                      ? row.scope.join(', ')
                      : row.scope}
                  </TableCell>
                  <TableCell>
                    <StatusIcon status={row.status}>
                      {row.error && (
                        <span className={classes.errorText}>{row.error}</span>
                      )}
                    </StatusIcon>
                  </TableCell>
                  <TableCell>
                    {row.status === 'error' && (
                      <Button
                        variant="text"
                        color="primary"
                        size="small"
                        onClick={() =>
                          retryProvider(row.provider, row.readOnly)
                        }
                      >
                        Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!csvFieldName && (
        <Typography variant="body1" color="error">
          CSV field name is required for RepoAuthentication extension
        </Typography>
      )}
      {!csvContent && (
        <Typography variant="body1" color="error">
          CSV content is required for RepoAuthentication extension
        </Typography>
      )}
      {parseError && (
        <Typography variant="body1" color="error">
          {parseError}
        </Typography>
      )}
    </>
  );
};

/**
 * Validation function for the RepoAuthentication scaffolder field extension.
 * Blocks wizard progression until all SCM providers are authenticated.
 *
 * @public
 */
export const repoAuthenticationValidation: CustomFieldValidator<string> = (
  data,
  field,
) => {
  if (!data) {
    field.addError(
      'Authentication with all SCM providers is required before proceeding',
    );
  }
};
