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
import GitIcon from '@mui/icons-material/GitHub';
import { CustomFab } from './CustomFab';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(() => ({
    pathname: '/test-path',
  })),
}));

jest.mock('@backstage/core-plugin-api', () => ({
  useApp: jest.fn(() => ({
    getSystemIcon: jest.fn(),
  })),
  usetheme: jest.fn(() => ({
    theme: {
      transitions: {
        easing: {
          easeOut: 'eo',
          sharp: 's',
        },
      },
    },
  })),
}));

const mockTranslationFunction = (key: string) => key as any;

describe('Floating Action Button', () => {
  it('should render the floating action button with icon and label', () => {
    render(
      <CustomFab
        actionButton={{
          color: 'success',
          icon: <GitIcon />,
          label: 'Git repo',
          showLabel: true,
          to: 'https://github.com/xyz',
          toolTip: 'Git',
        }}
        t={mockTranslationFunction}
      />,
    );
    expect(screen.getByTestId('git-repo')).toBeInTheDocument();
    expect(screen.getByTestId('GitHubIcon')).toBeInTheDocument();
    expect(screen.getByText('Git repo')).toBeInTheDocument();
    expect(screen.getByTestId('OpenInNewIcon')).toBeInTheDocument();
  });

  it('should render the floating action button with icon', () => {
    render(
      <CustomFab
        actionButton={{
          color: 'success',
          icon: <GitIcon />,
          label: 'Git repo',
          to: 'https://github.com/xyz',
          toolTip: 'Git',
        }}
        t={mockTranslationFunction}
      />,
    );
    expect(screen.getByTestId('git-repo')).toBeInTheDocument();
    expect(screen.getByTestId('GitHubIcon')).toBeInTheDocument();
    expect(screen.queryByText('Git repo')).not.toBeInTheDocument();
  });
});
