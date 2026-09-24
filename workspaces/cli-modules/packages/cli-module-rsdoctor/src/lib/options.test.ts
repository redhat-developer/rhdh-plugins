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
import { partitionArgs, rsdoctorFlags } from './options';

describe('partitionArgs', () => {
  const flags = { ...rsdoctorFlags, moduleFederation: { type: Boolean } };

  it('keeps forwarded flags in order, including space separated values', () => {
    const { own, rest } = partitionArgs(
      [
        '--config',
        'app-config.yaml',
        '--mode',
        'brief',
        '--stats',
        '--no-open',
        '--config=other.yaml',
        '--report-dir=out',
        '--port',
        '4321',
        'positional',
      ],
      flags,
    );
    expect(own).toEqual([
      '--mode',
      'brief',
      '--no-open',
      '--report-dir=out',
      '--port',
      '4321',
    ]);
    expect(rest).toEqual([
      '--config',
      'app-config.yaml',
      '--stats',
      '--config=other.yaml',
      'positional',
    ]);
  });

  it('accepts camelCase and kebab-case names and treats --help as its own', () => {
    const { own, rest } = partitionArgs(
      ['--reportDir', 'x', '--moduleFederation', '--help', '-h', '--check'],
      flags,
    );
    expect(own).toEqual([
      '--reportDir',
      'x',
      '--moduleFederation',
      '--help',
      '-h',
    ]);
    expect(rest).toEqual(['--check']);
  });
});
