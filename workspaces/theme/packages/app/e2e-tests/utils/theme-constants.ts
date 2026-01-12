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
type ThemeInfo = {
  name:
    | 'RHDH Light (latest)'
    | 'RHDH Dark (latest)'
    | 'RHDH Light (customized)'
    | 'RHDH Dark (customized)'
    | 'Backstage Light'
    | 'Backstage Dark';
  primaryColor: string;
  headerColor1: string;
  headerColor2: string;
  navigationIndicatorColor: string;
};

export class ThemeConstants {
  static getThemes() {
    const lightLatest: ThemeInfo = {
      name: 'RHDH Light (latest)',
      primaryColor: 'rgb(0, 102, 204)',
      headerColor1: 'rgb(255, 255, 255)',
      headerColor2: 'rgb(255, 255, 255)',
      navigationIndicatorColor: 'rgba(0, 0, 0, 0)',
    };
    const darkLatest: ThemeInfo = {
      name: 'RHDH Dark (latest)',
      primaryColor: 'rgb(146, 197, 249)',
      headerColor1: 'rgb(41, 41, 41)',
      headerColor2: 'rgb(41, 41, 41)',
      navigationIndicatorColor: 'rgba(0, 0, 0, 0)',
    };
    const lightCustomized: ThemeInfo = {
      name: 'RHDH Light (customized)',
      primaryColor: 'rgb(255, 0, 0)',
      headerColor1: 'rgb(255, 255, 255)',
      headerColor2: 'rgb(255, 255, 255)',
      navigationIndicatorColor: 'rgba(0, 0, 0, 0)',
    };
    const darkCustomized: ThemeInfo = {
      name: 'RHDH Dark (customized)',
      primaryColor: 'rgb(255, 0, 0)',
      headerColor1: 'rgb(41, 41, 41)',
      headerColor2: 'rgb(41, 41, 41)',
      navigationIndicatorColor: 'rgba(0, 0, 0, 0)',
    };
    const backstageLight: ThemeInfo = {
      name: 'Backstage Light',
      primaryColor: 'rgb(31, 84, 147)',
      headerColor1: 'rgb(0, 91, 75)',
      headerColor2: 'rgb(0, 91, 75)',
      navigationIndicatorColor: 'rgb(155, 240, 225)',
    };

    const backstageDark: ThemeInfo = {
      name: 'Backstage Dark',
      primaryColor: 'rgb(156, 201, 255)',
      headerColor1: 'rgb(0, 91, 75)',
      headerColor2: 'rgb(0, 91, 75)',
      navigationIndicatorColor: 'rgb(155, 240, 225)',
    };

    return [
      lightLatest,
      darkLatest,
      lightCustomized,
      darkCustomized,
      backstageLight,
      backstageDark,
    ];
  }
}
