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
import { fireEvent, render, screen } from '@testing-library/react';
import AddIcon from '@mui/icons-material/Add';
import GitIcon from '@mui/icons-material/GitHub';
import SnowFlake from '@mui/icons-material/AcUnit';
import * as React from 'react';
import { FloatingButton } from './FloatingButton';

describe('Floating Button', () => {
  it('should render a floating button', () => {
    render(
      <FloatingButton
        floatingButton={{
          icon: <AddIcon />,
          label: 'Add',
          color: 'primary',
          toolTip: 'Main menu',
        }}
      />,
    );
    expect(screen.getByTestId('floating-button')).toBeInTheDocument();
    expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
  });

  it('should render a floating button with git icon', () => {
    render(
      <FloatingButton
        floatingButton={{
          icon: <AddIcon />,
          label: 'Add',
          color: 'primary',
          toolTip: 'Main menu',
          actions: [
            {
              color: 'success',
              icon: <GitIcon />,
              label: 'Git repo',
              url: 'https://github.com/xyz',
              toolTip: 'Git',
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId('floating-button')).toBeInTheDocument();
    expect(screen.queryByTestId('AddIcon')).not.toBeInTheDocument();
    expect(screen.getByTestId('GitHubIcon')).toBeInTheDocument();
    expect(screen.getByText('Git repo')).toBeInTheDocument();
  });

  it('should render a floating button with sub-menu', () => {
    render(
      <FloatingButton
        floatingButton={{
          icon: <AddIcon />,
          label: 'Add',
          color: 'primary',
          toolTip: 'Main menu',
          actions: [
            {
              color: 'success',
              icon: <GitIcon />,
              label: 'Git repo',
              url: 'https://github.com/xyz',
              toolTip: 'Git',
            },
            {
              color: 'success',
              icon: <SnowFlake />,
              label: 'Ac Unit',
              url: 'https://github.com/xyz1',
              toolTip: 'Ac Unit',
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId('floating-button')).toBeInTheDocument();
    expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
    const button = screen.getByTestId('AddIcon');
    fireEvent.click(button);
    expect(screen.getByText('Git repo')).toBeInTheDocument();
    expect(screen.getByText('Ac Unit')).toBeInTheDocument();
  });
});
