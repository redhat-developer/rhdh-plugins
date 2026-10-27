/* Copyright Red Hat, Inc. */
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import type {
  AAPConfigAsCodeRequest,
  ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import {
  ConfigRepositoryPicker,
  ConfigRepositoryValue,
} from './ConfigRepositoryPicker';

const initialRepository: ConfigRepositoryValue = {
  repositoryUrl: '',
  repositoryBranch: 'main',
};

export const AAPConfigPublishDialog = ({
  open,
  organization,
  hostProviderMap,
  onClose,
  onPublish,
  onDirectPublish,
}: {
  open: boolean;
  organization: string;
  hostProviderMap: Map<string, ScmProviderName>;
  onClose: () => void;
  onPublish: (config: AAPConfigAsCodeRequest, token: string) => void;
  onDirectPublish: () => void;
}) => {
  const [repository, setRepository] = useState(initialRepository);
  const [organizationValue, setOrganizationValue] = useState(organization);
  const [directory, setDirectory] = useState('');
  const [inventory, setInventory] = useState('');
  const [scmCredential, setScmCredential] = useState('');
  const [credentials, setCredentials] = useState<string[]>([]);
  const [credentialInput, setCredentialInput] = useState('');
  const [executionEnvironment, setExecutionEnvironment] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      setRepository(initialRepository);
      setOrganizationValue(organization);
      setDirectory('');
      setInventory('');
      setScmCredential('');
      setCredentials([]);
      setCredentialInput('');
      setExecutionEnvironment('');
      setAdvanced(false);
      setError(undefined);
    }
  }, [open, organization]);

  const publish = useCallback(() => {
    if (!repository.repositoryUrl || !repository.token) {
      setError('Select and authenticate a configuration repository.');
    } else if (!organizationValue.trim()) {
      setError('AAP organization is required.');
    } else if (!directory.trim()) {
      setError('Configuration directory is required.');
    } else if (!inventory.trim()) {
      setError('Inventory is required.');
    } else {
      const repositoryToken = repository.token;
      onPublish(
        {
          organization: organizationValue.trim(),
          repositoryUrl: repository.repositoryUrl.trim(),
          repositoryBranch: repository.repositoryBranch.trim(),
          configurationDirectory: directory.trim(),
          inventory: inventory.trim(),
          scmCredentialName: scmCredential.trim() || undefined,
          jobCredentialNames: credentials,
          executionEnvironmentName: executionEnvironment.trim() || undefined,
        },
        repositoryToken,
      );
      setRepository(initialRepository);
    }
  }, [
    credentials,
    directory,
    executionEnvironment,
    inventory,
    organizationValue,
    onPublish,
    repository,
    scmCredential,
  ]);

  const handleClose = useCallback(() => {
    setRepository(initialRepository);
    setOrganizationValue(organization);
    onClose();
  }, [onClose, organization]);

  const handleDirectPublish = useCallback(() => {
    setRepository(initialRepository);
    setOrganizationValue(organization);
    onDirectPublish();
  }, [onDirectPublish, organization]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Publish AAP configuration to Git</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This creates a commit in Git. It does not apply the configuration to
          AAP.
        </DialogContentText>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography variant="subtitle2">Configuration repository</Typography>
        <ConfigRepositoryPicker
          open={open}
          hostProviderMap={hostProviderMap}
          value={repository}
          onChange={setRepository}
          onError={setError}
        />
        <TextField
          fullWidth
          required
          label="Configuration directory"
          value={directory}
          helperText="Contains controller_projects.yml and controller_job_templates.yml."
          onChange={event => setDirectory(event.target.value)}
          margin="dense"
        />
        <Typography variant="subtitle2" style={{ marginTop: 16 }}>
          AAP destination
        </Typography>
        <TextField
          fullWidth
          label="Organization"
          value={organizationValue}
          onChange={event => setOrganizationValue(event.target.value)}
          helperText="Used for the generated AAP configuration."
          margin="dense"
        />
        <TextField
          fullWidth
          required
          label="Inventory"
          value={inventory}
          onChange={event => setInventory(event.target.value)}
          margin="dense"
        />
        <Button onClick={() => setAdvanced(value => !value)}>
          {advanced ? 'Hide advanced' : 'Show advanced'}
        </Button>
        <Collapse in={advanced}>
          <TextField
            fullWidth
            label="Project SCM credential"
            value={scmCredential}
            helperText="An existing AAP Source Control credential."
            onChange={event => setScmCredential(event.target.value)}
            margin="dense"
          />
          <TextField
            fullWidth
            label="Job credentials"
            value={credentialInput}
            helperText="Press Enter after each existing AAP credential."
            onChange={event => setCredentialInput(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && credentialInput.trim()) {
                event.preventDefault();
                setCredentials([...credentials, credentialInput.trim()]);
                setCredentialInput('');
              }
            }}
            margin="dense"
          />
          {credentials.map(credential => (
            <Chip
              key={credential}
              label={credential}
              onDelete={() =>
                setCredentials(credentials.filter(item => item !== credential))
              }
            />
          ))}
          <TextField
            fullWidth
            label="Execution environment"
            value={executionEnvironment}
            onChange={event => setExecutionEnvironment(event.target.value)}
            margin="dense"
          />
        </Collapse>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDirectPublish}>Publish to AAP</Button>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={publish} color="primary" variant="contained">
          Publish configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};
