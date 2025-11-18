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

import { LoggerService } from '@backstage/backend-plugin-api';

/**
 * JSON-serializable value type
 */
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Context information that can be included in logs
 * All values must be JSON-serializable
 */
export interface LogContext {
  cluster?: string;
  namespace?: string;
  resource?: string;
  apiGroup?: string;
  apiVersion?: string;
  userEmail?: string;
  entityRef?: string;
  [key: string]: JsonValue | undefined;
}

/**
 * Enhanced logger wrapper that provides structured logging with context
 * for the Konflux backend plugin.
 *
 * This utility helps maintain consistent log formatting by allowing
 * contextual information (cluster, namespace, resource type, etc.)
 * to be included in log messages.
 */
export class KonfluxLogger {
  public readonly baseLogger: LoggerService;

  constructor(baseLogger: LoggerService) {
    this.baseLogger = baseLogger;
  }

  /**
   * Log an error with context
   * Automatically extracts error information and merges it with provided context
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const fullContext = this.buildContext(context);
    const errorContext = this.extractErrorContext(error);

    const mergedContext = {
      ...fullContext,
      ...errorContext,
    };

    this.baseLogger.error(message, mergedContext);
  }

  /**
   * Log a warning with context
   */
  warn(message: string, context?: LogContext): void {
    const fullContext = this.buildContext(context);
    this.baseLogger.warn(message, fullContext);
  }

  /**
   * Log an informational message with context
   */
  info(message: string, context?: LogContext): void {
    const fullContext = this.buildContext(context);
    this.baseLogger.info(message, fullContext);
  }

  /**
   * Log a debug message with context
   */
  debug(message: string, context?: LogContext): void {
    const fullContext = this.buildContext(context);
    this.baseLogger.debug(message, fullContext);
  }

  /**
   * Build context object from provided context
   * Returns an empty object if no context is provided
   */
  private buildContext(additionalContext?: LogContext): LogContext {
    return additionalContext || {};
  }

  /**
   * Extract error information into a structured format
   */
  private extractErrorContext(error?: Error): LogContext {
    if (!error) {
      return {};
    }

    if (error instanceof Error) {
      const context: LogContext = {
        error: error.message,
        errorName: error.name,
        ...(error.stack && { errorStack: error.stack }),
      };

      // Add statusCode if it exists and is a number
      if (typeof (error as any).statusCode === 'number') {
        context.statusCode = (error as any).statusCode;
      }

      // Add body if it exists and is JSON-serializable
      if ((error as any).body !== undefined) {
        const body = (error as any).body;
        if (
          typeof body === 'string' ||
          typeof body === 'number' ||
          typeof body === 'boolean' ||
          body === null ||
          (typeof body === 'object' && !Array.isArray(body))
        ) {
          context.body = body as JsonValue;
        } else {
          context.body = String(body);
        }
      }

      return context;
    }

    return {
      error: JSON.stringify(error),
    };
  }
}
