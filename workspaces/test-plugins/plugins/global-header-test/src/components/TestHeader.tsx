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

/**
 * @public
 */
export interface TestHeaderProps {
  title?: string;
}

export const TestHeader = (props: TestHeaderProps) => (
  <header
    style={{
      color: 'white',
      backgroundColor: '#a00',
      fontWeight: 'bold',
      fontSize: '1.5rem',
      textAlign: 'center',
      border: '1px solid darkred',
      padding: 10,
    }}
  >
    {props.title ?? 'This is a test header!'}
  </header>
);
