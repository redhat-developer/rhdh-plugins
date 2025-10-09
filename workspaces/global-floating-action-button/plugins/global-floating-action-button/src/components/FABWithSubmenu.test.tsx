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
import GitIcon from '@mui/icons-material/GitHub';
import SnowFlake from '@mui/icons-material/AcUnit';
import { Slot } from '../types';
import { FABWithSubmenu } from './FABWithSubmenu';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(() => ({
    pathname: '/test-path',
  })),
}));

jest.mock('@mui/styles', () => ({
  ...jest.requireActual('@mui/styles'),
  makeStyles: () => () => {
    return {
      button: 'button',
    };
  },
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

describe('Floating Button with submenu', () => {
  it('should render a floating button with submenu actions', () => {
    render(
      <FABWithSubmenu
        slot={Slot.BOTTOM_LEFT}
        fabs={[
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
      />,
    );
    expect(
      screen.getByTestId('floating-button-with-submenu'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('MenuIcon')).toBeInTheDocument();
    const button = screen.getByTestId('MenuIcon');
    fireEvent.click(button);
    expect(screen.getByText('Git repo')).toBeInTheDocument();
    expect(screen.getByTestId('AcUnitIcon')).toBeInTheDocument();
  });
});
