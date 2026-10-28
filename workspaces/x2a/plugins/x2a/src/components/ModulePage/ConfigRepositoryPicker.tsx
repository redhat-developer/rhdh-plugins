/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { MenuItem, TextField } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useApi } from '@backstage/core-plugin-api';
import { scmAuthApiRef } from '@backstage/integration-react';
import { scaffolderApiRef } from '@backstage/plugin-scaffolder-react';
import {
  normalizeRepoUrl,
  resolveScmProvider,
  ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export interface ConfigRepositoryValue {
  repositoryUrl: string;
  repositoryBranch: string;
  token?: string;
}

type Result = { id: string; title?: string };

export const ConfigRepositoryPicker = ({
  hostProviderMap,
  open,
  value,
  onChange,
  onError,
}: {
  hostProviderMap: Map<string, ScmProviderName>;
  open: boolean;
  value: ConfigRepositoryValue;
  onChange: (value: ConfigRepositoryValue) => void;
  onError: (message?: string) => void;
}) => {
  const scaffolderApi = useApi(scaffolderApiRef);
  const scmAuth = useApi(scmAuthApiRef);
  const hosts = useMemo(
    () => Array.from(hostProviderMap.keys()),
    [hostProviderMap],
  );
  const [host, setHost] = useState(hosts[0] ?? '');
  const [token, setToken] = useState<string>();
  const [owner, setOwner] = useState('');
  const [project, setProject] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [selectedRepositoryUrl, setSelectedRepositoryUrl] = useState<
    string | undefined
  >();
  const [owners, setOwners] = useState<Result[]>([]);
  const [projects, setProjects] = useState<Result[]>([]);
  const [repositories, setRepositories] = useState<Result[]>([]);
  const ownersRef = useRef<Result[]>([]);

  useEffect(() => {
    if (!host && hosts.length > 0) setHost(hosts[0]);
  }, [host, hosts]);

  const provider = hostProviderMap.get(host);
  const apiProvider = provider === 'bitbucket' ? 'bitbucket-cloud' : provider;

  useEffect(() => {
    if (!open) {
      setToken(undefined);
      setOwner('');
      setProject('');
      setManualUrl('');
      setSelectedRepositoryUrl(undefined);
      ownersRef.current = [];
      setOwners([]);
      setProjects([]);
      setRepositories([]);
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    if (open && host && provider) {
      setToken(undefined);
      setOwner('');
      setProject('');
      setSelectedRepositoryUrl(undefined);
      ownersRef.current = [];
      setOwners([]);
      setProjects([]);
      setRepositories([]);
      void scmAuth
        .getCredentials({
          url: `https://${host}`,
          additionalScope: { repoWrite: true },
        })
        .then(result => {
          if (!cancelled) setToken(result.token);
        })
        .catch(error => {
          if (!cancelled)
            onError(
              error instanceof Error
                ? error.message
                : 'SCM authentication failed',
            );
        });
    }
    return () => {
      cancelled = true;
    };
  }, [host, onError, open, provider, scmAuth]);

  useEffect(() => {
    let cancelled = false;
    const autocomplete = (resource: string, context: Record<string, string>) =>
      scaffolderApi.autocomplete({
        token: token!,
        provider: apiProvider!,
        resource,
        context,
      });

    const loadGitHub = async () => {
      const result = await autocomplete('repositoriesWithOwner', { host });
      if (cancelled) return;

      setRepositories(result.results);
      const nextOwners = Array.from(
        new Set(result.results.map(item => item.id.split('/')[0])),
      ).map(id => ({ id }));
      ownersRef.current = nextOwners;
      setOwners(nextOwners);
    };

    const loadGitLab = async () => {
      if (!owner) {
        const result = await autocomplete('groups', { host });
        if (!cancelled) {
          ownersRef.current = result.results;
          setOwners(result.results);
        }
        return;
      }

      const group = ownersRef.current.find(
        item => (item.title ?? item.id) === owner,
      );
      const result = await autocomplete('repositories', {
        host,
        id: group?.id ?? owner,
      });
      if (!cancelled) setRepositories(result.results);
    };

    const loadBitbucket = async () => {
      if (!owner) {
        const result = await autocomplete('workspaces', {});
        if (!cancelled) setOwners(result.results);
        return;
      }
      if (!project) {
        const result = await autocomplete('projects', { workspace: owner });
        if (!cancelled) setProjects(result.results);
        return;
      }

      const result = await autocomplete('repositories', {
        workspace: owner,
        project,
      });
      if (!cancelled) setRepositories(result.results);
    };

    const load = async () => {
      try {
        if (provider === 'github') {
          await loadGitHub();
        } else if (provider === 'gitlab') {
          await loadGitLab();
        } else if (provider === 'bitbucket') {
          await loadBitbucket();
        }
      } catch (error) {
        if (!cancelled) {
          setRepositories([]);
          onError(
            error instanceof Error ? error.message : 'Repository lookup failed',
          );
        }
      }
    };
    if (open && token && apiProvider && host) void load();
    return () => {
      cancelled = true;
    };
  }, [
    apiProvider,
    host,
    onError,
    open,
    owner,
    project,
    provider,
    scaffolderApi,
    token,
  ]);

  const repositoryOptions = repositories.filter(
    item => !owner || provider !== 'github' || item.id.startsWith(`${owner}/`),
  );

  const authenticateRepository = async (repositoryUrl: string) => {
    try {
      const normalizedRepositoryUrl = normalizeRepoUrl(repositoryUrl.trim());
      const parsedUrl = new URL(normalizedRepositoryUrl);
      if (parsedUrl.protocol !== 'https:') {
        throw new Error('Repository URL must use HTTPS.');
      }
      if (parsedUrl.username || parsedUrl.password) {
        throw new Error(
          'Repository URL must not contain embedded credentials.',
        );
      }
      if (parsedUrl.search || parsedUrl.hash) {
        throw new Error(
          'Repository URL must not contain a query string or fragment.',
        );
      }
      if (!hostProviderMap.has(parsedUrl.host)) {
        throw new Error(
          'Repository host is not a configured supported SCM host.',
        );
      }
      const scmProvider = resolveScmProvider(
        normalizedRepositoryUrl,
        hostProviderMap,
      );
      const auth = await scmAuth.getCredentials({
        url: normalizedRepositoryUrl,
        additionalScope: { repoWrite: true },
      });
      onChange({
        ...value,
        repositoryUrl: normalizedRepositoryUrl,
        token: scmProvider.augmentToken(auth.token),
      });
      onError(undefined);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Repository authentication failed',
      );
    }
  };

  const selectRepository = (repository: string, displayValue = repository) => {
    const repositoryPath = repository.startsWith(`${owner}/`)
      ? repository
      : `${owner}/${repository}`;
    const url = /^https?:\/\//iu.test(repository)
      ? repository
      : `https://${host}/${repositoryPath}`;
    setManualUrl(displayValue);
    setSelectedRepositoryUrl(url);
    void authenticateRepository(url);
  };

  return (
    <>
      <TextField
        select
        fullWidth
        required
        label="SCM host"
        value={host}
        onChange={event => {
          setHost(event.target.value);
          onChange({ ...value, repositoryUrl: '', token: undefined });
        }}
        margin="dense"
      >
        {hosts.map(item => (
          <MenuItem key={item} value={item}>
            {item} ({hostProviderMap.get(item)})
          </MenuItem>
        ))}
      </TextField>
      {(provider === 'github' ||
        provider === 'gitlab' ||
        provider === 'bitbucket') && (
        <Autocomplete
          freeSolo
          options={owners.map(item => item.title ?? item.id)}
          value={owner}
          onChange={(_event, next) => {
            setOwner(typeof next === 'string' ? next : '');
            setProject('');
            setRepositories([]);
            setSelectedRepositoryUrl(undefined);
          }}
          onInputChange={(_event, next) => setOwner(next)}
          renderInput={params => (
            <TextField
              {...params}
              required
              label={provider === 'bitbucket' ? 'Workspace' : 'Owner'}
              margin="dense"
            />
          )}
        />
      )}
      {provider === 'bitbucket' && owner && (
        <Autocomplete
          freeSolo
          options={projects.map(item => item.title ?? item.id)}
          value={project}
          onChange={(_event, next) =>
            setProject(typeof next === 'string' ? next : '')
          }
          onInputChange={(_event, next) => setProject(next)}
          renderInput={params => (
            <TextField {...params} required label="Project" margin="dense" />
          )}
        />
      )}
      <Autocomplete
        freeSolo
        options={repositoryOptions}
        getOptionLabel={option =>
          typeof option === 'string' ? option : (option.title ?? option.id)
        }
        inputValue={manualUrl}
        onChange={(_event, next) => {
          if (typeof next === 'string' && next) {
            selectRepository(next);
          } else if (next && typeof next !== 'string') {
            selectRepository(next.id, next.title ?? next.id);
          }
        }}
        onInputChange={(_event, next, reason) => {
          if (reason === 'input' || reason === 'clear') {
            setManualUrl(next);
            setSelectedRepositoryUrl(undefined);
          }
        }}
        onBlur={() => {
          if (manualUrl.trim() && !selectedRepositoryUrl) {
            void authenticateRepository(manualUrl);
          }
        }}
        renderInput={params => (
          <TextField
            {...params}
            required
            label="Repository"
            helperText="Select a repository or enter an HTTPS clone URL."
            margin="dense"
          />
        )}
      />
      <TextField
        fullWidth
        required
        label="Branch"
        helperText="If it does not exist, it will be created from the repository default branch."
        value={value.repositoryBranch}
        onChange={event =>
          onChange({ ...value, repositoryBranch: event.target.value })
        }
        margin="dense"
      />
    </>
  );
};
