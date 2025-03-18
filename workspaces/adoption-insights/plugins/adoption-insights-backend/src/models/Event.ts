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
import { v4 as uuidv4 } from 'uuid';
import {
  AnalyticsContextValue,
  AnalyticsEvent,
  AnalyticsEventAttributes,
} from '@backstage/core-plugin-api';

export type EventType = {
  user_ref: string;
  plugin_id: string;
  action: string;
  context: AnalyticsContextValue | string;
  subject: string;
  value: number | undefined;
  attributes: AnalyticsEventAttributes | string;
  created_at: string;
};

export class Event {
  public readonly id: string;
  public readonly user_ref?: string;
  public readonly plugin_id?: string;
  public readonly action: string;
  public readonly context: AnalyticsContextValue | string;
  public readonly subject: string;
  public readonly value: number | undefined;
  public readonly attributes: AnalyticsEventAttributes | string;
  public readonly created_at: string;

  constructor(event: AnalyticsEvent, isJson: boolean = true) {
    this.id = uuidv4();
    this.user_ref = event.context?.userName as string;
    this.plugin_id = event.context?.pluginId;
    this.action = event.action;
    this.subject = event.subject;
    this.value = event.value;
    this.created_at =
      (event.context?.timestamp as string) || new Date().toISOString();

    // Handle type-based conversion
    this.context = isJson ? event.context : JSON.stringify(event.context ?? {});
    this.attributes = isJson
      ? event.attributes ?? {}
      : JSON.stringify(event.attributes ?? {});
  }

  toJSON() {
    return {
      user_ref: this.user_ref,
      plugin_id: this.plugin_id,
      action: this.action,
      context: this.context,
      subject: this.subject,
      attributes: this.attributes,
      created_at: this.created_at,
      value: this.value,
    };
  }
}
