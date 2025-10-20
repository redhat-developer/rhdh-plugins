import { TransportFunction } from "../emitter";
/**
 * httpTransport provides a simple HTTP Transport function, which can send a CloudEvent,
 * encoded as a Message to the endpoint. The returned function can be used with emitterFor()
 * to provide an event emitter, for example:
 *
 * const emitter = emitterFor(httpTransport("http://example.com"));
 * emitter.emit(myCloudEvent)
 *    .then(resp => console.log(resp));
 *
 * @param {string|URL} sink the destination endpoint for the event
 * @returns {TransportFunction} a function which can be used to send CloudEvents to _sink_
 */
export declare function httpTransport(sink: string | URL): TransportFunction;
