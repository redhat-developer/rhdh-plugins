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

import { FileTypeIcon } from '../notebooks/FileTypeIcon';

describe('FileTypeIcon', () => {
  it('should render the file extension as label', () => {
    render(<FileTypeIcon fileName="document.pdf" />);
    expect(screen.getByText('pdf')).toBeInTheDocument();
  });

  it('should render "?" for files without an extension', () => {
    render(<FileTypeIcon fileName="Makefile" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('should render the extension in lowercase', () => {
    render(<FileTypeIcon fileName="README.MD" />);
    expect(screen.getByText('md')).toBeInTheDocument();
  });

  it('should apply the correct color for known file types', () => {
    const { container } = render(<FileTypeIcon fileName="test.pdf" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveStyle({ color: '#C9190B', borderColor: '#C9190B' });
  });

  it('should apply default color for unknown file types', () => {
    const { container } = render(<FileTypeIcon fileName="test.xyz" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveStyle({ color: '#6A6E73', borderColor: '#6A6E73' });
  });

  it.each([
    ['test.pdf', '#C9190B'],
    ['test.yaml', '#F0AB00'],
    ['test.yml', '#F0AB00'],
    ['test.json', '#F0AB00'],
    ['test.txt', '#6A6E73'],
    ['test.md', '#0066CC'],
    ['test.log', '#6A6E73'],
    ['test.docx', '#004B95'],
    ['test.odt', '#009596'],
    ['test.html', '#EC7A08'],
    ['test.csv', '#3E8635'],
  ])('should use correct color for %s', (fileName, expectedColor) => {
    const { container } = render(<FileTypeIcon fileName={fileName} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveStyle({ color: expectedColor });
  });

  it('should append custom className when provided', () => {
    const { container } = render(
      <FileTypeIcon fileName="test.txt" className="custom-class" />,
    );
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('custom-class');
  });

  it('should handle filenames with multiple dots', () => {
    render(<FileTypeIcon fileName="archive.tar.gz" />);
    expect(screen.getByText('gz')).toBeInTheDocument();
  });

  it('should handle filenames starting with a dot', () => {
    render(<FileTypeIcon fileName=".gitignore" />);
    expect(screen.getByText('gitignore')).toBeInTheDocument();
  });
});
