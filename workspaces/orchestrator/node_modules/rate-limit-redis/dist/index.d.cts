import { Store, Options as Options$1, ClientRateLimitInfo, IncrementResponse } from 'express-rate-limit';

/**
 * The type of data Redis might return to us.
 */
type Data = boolean | number | string;
type RedisReply = Data | Data[];
/**
 * The library sends Redis raw commands, so all we need to know are the
 * 'raw-command-sending' functions for each redis client.
 */
type SendCommandFn = (...args: string[]) => Promise<RedisReply>;
/**
 * The configuration options for the store.
 */
type Options = {
    /**
     * The function used to send commands to Redis.
     */
    readonly sendCommand: SendCommandFn;
    /**
     * The text to prepend to the key in Redis.
     */
    readonly prefix?: string;
    /**
     * Whether to reset the expiry for a particular key whenever its hit count
     * changes.
     */
    readonly resetExpiryOnChange?: boolean;
};

/**
 * A `Store` for the `express-rate-limit` package that stores hit counts in
 * Redis.
 */
declare class RedisStore implements Store {
    /**
     * The function used to send raw commands to Redis.
     */
    sendCommand: SendCommandFn;
    /**
     * The text to prepend to the key in Redis.
     */
    prefix: string;
    /**
     * Whether to reset the expiry for a particular key whenever its hit count
     * changes.
     */
    resetExpiryOnChange: boolean;
    /**
     * Stores the loaded SHA1s of the LUA scripts used for executing the increment
     * and get key operations.
     */
    incrementScriptSha: Promise<string>;
    getScriptSha: Promise<string>;
    /**
     * The number of milliseconds to remember that user's requests.
     */
    windowMs: number;
    /**
     * @constructor for `RedisStore`.
     *
     * @param options {Options} - The configuration options for the store.
     */
    constructor(options: Options);
    /**
     * Loads the script used to increment a client's hit count.
     */
    loadIncrementScript(): Promise<string>;
    /**
     * Loads the script used to fetch a client's hit count and expiry time.
     */
    loadGetScript(): Promise<string>;
    /**
     * Runs the increment command, and retries it if the script is not loaded.
     */
    retryableIncrement(key: string): Promise<RedisReply>;
    /**
     * Method to prefix the keys with the given text.
     *
     * @param key {string} - The key.
     *
     * @returns {string} - The text + the key.
     */
    prefixKey(key: string): string;
    /**
     * Method that actually initializes the store.
     *
     * @param options {RateLimitConfiguration} - The options used to setup the middleware.
     */
    init(options: Options$1): void;
    /**
     * Method to fetch a client's hit count and reset time.
     *
     * @param key {string} - The identifier for a client.
     *
     * @returns {ClientRateLimitInfo | undefined} - The number of hits and reset time for that client.
     */
    get(key: string): Promise<ClientRateLimitInfo | undefined>;
    /**
     * Method to increment a client's hit counter.
     *
     * @param key {string} - The identifier for a client
     *
     * @returns {IncrementResponse} - The number of hits and reset time for that client
     */
    increment(key: string): Promise<IncrementResponse>;
    /**
     * Method to decrement a client's hit counter.
     *
     * @param key {string} - The identifier for a client
     */
    decrement(key: string): Promise<void>;
    /**
     * Method to reset a client's hit counter.
     *
     * @param key {string} - The identifier for a client
     */
    resetKey(key: string): Promise<void>;
}

export { type Options, type RedisReply, RedisStore, type SendCommandFn, RedisStore as default };
