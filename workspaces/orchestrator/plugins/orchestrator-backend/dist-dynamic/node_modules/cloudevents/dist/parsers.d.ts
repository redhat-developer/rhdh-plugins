export declare abstract class Parser {
    abstract parse(payload: Record<string, unknown> | string | string[] | undefined): unknown;
}
export declare class JSONParser implements Parser {
    decorator?: Base64Parser;
    constructor(decorator?: Base64Parser);
    /**
     * Parses the payload with an optional decorator
     * @param {object|string} payload the JSON payload
     * @return {object} the parsed JSON payload.
     */
    parse(payload: Record<string, unknown> | string): string;
}
export declare class PassThroughParser extends Parser {
    parse(payload: unknown): unknown;
}
export declare const parserByContentType: {
    [key: string]: Parser;
};
export declare class Base64Parser implements Parser {
    decorator?: Parser;
    constructor(decorator?: Parser);
    parse(payload: Record<string, unknown> | string): string;
}
export interface MappedParser {
    name: string;
    parser: Parser;
}
export declare class DateParser extends Parser {
    parse(payload: string): string;
}
export declare const parserByEncoding: {
    [key: string]: {
        [key: string]: Parser;
    };
};
