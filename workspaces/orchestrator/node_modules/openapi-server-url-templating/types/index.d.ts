interface ParseResult {
  readonly result: {
    readonly success: boolean;
  };
  readonly ast: {
    readonly translate: (parts: any[]) => Array<[string, string]>;
    readonly toXml: () => string;
  };
}

interface TestOptions {
  readonly strict?: boolean;
}

interface ServerVariables {
  [key: string]: any;
}

interface SubstituteOptions {
  encoder: (serverVariableValue: string, serverVariableName?: string) => string;
}

export function parse(serverURLTemplate: string): ParseResult;
export function test(serverURLTemplate: string, options?: TestOptions): boolean;
export function substitute(
  serverURLTemplate: string,
  serverVariables: ServerVariables,
  options?: SubstituteOptions,
): string;
export function encodeServerVariable(serverVariableValue: string): string;
