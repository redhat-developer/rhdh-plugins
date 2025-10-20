"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emitter = exports.emitterFor = void 0;
const message_1 = require("../message");
const events_1 = require("events");
const emitterDefaults = { binding: message_1.HTTP, mode: message_1.Mode.BINARY };
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
function emitterFor(fn, options = emitterDefaults) {
    if (!fn) {
        throw new TypeError("A TransportFunction is required");
    }
    const { binding, mode } = { ...emitterDefaults, ...options };
    return function emit(event, opts) {
        opts = opts || {};
        switch (mode) {
            case message_1.Mode.BINARY:
                return fn(binding.binary(event), opts);
            case message_1.Mode.STRUCTURED:
                return fn(binding.structured(event), opts);
            default:
                throw new TypeError(`Unexpected transport mode: ${mode}`);
        }
    };
}
exports.emitterFor = emitterFor;
/**
 * A helper class to emit CloudEvents within an application
 */
class Emitter {
    /**
     * Return or create the Emitter singleton
     *
     * @return {Emitter} return Emitter singleton
     */
    static getInstance() {
        if (!Emitter.instance) {
            Emitter.instance = new events_1.EventEmitter();
        }
        return Emitter.instance;
    }
    /**
     * Add a listener for eventing
     *
     * @param {string} event type to listen to
     * @param {Function} listener to call on event
     * @return {void}
     */
    static on(event, listener) {
        Emitter.getInstance().on(event, listener);
    }
    /**
     * Emit an event inside this application
     *
     * @param {CloudEvent} event to emit
     * @param {boolean} ensureDelivery fail the promise if one listener fails
     * @return {void}
     */
    static async emitEvent(event, ensureDelivery = true) {
        if (!ensureDelivery) {
            // Ensure delivery is disabled so we don't wait for Promise
            Emitter.getInstance().emit("cloudevent", event);
        }
        else {
            // Execute all listeners and wrap them in a Promise
            await Promise.all(Emitter.getInstance()
                .listeners("cloudevent")
                .map(async (l) => l(event)));
        }
    }
}
exports.Emitter = Emitter;
/**
 * Singleton store
 */
Emitter.instance = undefined;
