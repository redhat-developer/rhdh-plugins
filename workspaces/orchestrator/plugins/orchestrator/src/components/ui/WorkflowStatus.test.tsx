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

import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import { AVAILABLE, UNAVAILABLE } from '../../constants';
import { WorkflowStatus } from './WorkflowStatus';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'workflow.status.available': 'Available',
        'workflow.status.unavailable': 'Unavailable',
        'tooltips.workflowDown': 'Workflow down',
      })[key] ?? key,
  }),
}));

describe('WorkflowStatus', () => {
  it('renders available status for AVAILABLE string', () => {
    render(<WorkflowStatus availability={AVAILABLE} />);

    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('renders available status for true boolean', () => {
    render(<WorkflowStatus availability />);

    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('renders unavailable status for false boolean', () => {
    render(<WorkflowStatus availability={false} />);

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('renders raw value for unsupported availability content', () => {
    render(<WorkflowStatus availability="Unknown" />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('renders unavailable status for UNAVAILABLE string', () => {
    render(<WorkflowStatus availability={UNAVAILABLE} />);

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});
