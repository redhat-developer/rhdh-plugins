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
import { extractWorkflowFormat } from './workflow';

describe('extractWorkflowFormat', () => {
  it('should return "json" when input is valid JSON', () => {
    const source = '{"name": "workflow", "steps": ["step1", "step2"]}';
    expect(extractWorkflowFormat(source)).toEqual('json');
  });

  it('should return "yaml" when input is valid YAML', () => {
    const source = 'name: workflow\nsteps:\n  - step1\n  - step2\n';
    expect(extractWorkflowFormat(source)).toEqual('yaml');
  });
});
