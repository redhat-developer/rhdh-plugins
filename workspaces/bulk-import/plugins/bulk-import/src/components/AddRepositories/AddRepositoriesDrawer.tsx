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

import { useEffect, useState } from 'react';

import { Link } from '@backstage/core-components';

import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../hooks/useTranslation';
import {
  AddedRepositories,
  AddRepositoriesFormValues,
  AddRepositoryData,
} from '../../types';
import { urlHelper } from '../../utils/repository-utils';
import { AddRepositoriesTableToolbar } from './AddRepositoriesTableToolbar';
import { RepositoriesTable } from './RepositoriesTable';

const useStyles = makeStyles({
  drawerPaper: {
    ['@media (max-width: 960px)']: {
      '& > div[class*="MuiDrawer-paper-"]': {
        width: '-webkit-fill-available',
      },
    },
  },
  drawerContainer: {
    padding: '20px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
});

export const AddRepositoriesDrawer = ({
  open,
  onClose,
  onSelect,
  title,
  orgData,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (repos: AddedRepositories) => void;
  title: string;
  orgData: AddRepositoryData;
}) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const { values, status, setStatus } =
    useFormikContext<AddRepositoriesFormValues>();
  const [searchString, setSearchString] = useState<string>('');
  const [selectedRepos, setSelectedRepos] = useState<AddedRepositories>({});

  const updateSelectedReposInDrawer = (repos: AddedRepositories) => {
    setSelectedRepos(repos);
  };

  const handleSelectRepoFromDrawer = (selected: AddedRepositories) => {
    onSelect(selected);
    const newStatus = { ...(status?.errors || {}) };
    Object.keys(newStatus).forEach(s => {
      if (!Object.keys(selected).find(sel => sel === s)) {
        delete newStatus[s];
      }
    });
    setStatus({ ...status, errors: newStatus });
    onClose();
  };

  useEffect(() => {
    const sr = Object.values(values.repositories).reduce(
      (acc, repo) =>
        repo.orgName === orgData?.orgName ? { ...acc, [repo.id]: repo } : acc,
      {},
    );
    setSelectedRepos(sr);
  }, [orgData?.orgName, values.repositories]);

  return (
    <Drawer
      anchor="right"
      open={open}
      variant="temporary"
      className={classes.drawerPaper}
      onClose={onClose}
    >
      <Container className={classes.drawerContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Typography variant="h5">{orgData?.orgName}</Typography>
            <Link to={orgData?.organizationUrl || ''}>
              {urlHelper(orgData?.organizationUrl || '')}
              <OpenInNewIcon
                style={{ verticalAlign: 'sub', paddingTop: '7px' }}
              />
            </Link>
          </div>
          <div>
            <IconButton onClick={onClose} className="align-right" size="large">
              <CloseIcon />
            </IconButton>
          </div>
        </div>
        <Card style={{ marginTop: '20px', marginBottom: '60px' }}>
          <AddRepositoriesTableToolbar
            title={title}
            setSearchString={setSearchString}
            selectedReposFromDrawer={selectedRepos}
            activeOrganization={orgData?.orgName}
          />
          <RepositoriesTable
            searchString={searchString}
            updateSelectedReposInDrawer={updateSelectedReposInDrawer}
            drawerOrganization={orgData?.orgName}
          />
        </Card>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'right',
            mt: 2,
            position: 'fixed',
            bottom: '20px',
          }}
        >
          <Typography component="span">
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleSelectRepoFromDrawer(selectedRepos)}
              sx={{
                mr: 1,
              }}
              data-testid="select-from-drawer"
            >
              {t('common.select')}
            </Button>
          </Typography>
          <Typography component="span">
            <Button
              data-testid="close-drawer"
              variant="outlined"
              onClick={onClose}
            >
              {t('common.cancel')}
            </Button>
          </Typography>
        </Box>
      </Container>
    </Drawer>
  );
};
