/// <reference types="node" />
import { CloudEvent } from "../event/cloudevent";
import { Message } from "../message";
import { EventEmitter } from "events";
/**
 * Options is an additional, optional dictionary of options that may
 * be passed to an EmitterFunction and TransportFunction
 * @interface
 */
export interface Options {
    [key: string]: string | Record<string, unknown> | unknown;
}
/**
 * EmitterFunction is an invokable interface returned by {@linkcode emitterFor}.
 * Invoke an EmitterFunction with a CloudEvent and optional transport
 * options to send the event as a Message across supported transports.
 * @interface
 */
export interface EmitterFunction {
    <T>(event: CloudEvent<T>, options?: Options): Promise<unknown>;
}
/**
 * TransportFunction is an invokable interface provided to the emitterFactory.
 * A TransportFunction's responsiblity is to send a JSON encoded event Message
 * across the wire.
 * @interface
 */
export interface TransportFunction {
    (message: Message, options?: Options): Promise<unknown>;
}
/**
 * Creates and returns an {@linkcode EmitterFunction} using the supplied
 * {@linkcode TransportFunction}. The returned {@linkcode EmitterFunction}
 * will invoke the {@linkcode Binding}'s `binary` or `structured` function
 * to convert a {@linkcode CloudEvent} into a JSON
 * {@linkcode Message} based on the {@linkcode Mode} provided, and invoke the
 * TransportFunction with the Message and any supplied options.
 *
 * @param {TransportFunction} fn a TransportFunction that can accept an event Message
 * @param { {Binding, Mode} } options network binding and message serialization options
 * @param {Binding} options.binding a transport binding, e.g. HTTP
 * @param {Mode} options.mode the encoding mode (Mode.BINARY or Mode.STRUCTURED)
 * @returns {EmitterFunction} an EmitterFunction to send events with
 */
export declare function emitterFor(fn: TransportFunction, options?: Options): EmitterFunction;
/**
 * A helper class to emit CloudEvents within an application
 */
export declare class Emitter {
    /**
     * Singleton store
     */
    static instance: EventEmitter | undefined;
    /**
     * Return or create the Emitter singleton
     *
     * @return {Emitter} return Emitter singleton
     */
    static getInstance(): EventEmitter;
    /**
     * Add a listener for eventing
     *
     * @param {string} event type to listen to
     * @param {Function} listener to call on event
     * @return {void}
     */
    static on(event: "cloudevent" | "newListener" | "removeListener", listener: (...args: any[]) => void): void;
    /**
     * Emit an event inside this application
     *
     * @param {CloudEvent} event to emit
     * @param {boolean} ensureDelivery fail the promise if one listener fails
     * @return {void}
     */
    static emitEvent<T>(event: CloudEvent<T>, ensureDelivery?: boolean): Promise<void>;
}
