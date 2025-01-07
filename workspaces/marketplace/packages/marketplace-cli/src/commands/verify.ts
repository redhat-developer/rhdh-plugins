/*
 * Copyright 2025 The Backstage Authors
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
import chalk from 'chalk';
import fs from 'fs-extra';
import yaml from 'yaml';

interface Options {
  // TODO
  glob?: boolean;
  // TODO
  recursive?: boolean;
}

export default async function verify(files: string[], _options: Options) {
  for (const file of files) {
    const fileContent = await fs.readFile(file, 'utf8');

    const data = yaml.parse(fileContent);

    console.log(
      'Found',
      chalk.blueBright(data.kind),
      chalk.green(data.metadata.name),
    );
  }
}
