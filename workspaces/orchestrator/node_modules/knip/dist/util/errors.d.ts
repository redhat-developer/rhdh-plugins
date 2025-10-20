import { ZodError } from 'zod';
interface ErrorWithCause extends Error {
    cause: Error;
}
export declare class ConfigurationError extends Error {
}
export declare class LoaderError extends Error {
}
export declare const isKnownError: (error: Error) => error is ConfigurationError | LoaderError | ZodError<any>;
export declare const hasCause: (error: Error) => error is ErrorWithCause;
export declare const isConfigurationError: (error: Error) => error is ConfigurationError;
export declare const getKnownError: (error: Error) => Error;
export {};
