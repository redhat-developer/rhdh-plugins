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

// CRITICAL: Import mocks BEFORE components
import { MockTrans, mockUseTranslation } from '../test-utils/mockTranslations';

jest.mock('../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('./Trans', () => ({ Trans: MockTrans }));

// Component imports AFTER mocks
import { render, screen } from '@testing-library/react';
import { ExportTranslationKeys } from './ExportTranslationKeys';

describe('ExportTranslationKeys', () => {
  it('renders translated content', () => {
    const mockResources: any[] = [];
    render(<ExportTranslationKeys resources={mockResources} />);
    expect(screen.getByText('Translations')).toBeInTheDocument();
    expect(
      screen.getByText('Download default translations (English)'),
    ).toBeInTheDocument();
  });
});
