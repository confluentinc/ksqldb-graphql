import { ClientHttp2Session } from 'http2';

import { QueryStreamArgs, AsyncIteratorQueryStream } from './src/queryStream';

declare module '@ksqldb/client' {
  export const asyncIteratorQueryStream: (
    session: ClientHttp2Session,
    queryStreamArgs: QueryStreamArgs,
    nameKey: string
  ) => AsyncIteratorQueryStream<any>;
}
