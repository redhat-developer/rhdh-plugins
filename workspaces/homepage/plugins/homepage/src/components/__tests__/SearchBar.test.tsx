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

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { SearchBar } from '../SearchBar';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock('@backstage/plugin-search-react', () => ({
  SearchBarBase: ({
    placeholder,
    value,
    onChange,
    onSubmit,
    inputProps,
  }: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    inputProps: { ref: React.RefObject<HTMLInputElement> };
  }) => (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        ref={inputProps.ref}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </form>
  ),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders with translated placeholder', () => {
    render(
      <MemoryRouter>
        <SearchBar />
      </MemoryRouter>,
    );

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('navigates to default search path on submit', () => {
    render(
      <MemoryRouter>
        <SearchBar />
      </MemoryRouter>,
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'backstage' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockNavigate).toHaveBeenCalledWith('/search?query=backstage');
  });

  it('uses custom path and query param on submit', () => {
    render(
      <MemoryRouter>
        <SearchBar path="/custom-search" queryParam="q" />
      </MemoryRouter>,
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'docs' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockNavigate).toHaveBeenCalledWith('/custom-search?q=docs');
  });
});
