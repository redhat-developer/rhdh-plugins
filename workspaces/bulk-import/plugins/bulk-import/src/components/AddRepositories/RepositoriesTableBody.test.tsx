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

import { render, screen } from '@testing-library/react';

import { ApprovalTool } from '../../types';
import type { AddRepositoryData } from '../../types';
import { RepositoriesTableBody } from './RepositoriesTableBody';

const mockT = jest.fn((key: string) => key);

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('./OrganizationTableRow', () => ({
  OrganizationTableRow: ({ data }: { data: { id: string } }) => (
    <tr data-testid={`org-row-${data.id}`} />
  ),
}));

jest.mock('./RepositoryTableRow', () => ({
  RepositoryTableRow: ({ data }: { data: { id: string } }) => (
    <tr data-testid={`repo-row-${data.id}`} />
  ),
}));

const noop = () => {};
const noopClick = jest.fn();

const baseRow: AddRepositoryData = {
  id: 'repo-1',
  repoName: 'demo',
  approvalTool: ApprovalTool.Git,
};

const defaultProps = {
  loading: false,
  ariaLabel: 'repositories-table',
  showOrganizations: false,
  rows: [] as AddRepositoryData[],
  onOrgRowSelected: noop,
  onClick: noopClick,
  selectedRepos: {},
  isDrawer: false,
};

describe('RepositoriesTableBody', () => {
  beforeEach(() => {
    mockT.mockImplementation((key: string) => key);
  });

  it('shows log-in empty state for GitHub when loginRejected is true', () => {
    render(
      <table>
        <RepositoriesTableBody {...defaultProps} rows={[]} loginRejected />
      </table>,
    );

    expect(screen.getByTestId('no-repositories-found')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('repositories.logInToViewRepositories');
  });

  it('shows log-in empty state for GitLab when loginRejected is true', () => {
    render(
      <table>
        <RepositoriesTableBody
          {...defaultProps}
          rows={[]}
          loginRejected
          isApprovalToolGitlab
        />
      </table>,
    );

    expect(screen.getByTestId('no-repositories-found')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('repositories.logInToViewProjects');
  });

  it('shows GitLab empty state when not loginRejected and GitLab tool', () => {
    render(
      <table>
        <RepositoriesTableBody
          {...defaultProps}
          rows={[]}
          isApprovalToolGitlab
        />
      </table>,
    );

    expect(screen.getByTestId('no-repositories-found')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('repositories.noProjectsFound');
  });

  it('shows GitHub empty state when not loginRejected and not GitLab', () => {
    render(
      <table>
        <RepositoriesTableBody {...defaultProps} rows={[]} />
      </table>,
    );

    expect(screen.getByTestId('no-repositories-found')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('repositories.noRecordsFound');
  });

  it('renders OrganizationTableRow when showOrganizations is true', () => {
    render(
      <table>
        <RepositoriesTableBody
          {...defaultProps}
          rows={[baseRow]}
          showOrganizations
        />
      </table>,
    );

    expect(screen.getByTestId('org-row-repo-1')).toBeInTheDocument();
    expect(screen.queryByTestId('repo-row-repo-1')).not.toBeInTheDocument();
  });

  it('renders RepositoryTableRow when showOrganizations is false', () => {
    render(
      <table>
        <RepositoriesTableBody {...defaultProps} rows={[baseRow]} />
      </table>,
    );

    expect(screen.getByTestId('repo-row-repo-1')).toBeInTheDocument();
    expect(screen.queryByTestId('org-row-repo-1')).not.toBeInTheDocument();
  });
});
