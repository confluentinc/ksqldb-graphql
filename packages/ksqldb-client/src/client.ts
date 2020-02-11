import * as EventEmitter from 'events';
import * as http2 from 'http2';


// Endpoints.createQueryPublisher
export interface QueryStreamArgs {
    sql: string;
    push?: boolean;
    properties?: Record<string, any>;
}

export interface CloseQueryArgs {
    queryId: { id: string };
}

// Endpoints.createInsertsSubscriber
export interface InsertsStreamArgs {
    target: string;
    requiresAcks: boolean;
    properties: Record<string, any>;
}

export interface ErrorResponse {
    status: string;
    errorCode: number;
    message: string;
}

export interface InsertAck {
    status: 'ok';
}

export interface QueryResponseMetadata {
    queryId: string;
    columnNames: string[];
    columnTypes: string[];
    rowCount: number | null; // null if push
}

export type QueryResponseRow = any[];


export const DELIMITED_CONTENT_TYPE = 'application/vnd.ksqlapi.delimited.v1';

export abstract class QueryStream<T> {
    closed: boolean = false;

    constructor(
        protected session: http2.ClientHttp2Session,
        protected queryStreamArgs: QueryStreamArgs,
        protected mapRow: (rawRow: string, ks: string[]) => T
    ) {
    }

    headers(): Record<string, string> {
        return {
            [http2.constants.HTTP2_HEADER_PATH]: '/query-stream',
            [http2.constants.HTTP2_HEADER_METHOD]: 'POST',
            [http2.constants.HTTP2_HEADER_CONTENT_TYPE]: DELIMITED_CONTENT_TYPE,
        };
    }

    parseChunk(buf: Buffer) {
        return buf
            .toString()
            .split('\n')
            .filter((s) => s);
    }

    initQueryStream(): http2.ClientHttp2Stream {
        const stream = this.session.request(this.headers());

        // we write params into the request stream, then end the request stream.
        // if we don't end the request stream, the req isn't routed on the server.
        // note that the _response_ stream does not close, so we still get results.
        const reqPayload = Buffer.from(JSON.stringify(this.queryStreamArgs));
        stream.end(reqPayload);

        return stream;
    }
}

interface QueryStreamEventEmitter extends EventEmitter {
    emit(event: 'close'): boolean;
    emit(event: 'error', err: Error): boolean;
    emit(event: 'data', buf: Buffer): boolean;

    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'data', listener: (buf: Buffer) => void): this;
}

export class EventEmitterQueryStream<T> extends QueryStream<T> {

    queryEvents(): QueryStreamEventEmitter {
        // todo
        return null;
    }

}

export class AsyncIteratorQueryStream<T> extends QueryStream<T> {

    [Symbol.asyncIterator](): AsyncIterator<T> {
        // array of resolve/reject tuples represents pending work
        const promised: [
            (ret: any) => void,
            (err: any) => void
        ][] = [];

        // unprocessed query response lines returned by the server
        const received: any[] = [];

        const stream: http2.ClientHttp2Stream = this.initQueryStream();

        const destroyStream = (err?: Error) => {
            // close existing promises
            for (const [resolve, reject] of promised) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ value: undefined, done: true })
                }
            }

            stream.destroy();
            this.closed = true;
        };

        stream
            .on('error', (error) => destroyStream(error))
            .on('close', () => destroyStream(new Error('close')))
            .on('abort', () => destroyStream(new Error('abort')))
            .on('timeout', () => destroyStream(new Error('timeout')));

        // the work loop delivers query result data by delimited row.
        // given demand, reads next buffer from the stream if available.
        const doWork = () => {
            if (this.closed) { return; }

            // process available query response lines
            while (promised.length && received.length) {
                const [resolve,] = promised.shift();
                const rawJson = received.shift();
                resolve(rawJson)
            }

            if (promised.length) {
                // pending work is unfulfilled; try to read it from stream                
                const next = stream.read();
                if (next !== null) {
                    const nextLines = this.parseChunk(next);
                    received.push(...nextLines);
                }
                // loop work
                setImmediate(() => doWork());
            }
        }

        // enqueue work to be handled by the work loop
        const nextPromise = (): Promise<string> =>
            new Promise((resolve, reject) => promised.push([resolve, reject]));


        // the first promise parses query response metadata and returns col names.
        const getRowKeys: Promise<string[]> = nextPromise()
            .then((rawMeta: string) => {
                const meta = JSON.parse(rawMeta);
                if (meta.status === 'error') {
                    const err = meta as ErrorResponse
                    destroyStream(err);
                    throw err;
                }
                return meta.columnNames;
            });

        doWork();

        // return async iterator contract
        return {
            next: () => {
                if (this.closed) {
                    return Promise.resolve({ value: undefined, done: true });
                }

                // enqueue the next row handler
                return getRowKeys.then((ks) => {
                    const enqueued = nextPromise()
                        .then((rawRow) => {
                            const value = this.mapRow(rawRow, ks);
                            return { value, done: false };
                        });

                    doWork();
                    return enqueued;
                });
            },

            return: () => {
                destroyStream();
                return Promise.resolve({ value: undefined, done: true });
            }
        }
    }
}

export const asyncIteratorQueryStream = (
    session: http2.ClientHttp2Session,
    queryStreamArgs: QueryStreamArgs
): AsyncIteratorQueryStream<Record<string, any>> => {
    // map row values keyed by the column names from response metadata
    const mapRow = (rawRow: string, ks: string[]) => {
        const vs = JSON.parse(rawRow);
        return ks.reduce((acc, k, i) => (acc[k] = vs[i], acc), {}) as Record<string, any>;
    };
    return new AsyncIteratorQueryStream(session, queryStreamArgs, mapRow);
};


// usage
//
// const session = http2.connect('https://localhost:8089');
// const q = asyncIteratorQueryStream(session, { sql: 'select * from foo' });
// (async () => {
//     for await (const row: Record<string, any> of q) {
//         // ...
//     }    
// })();
