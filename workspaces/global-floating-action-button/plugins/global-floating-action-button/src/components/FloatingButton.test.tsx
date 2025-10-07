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
import { fireEvent, render, screen } from '@testing-library/react';
import AddIcon from '@mui/icons-material/Add';
import GitIcon from '@mui/icons-material/GitHub';
import SnowFlake from '@mui/icons-material/AcUnit';
import { FloatingButton } from './FloatingButton';
import { Slot } from '../types';

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
  createApiRef: jest.fn(() => ({ id: 'test-api-ref' })),
}));

jest.mock('@backstage/core-plugin-api/alpha', () => ({
  useTranslationRef: jest.fn(() => jest.fn((key: string) => key)),
  createTranslationRef: jest.fn(() => ({ id: 'test-translation-ref' })),
  createTranslationResource: jest.fn(() => ({
    id: 'test-translation-resource',
  })),
}));

jest.mock('../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
}));

jest.mock('@mui/styles', () => ({
  ...jest.requireActual('@mui/styles'),
  makeStyles: () => () => {
    return {
      fabContainer: 'fabContainer',
      'page-end': 'page-end',
      'bottom-left': 'bottom-left',
    };
  },
}));

beforeEach(() => {
  document.body.innerHTML = '<div class="BackstagePage-root-123"></div>';
});

const renderFab = (htmlContent: string) => {
  document.body.innerHTML = htmlContent;
  render(
    <FloatingButton
      floatingButtons={[
        {
          icon: <AddIcon />,
          label: 'Add',
        },
      ]}
      slot={Slot.BOTTOM_LEFT}
    />,
  );
};

describe('Floating Button', () => {
  it('should render a floating button', () => {
    renderFab('<div class="BackstagePage-root-123"></div>');
    expect(screen.getByTestId('floating-button')).toBeInTheDocument();
    expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
  });

  it('should render a floating button in the UI when the `BackstagePage-root` classname is not found', () => {
    renderFab('<div class="BackstagePage-xxx-123"></div>');
    expect(screen.getByTestId('floating-button')).toBeInTheDocument();
    expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
  });

  it('should render a floating button when the `BackstagePage-root` classname is not found but the html tag is found', () => {
    renderFab('<main class="BackstagePage-xxx-123"></div>');
    expect(screen.getByTestId('floating-button')).toBeInTheDocument();
    expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
  });

  it('should render a floating button with git icon', () => {
    render(
      <FloatingButton
        floatingButtons={[
          {
            color: 'success',
            icon: <GitIcon />,
            label: 'Git repo',
            to: 'https://github.com/xyz',
            toolTip: 'Git',
          },
        ]}
        slot={Slot.BOTTOM_LEFT}
      />,
    );
    expect(screen.getByTestId('floating-button')).toBeInTheDocument();
    expect(screen.queryByTestId('AddIcon')).not.toBeInTheDocument();
    expect(screen.getByTestId('GitHubIcon')).toBeInTheDocument();
  });

  it('should render a floating button with sub-menu', () => {
    render(
      <FloatingButton
        floatingButtons={[
          {
            color: 'success',
            icon: <GitIcon />,
            label: 'Git repo',
            showLabel: true,
            to: 'https://github.com/xyz',
            toolTip: 'Git',
          },
          {
            color: 'success',
            icon: <SnowFlake />,
            label: 'Ac Unit',
            to: 'https://github.com/xyz1',
            toolTip: 'Ac Unit',
          },
        ]}
        slot={Slot.BOTTOM_LEFT}
      />,
    );
    expect(
      screen.getByTestId('floating-button-with-submenu'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('MenuIcon')).toBeInTheDocument();
    const button = screen.getByTestId('MenuIcon');
    fireEvent.click(button);
    expect(screen.getByText('Git repo')).toBeInTheDocument();
    expect(screen.queryByText('Ac Unit')).not.toBeInTheDocument();
  });
});
