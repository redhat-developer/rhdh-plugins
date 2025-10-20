
interface ParseResult {
  readonly result: {
    readonly success: boolean;
  }
  readonly ast: {
    readonly translate: (parts: any[]) => Array<[string, string]>;
    readonly toXml: () => string;
  };
}

interface TestOptions {
  readonly strict?: boolean;
}

interface Parameters {
  [key: string]: any;
}

interface ResolveOptions {
  encoder: (paramterValue: string, parameterName?: string) => string;
}

export function parse(pathTemplate: string): ParseResult;
export function test(pathTemplate: string, options?: TestOptions): boolean;
export function resolve(pathTemplate: string, parameters: Parameters, options?: ResolveOptions): string;
export function encodePathComponent(parameterValue: string): string;
