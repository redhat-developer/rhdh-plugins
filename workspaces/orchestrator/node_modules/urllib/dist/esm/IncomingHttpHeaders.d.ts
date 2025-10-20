import type { Except } from 'type-fest';
import type { IncomingHttpHeaders as HTTPIncomingHttpHeaders } from 'node:http';
export interface IncomingHttpHeaders extends Except<HTTPIncomingHttpHeaders, 'set-cookie'> {
    'set-cookie'?: string | string[];
}
