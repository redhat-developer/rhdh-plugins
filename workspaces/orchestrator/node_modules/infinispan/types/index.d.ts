export function client(args: {
    /**
     * - Server host name.
     */
    host: string;
    /**
     * - Server port.
     */
    port: number;
} | {
    /**
     * - Server host name.
     */
    host: string;
    /**
     * - Server port.
     */
    port: number;
}[], options?: {
    /**
     * - Version of client/server protocol.
     */
    version?: (2.9 | 2.5 | 2.2) | null;
    /**
     * - Optional cache name.
     */
    cacheName?: string | null;
    /**
     * - Optional number of retries for operation.
     */
    maxRetries?: number | null;
    /**
     * - TLS/SSL properties.
     */
    ssl?: any | null;
    /**
     * - Optional flag to enable SSL support.
     */
    enabled?: boolean | null;
    /**
     * - Optional field with secure protocol in use.
     */
    secureProtocol?: string | null;
    /**
     * - Optional paths of trusted SSL certificates.
     */
    trustCerts?: string[] | null;
    /**
     * - Optional path to client authentication key.
     */
    key?: string | null;
    /**
     * - Optional password for client key.
     */
    passphrase?: string | null;
    /**
     * - Optional client certificate.
     */
    cert?: string | null;
    /**
     * - Optional SNI host name.
     */
    sniHostName?: string | null;
    /**
     * - Optional crypto store path.
     */
    path?: string | null;
    /**
     * - Authentication properties.
     */
    authentication?: any | null;
    /**
     * - Select the SASL mechanism to use. Can be one of PLAIN, DIGEST-MD5, SCRAM-SHA-1, SCRAM-SHA-256, SCRAM-SHA-384, SCRAM-SHA-512, EXTERNAL, OAUTHBEARER
     */
    saslMechanism?: string | null;
    /**
     * - The authentication username. Required by the PLAIN, DIGEST and SCRAM mechanisms.
     */
    userName?: string | null;
    /**
     * - The authentication password. Required by the PLAIN, DIGEST and SCRAM mechanisms.
     */
    password?: string | null;
    /**
     * - The OAuth token. Required by the OAUTHBEARER mechanism.
     */
    token?: string | null;
    /**
     * - The SASL authorization ID.
     */
    authzid?: string | null;
    /**
     * - Content-type for entry
     */
    dataFormat?: any | null;
    /**
     * - Content-type for key
     */
    keyType?: string | null;
    /**
     * - Content-type for value
     */
    valueType?: string | null;
    /**
     * - Optional flag to controls whether the client deals with topology updates or not.
     */
    topologyUpdates?: boolean | null;
    /**
     * - Media type of the cache contents.
     */
    mediaType?: ("text/plain" | "application/json") | null;
    /**
     * - Optional additional clusters for cross-site failovers.
     */
    clusters?: {
        /**
         * - Cluster name.
         */
        name: string;
        /**
         * - Cluster servers details.
         */
        servers: {
            /**
             * - Server host name.
             */
            host: string;
            /**
             * - Server port.
             */
            port: number;
        }[];
    }[];
}): Promise<ReturnType<{
    (addrs: any, clientOpts: any): {
        connect: () => any;
        /**
         * Disconnect client from backend server(s).
         *
         * @returns {Promise<void>}
         * A promise that will be completed once client has
         * completed disconnection from server(s).
         * @memberof Client#
         * @since 0.3
         */
        disconnect: () => Promise<void>;
        /**
         * Get the value associated with the given key parameter.
         *
         * @param k {(String|Object)} Key to retrieve.
         * @returns {Promise.<?String>}
         * A promise that will be completed with the value associated with
         * the key, or undefined if the value is not present.
         * @memberof Client#
         * @since 0.3
         */
        get: (k: (string | any)) => Promise<string | null>;
        /**
         * Query the server with the given queryString.
         *
         * @param q {(Object)} query to retrieve.
         * @returns {Promise.<?Object[]>}
         * A promise that will be completed with the array of values associated with
         * the query, or empty array if the no values matches the query.
         * @memberof Client#
         * @since 1.3
         */
        query: (q: (any)) => Promise<any[] | null>;
        /**
         * Check whether the given key is present.
         *
         * @param k {(String|Object)} Key to check for presence.
         * @returns {Promise.<boolean>}
         * A promise that will be completed with true if there is a value
         * associated with the key, or false otherwise.
         * @memberof Client#
         * @since 0.3
         */
        containsKey: (k: (string | any)) => Promise<boolean>;
        /**
         * Metadata value.
         *
         * @typedef {Object} MetadataValue
         * @property {(String|Object)} value - Value associated with the key
         * @property {Buffer} version - Version of the value as a byte buffer.
         * @property {Number} lifespan - Lifespan of entry, defined in seconds.
         * If the entry is immortal, it would be -1.
         * @property {Number} maxIdle - Max idle time of entry, defined in seconds.
         * If the entry is no transient, it would be -1.
         * @since 0.3
         */
        /**
         * Get the value and metadata associated with the given key parameter.
         *
         * @param k {(String|Object)} Key to retrieve.
         * @returns {Promise.<?MetadataValue>}
         * A promise that will be completed with the value and metadata
         * associated with the key, or undefined if the value is not present.
         * @memberof Client#
         * @since 0.3
         */
        getWithMetadata: (k: (string | any)) => Promise<{
            /**
             * - Value associated with the key
             */
            value: (string | any);
            /**
             * - Version of the value as a byte buffer.
             */
            version: Buffer;
            /**
             * - Lifespan of entry, defined in seconds.
             * If the entry is immortal, it would be -1.
             */
            lifespan: number;
            /**
             * - Max idle time of entry, defined in seconds.
             * If the entry is no transient, it would be -1.
             */
            maxIdle: number;
        }>;
        /**
         * A String formatted to specify duration unit information.
         * Duration unit is formed of two elements, the first is the number of
         * units, and the second is the unit itself: 's' for seconds, 'ms' for
         * milliseconds, 'ns' for nanoseconds, 'μs' for microseconds, 'm' for
         * minutes, 'h' for hours and 'd' for days.
         * So, for example: '1s' would be one second, '5h' five hours...etc.
         *
         * @typedef {String} DurationUnit
         * @since 0.3
         */
        /**
         * Store options defines a set of optional parameters that can be
         * passed when storing data.
         *
         * @typedef {Object} StoreOptions
         * @property {Boolean} previous - Indicates whether previous value
         * should be returned. If no previous value exists, it would return
         * undefined.
         * @property {DurationUnit} lifespan -
         * Lifespan for the stored entry.
         * @property {DurationUnit} maxIdle -
         * Max idle time for the stored entry.
         * @since 0.3
         */
        /**
         * Associates the specified value with the given key.
         *
         * @param k {(String|Object)} Key with which the specified value is to be associated.
         * @param v {(String|Object)} Value to be associated with the specified key.
         * @param opts {StoreOptions=} Optional store options.
         * @returns {Promise.<?(String|Object)>}
         * A promise that will be completed with undefined unless 'previous'
         * option has been enabled and a previous value exists, in which case it
         * would return the previous value.
         * @memberof Client#
         * @since 0.3
         */
        put: (k: (string | any), v: (string | any), opts?: {
            /**
             * - Indicates whether previous value
             * should be returned. If no previous value exists, it would return
             * undefined.
             */
            previous: boolean;
            /**
             * -
             * Lifespan for the stored entry.
             */
            lifespan: string;
            /**
             * -
             * Max idle time for the stored entry.
             */
            maxIdle: string;
        }) => Promise<(string | any) | null>;
        /**
         * Remove options defines a set of optional parameters that can be
         * passed when removing data.
         *
         * @typedef {Object} RemoveOptions
         * @property {Boolean} previous - Indicates whether previous value
         * should be returned. If no previous value exists, it would return
         * undefined.
         * @since 0.3
         */
        /**
         * Removes the mapping for a key if it is present.
         *
         * @param k {(String|Object)} Key whose mapping is to be removed.
         * @param opts {RemoveOptions=} Optional remove options.
         * @returns {Promise.<(Boolean|String|Object)>}
         * A promise that will be completed with true if the mapping was removed,
         * or false if the key did not exist.
         * If the 'previous' option is enabled, it returns the value
         * before removal or undefined if the key did not exist.
         * @memberof Client#
         * @since 0.3
         */
        remove: (k: (string | any), opts?: {
            /**
             * - Indicates whether previous value
             * should be returned. If no previous value exists, it would return
             * undefined.
             */
            previous: boolean;
        }) => Promise<(boolean | string | any)>;
        /**
         * Conditional store operation that associates the key with the given
         * value if the specified key is not already associated with a value.
         *
         * @param k {(String|Object)} Key with which the specified value is to be associated.
         * @param v {(String|Object)} Value to be associated with the specified key.
         * @param opts {StoreOptions=} Optional store options.
         * @returns {Promise.<(Boolean|String|Object)>}
         * A promise that will be completed with true if the mapping was stored,
         * or false if the key is already present.
         * If the 'previous' option is enabled, it returns the existing value
         * or undefined if the key does not exist.
         * @memberof Client#
         * @since 0.3
         */
        putIfAbsent: (k: (string | any), v: (string | any), opts?: {
            /**
             * - Indicates whether previous value
             * should be returned. If no previous value exists, it would return
             * undefined.
             */
            previous: boolean;
            /**
             * -
             * Lifespan for the stored entry.
             */
            lifespan: string;
            /**
             * -
             * Max idle time for the stored entry.
             */
            maxIdle: string;
        }) => Promise<(boolean | string | any)>;
        /**
         * Conditional store operation that replaces the entry for a key only
         * if currently mapped to a given value.
         *
         * @param k {(String|Object)} Key with which the specified value is associated.
         * @param v {(String|Object)} Value expected to be associated with the specified key.
         * @param opts {StoreOptions=} Optional store options.
         * @returns {Promise.<(Boolean|String|Object)>}
         * A promise that will be completed with true if the mapping was replaced,
         * or false if the key does not exist.
         * If the 'previous' option is enabled, it returns the value that was
         * replaced or undefined if the key did not exist.
         * @memberof Client#
         * @since 0.3
         */
        replace: (k: (string | any), v: (string | any), opts?: {
            /**
             * - Indicates whether previous value
             * should be returned. If no previous value exists, it would return
             * undefined.
             */
            previous: boolean;
            /**
             * -
             * Lifespan for the stored entry.
             */
            lifespan: string;
            /**
             * -
             * Max idle time for the stored entry.
             */
            maxIdle: string;
        }) => Promise<(boolean | string | any)>;
        /**
         * Replaces the given value only if its version matches the supplied
         * version.
         *
         * @param k {(String|Object)} Key with which the specified value is associated.
         * @param v {(String|Object)} Value expected to be associated with the specified key.
         * @param version {Buffer} binary buffer version that should match the
         * one in the server for the operation to succeed. Version information
         * can be retrieved with getWithMetadata method.
         * @param opts {StoreOptions=} Optional store options.
         * @returns {Promise.<(Boolean|String|Object)>}
         * A promise that will be completed with true if the version matches
         * and the mapping was replaced, otherwise it returns false if not
         * replaced because key does not exist or version sent does not match
         * server-side version.
         * If the 'previous' option is enabled, it returns the value that was
         * replaced if the version matches. If the version does not match, the
         * current value is returned. Fianlly if the key did not exist it
         * returns undefined.
         * @memberof Client#
         * @since 0.3
         */
        replaceWithVersion: (k: (string | any), v: (string | any), version: Buffer, opts?: {
            /**
             * - Indicates whether previous value
             * should be returned. If no previous value exists, it would return
             * undefined.
             */
            previous: boolean;
            /**
             * -
             * Lifespan for the stored entry.
             */
            lifespan: string;
            /**
             * -
             * Max idle time for the stored entry.
             */
            maxIdle: string;
        }) => Promise<(boolean | string | any)>;
        /**
         * Removes the given entry only if its version matches the
         * supplied version.
         *
         * @param k {(String|Object)} Key whose mapping is to be removed.
         * @param version {Buffer} binary buffer version that should match the
         * one in the server for the operation to succeed. Version information
         * can be retrieved with getWithMetadata method.
         * @param opts {RemoveOptions=} Optional remove options.
         * @returns {Promise.<(Boolean|String|Object)>}
         * A promise that will be completed with true if the version matches
         * and the mapping was removed, otherwise it returns false if not
         * removed because key does not exist or version sent does not match
         * server-side version.
         * If the 'previous' option is enabled, it returns the value that was
         * removed if the version matches. If the version does not match, the
         * current value is returned. Fianlly if the key did not exist it
         * returns undefined.
         * @memberof Client#
         * @since 0.3
         */
        removeWithVersion: (k: (string | any), version: Buffer, opts?: {
            /**
             * - Indicates whether previous value
             * should be returned. If no previous value exists, it would return
             * undefined.
             */
            previous: boolean;
        }) => Promise<(boolean | string | any)>;
        /**
         * Key/value entry.
         *
         * @typedef {Object} Entry
         * @property {(String|Object)} key - Entry's key.
         * @property {(String|Object)} value - Entry's value.
         * @since 0.3
         */
        /**
         * Retrieves all of the entries for the provided keys.
         *
         * @param keys {(String[]|Object[])} Keys to find values for.
         * @returns {Promise.<Entry[]>}
         * A promise that will be completed with an array of entries for all
         * keys found. If a key does not exist, there won't be an entry for that
         * key in the returned array.
         * @memberof Client#
         * @since 0.3
         */
        getAll: (keys: (string[] | any[])) => Promise<{
            /**
             * - Entry's key.
             */
            key: (string | any);
            /**
             * - Entry's value.
             */
            value: (string | any);
        }[]>;
        /**
         * Multi store options defines a set of optional parameters that can be
         * passed when storing multiple entries.
         *
         * @typedef {Object} MultiStoreOptions
         * @property {DurationUnit} lifespan -
         * Lifespan for the stored entry.
         * @property {DurationUnit} maxIdle -
         * Max idle time for the stored entry.
         * @since 0.3
         */
        /**
         * Stores all of the mappings from the specified entry array.
         *
         * @param pairs {Entry[]} key/value pair mappings to be stored
         * @param opts {MultiStoreOptions=}
         * Optional storage options to apply to all entries.
         * @returns {Promise}
         * A promise that will be completed when all entries have been stored.
         * @memberof Client#
         * @since 0.3
         */
        putAll: (pairs: {
            /**
             * - Entry's key.
             */
            key: (string | any);
            /**
             * - Entry's value.
             */
            value: (string | any);
        }[], opts?: {
            /**
             * -
             * Lifespan for the stored entry.
             */
            lifespan: string;
            /**
             * -
             * Max idle time for the stored entry.
             */
            maxIdle: string;
        }) => Promise<any>;
        /**
         * Iterator options defines a set of optional parameters that
         * control how iteration occurs and the data that's iterated over.
         *
         * @typedef {Object} IteratorOptions
         * @property {Boolean} metadata - Indicates whether entries iterated
         * over also expose metadata information. This option is false by
         * default which means no metadata information is exposed on iteration.
         * @since 0.3
         */
        /**
         * Iterate over the entries stored in server(s).
         *
         * @param batchSize {Number}
         * The number of entries transferred from the server at a time.
         * @param opts {IteratorOptions=} Optional iteration settings.
         * @return {Promise.<Iterator>}
         * A promise that will be completed with an iterator that can be used
         * to retrieve stored elements.
         * @memberof Client#
         * @since 0.3
         */
        iterator: (batchSize: number, opts?: {
            /**
             * - Indicates whether entries iterated
             * over also expose metadata information. This option is false by
             * default which means no metadata information is exposed on iteration.
             */
            metadata: boolean;
        }) => Promise<Iterator<any, any, undefined>>;
        /**
         * Count of entries in the server(s).
         *
         * @returns {Promise.<Number>}
         * A promise that will be completed with the number of entries stored.
         * @memberof Client#
         * @since 0.3
         */
        size: () => Promise<number>;
        /**
         * Clear all entries stored in server(s).
         *
         * @returns {Promise}
         * A promise that will be completed when the clear has been completed.
         * @memberof Client#
         * @since 0.3
         */
        clear: () => Promise<any>;
        /**
         * Pings the server(s).
         *
         * @returns {Promise}
         * A promise that will be completed when ping response was received.
         * @memberof Client#
         * @since 0.3
         */
        ping: () => Promise<any>;
        /**
         * Statistic item.
         *
         * @typedef {Object} StatsItem
         * @property {String} STAT_NAME -
         * Name of the statistic.
         * @property {String} STAT_VALUE -
         * Value of the statistic.
         * @since 0.3
         */
        /**
         * Retrieve various statistics from server(s).
         *
         * @returns {Promise<StatsItem[]>}
         * A promise that will be completed with an array of statistics, where
         * each element will have a single property. This single property will
         * have the statistic name as property name and statistic value as
         * property value.
         * @memberof Client#
         * @since 0.3
         */
        stats: () => Promise<{
            /**
             * -
             * Name of the statistic.
             */
            STAT_NAME: string;
            /**
             * -
             * Value of the statistic.
             */
            STAT_VALUE: string;
        }[]>;
        /**
         * Listener options.
         *
         * @typedef {Object} ListenOptions
         * @property {String} listenerId - Listener identifier can be passed
         * in as parameter to register multiple event callback functions for
         * the same listener.
         * @since 0.3
         */
        /**
         * Add an event listener.
         *
         * @param {String} event
         * Event to add listener to. Possible values are:
         * 'create', 'modify', 'remove' and 'expiry'.
         * @param {Function} listener
         * Function to invoke when the listener event is received.
         * 'create' and 'modify' events callback the function with key,
         * entry version and listener id.
         * 'remove' and 'expiry' events callback the function with key
         * and listener id.
         * @param opts {ListenOptions=} Options for adding listener.
         * @returns {Promise<String>}
         * A promise that will be completed with the identifier of the listener.
         * This identifier can be used to register multiple callbacks with the
         * same listener, or to remove the listener.
         * @memberof Client#
         * @since 0.3
         */
        addListener: (event: string, listener: Function, opts?: {
            /**
             * - Listener identifier can be passed
             * in as parameter to register multiple event callback functions for
             * the same listener.
             */
            listenerId: string;
        }) => Promise<string>;
        /**
         * Remove an event listener.
         *
         * @param {String} listenerId
         * Listener identifier to identify listener to remove.
         * @return {Promise}
         * A promise that will be completed when the listener has been removed.
         * @memberof Client#
         * @since 0.3
         */
        removeListener: (listenerId: string) => Promise<any>;
        /**
         * Add script to server(s).
         *
         * @param {String} scriptName Name of the script to store.
         * @param {String} script Script to store in server.
         * @return {Promise}
         * A promise that will be completed when the script has been stored.
         * @memberof Client#
         * @since 0.3
         */
        addScript: (scriptName: string, script: string) => Promise<any>;
        /**
         * Script execution parameters.
         *
         * @typedef {Object} ExecParams
         * @property {String} PARAM_NAME -
         * Name of the parameter.
         * @property {String} PARAM_VALUE -
         * Value of the parameter.
         * @since 0.3
         */
        /**
         * Execute the named script passing in optional parameters.
         *
         * @param {String} scriptName Name of the script to execute.
         * @param {ExecParams[]} [params]
         * Optional array of named parameters to pass to script in server.
         * @returns {Promise<String|String[]>}
         * A promise that will be completed with either the value returned by the
         * script after execution for local scripts, or an array of values
         * returned by the script when executed in multiple servers for
         * distributed scripts.
         * @memberof Client#
         * @since 0.3
         */
        execute: (scriptName: string, params?: {
            /**
             * -
             * Name of the parameter.
             */
            PARAM_NAME: string;
            /**
             * -
             * Value of the parameter.
             */
            PARAM_VALUE: string;
        }[]) => Promise<string | string[]>;
        /**
         * Get server topology related information.
         *
         * @returns {TopologyInfo}
         * An object instance that can be used to query diverse information
         * related to the server topology information.
         * @memberof Client#
         * @since 0.3
         */
        getTopologyInfo: () => (transport: any) => {
            /**
             * Get the server topology identifier.
             *
             * @returns {Number} Topology identifier.
             * @memberof Topology#
             * @since 0.3
             */
            getTopologyId: () => number;
            /**
             * Get the list of servers that the client is currently connected to.
             *
             * @return {ServerAddress[]} An array of server addresses.
             * @memberof Topology#
             * @since 0.3
             */
            getMembers: () => {
                /**
                 * - Server host name.
                 */
                host: string;
                /**
                 * - Server port.
                 */
                port: number;
            }[];
            /**
             * Find the list of server addresses that are owners for a given key.
             *
             * @param {(String|Object)} k Key to find owners for.
             * @return {ServerAddress[]}
             * An array of server addresses that are owners for the given key.
             * @memberof Topology#
             * @since 0.3
             */
            findOwners: (k: (string | any)) => {
                /**
                 * - Server host name.
                 */
                host: string;
                /**
                 * - Server port.
                 */
                port: number;
            }[];
            /**
             * Switch remote cache manager to a different cluster,
             * previously declared via configuration.
             *
             * @param clusterName name of the cluster to which to switch to
             * @return {Promise<Boolean>}
             * A promise encapsulating a Boolean that indicates {@code true} if the
             * switch happened, or {@code false} otherwise.
             * @memberof Topology#
             * @since 0.4
             */
            switchToCluster: (clusterName: any) => Promise<boolean>;
            /**
             * Switch remote cache manager to the default cluster,
             * previously declared via configuration.
             *
             * @return {Promise<Boolean>}
             * A promise encapsulating a Boolean that indicates {@code true} if the
             * switch happened, or {@code false} otherwise.
             * @memberof Topology#
             * @since 0.4
             */
            switchToDefaultCluster: () => Promise<boolean>;
        };
        /**
         * Get client information represented as a string.
         * @memberof Client#
         * @since 0.4
         */
        toString: () => string;
        registerProtostreamType: (typeName: any, descriptorId: any) => any;
        registerProtostreamRoot: (root: any) => any;
    };
    /**
     * Cluster information.
     *
     * @typedef {Object} Cluster
     * @property {String} name - Cluster name.
     * @property {ServerAddress[]} servers - Cluster servers details.
     * @since 0.3
     */
    /**
     * Client configuration settings. Object instances that override
     * these configuration options can be used on client construction to tweak
     * its behaviour.
     *
     * @static
     * @typedef {Object} ClientOptions
     * @property {?(2.9|2.5|2.2)} [version=2.9] - Version of client/server protocol.
     * @property {?String} [cacheName] - Optional cache name.
     * @property {?Number} [maxRetries=3] - Optional number of retries for operation.
     * @property {?Object} [ssl] - TLS/SSL properties.
     * @property {?boolean} [ssl.enabled=false] - Optional flag to enable SSL support.
     * @property {?String} [ssl.secureProtocol=TLSv1_2_method] - Optional field with secure protocol in use.
     * @property {?String[]} [ssl.trustCerts] - Optional paths of trusted SSL certificates.
     * @property {?String} [ssl.clientAuth.key] - Optional path to client authentication key.
     * @property {?String} [ssl.clientAuth.passphrase] - Optional password for client key.
     * @property {?String} [ssl.clientAuth.cert] - Optional client certificate.
     * @property {?String} [ssl.sniHostName] - Optional SNI host name.
     * @property {?String} [ssl.cryptoStore.path] - Optional crypto store path.
     * @property {?String} [ssl.cryptoStore.passphrase] - Optional password for crypto store.
     * @property {?Object} [authentication]- Authentication properties.
     * @property {?boolean} [authentication.enabled]- Enable authentication.
     * @property {?String} [authentication.saslMechanism] - Select the SASL mechanism to use. Can be one of PLAIN, DIGEST-MD5, SCRAM-SHA-1, SCRAM-SHA-256, SCRAM-SHA-384, SCRAM-SHA-512, EXTERNAL, OAUTHBEARER
     * @property {?String} [authentication.userName] - The authentication username. Required by the PLAIN, DIGEST and SCRAM mechanisms.
     * @property {?String} [authentication.password] - The authentication password. Required by the PLAIN, DIGEST and SCRAM mechanisms.
     * @property {?String} [authentication.token] - The OAuth token. Required by the OAUTHBEARER mechanism.
     * @property {?String} [authentication.authzid] - The SASL authorization ID.
     * @property {?String} [authentication.authzid] - The SASL authorization ID.
     * @property {?Object} [dataFormat] - Content-type for entry
     * @property {?String} [dataFormat.keyType] - Content-type for key
     * @property {?String} [dataFormat.valueType] - Content-type for value
     * @property {?boolean} [topologyUpdates=true] - Optional flag to controls whether the client deals with topology updates or not.
     * @property {?("text/plain"|"application/json")} [mediaType="text/plain"] - Media type of the cache contents.
     * @property {?Cluster[]} [clusters] - Optional additional clusters for cross-site failovers.
     * @since 0.3
     */
    config: {
        version: string;
        cacheName: any;
        maxRetries: number;
        authentication: {
            enabled: boolean;
            serverName: string;
            saslProperties: {};
            saslMechanism: string;
            userName: string;
            password: any[];
            realm: string;
            token: string;
        };
        ssl: {
            enabled: boolean;
            secureProtocol: string;
            trustCerts: any[];
            clientAuth: {
                key: any;
                passphrase: any;
                cert: any;
            };
            sniHostName: any;
            cryptoStore: {
                path: any;
                passphrase: any;
            };
        };
        dataFormat: {
            keyType: string;
            valueType: string;
        };
        topologyUpdates: boolean;
        clusters: any[];
    };
}>>;
