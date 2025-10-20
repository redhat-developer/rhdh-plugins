import * as _backstage_backend_plugin_api from '@backstage/backend-plugin-api';
import { EventsService } from '@backstage/plugin-events-node';
import { JsonObject } from '@backstage/types';

/**
 * @public
 */
type SignalsServiceOptions = {
    events: EventsService;
};
/** @public */
type SignalPayload<TMessage extends JsonObject = JsonObject> = {
    recipients: {
        type: 'user';
        entityRef: string | string[];
    } | {
        type: 'broadcast';
    };
    channel: string;
    message: TMessage;
};

/** @public */
interface SignalsService {
    /**
     * Publishes a signal to user refs to specific topic
     * @param signal - Signal to publish
     */
    publish<TMessage extends JsonObject = JsonObject>(signal: SignalPayload<TMessage>): Promise<void>;
}
/**
 * @public
 * @deprecated Use `SignalsService` instead
 */
interface SignalService extends SignalsService {
}

/** @public */
declare const signalsServiceRef: _backstage_backend_plugin_api.ServiceRef<SignalsService, "plugin", "singleton">;
/**
 * @public
 * @deprecated Use `signalsServiceRef` instead
 */
declare const signalService: _backstage_backend_plugin_api.ServiceRef<SignalsService, "plugin", "singleton">;

/** @public */
declare class DefaultSignalsService implements SignalsService {
    private events;
    static create(options: SignalsServiceOptions): DefaultSignalsService;
    private constructor();
    /**
     * Publishes a signal to user refs to specific topic
     * @param signal - Signal to publish
     */
    publish<TMessage extends JsonObject = JsonObject>(signal: SignalPayload<TMessage>): Promise<void>;
}
/**
 * @public
 * @deprecated Use `DefaultSignalsService` instead
 */
declare const DefaultSignalService: typeof DefaultSignalsService;

export { DefaultSignalService, DefaultSignalsService, type SignalPayload, type SignalService, type SignalsService, type SignalsServiceOptions, signalService, signalsServiceRef };
