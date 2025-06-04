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
import { SearchInput } from './SearchInput';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

describe('SearchInput', () => {
  const params = {
    InputProps: {
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon style={{ color: '#fff' }} />
        </InputAdornment>
      ),
    },
  };

  it('renders search input with placeholder', () => {
    render(<SearchInput params={params} error={false} helperText="" />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    render(
      <SearchInput params={params} error helperText="Error fetching results" />,
    );
    expect(screen.getByText('Error fetching results')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders input adornment', () => {
    render(<SearchInput params={params} error={false} helperText="" />);
    expect(screen.getByTestId('SearchIcon')).toBeInTheDocument();
  });
});
