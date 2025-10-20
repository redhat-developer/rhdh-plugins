/// <reference types="node" />
import { EventEmitter } from "events";
import { RedisOptions, NodeKey, NodeRole } from "./util";
import Redis from "../Redis";
declare type NodeRecord = {
    redis: Redis;
    endListener: () => void;
    errorListener: (error: unknown) => void;
};
export default class ConnectionPool extends EventEmitter {
    private redisOptions;
    private nodeRecords;
    private specifiedOptions;
    constructor(redisOptions: any);
    getNodes(role?: NodeRole): Redis[];
    getInstanceByKey(key: NodeKey): Redis;
    getSampleInstance(role: NodeRole): Redis;
    /**
     * Find or create a connection to the node
     */
    findOrCreate(redisOptions: RedisOptions, readOnly?: boolean): NodeRecord;
    /**
     * Reset the pool with a set of nodes.
     * The old node will be removed.
     */
    reset(nodes: RedisOptions[]): void;
    /**
     * Remove a node from the pool.
     */
    private removeNode;
}
export {};
