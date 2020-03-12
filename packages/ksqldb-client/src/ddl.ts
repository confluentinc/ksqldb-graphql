import { constants, ClientHttp2Session, ClientHttp2Stream } from 'http2';

const {
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_CONTENT_TYPE,
  HTTP2_HEADER_METHOD,
} = constants;

type DdlArgs = {
  ksql: string;
};
export const DELIMITED_CONTENT_TYPE = 'application/json';
class Ddl {
  constructor(protected session: ClientHttp2Session, protected ddlArgs: DdlArgs) {
    this.session = session;
    this.ddlArgs = ddlArgs;
  }

  headers(): any {
    return {
      [HTTP2_HEADER_PATH]: '/ksql',
      [HTTP2_HEADER_METHOD]: 'POST',
      [HTTP2_HEADER_CONTENT_TYPE]: DELIMITED_CONTENT_TYPE,
    };
  }

  init = (): ClientHttp2Stream => {
    const stream = this.session.request(this.headers());
    const reqPayload = Buffer.from(JSON.stringify(this.ddlArgs));
    stream.end(reqPayload);
    return stream;
  };
}

export const ddl = (session: ClientHttp2Session, ddlArgs: DdlArgs): Promise<any> => {
  const ddl = new Ddl(session, ddlArgs);
  const stream = ddl.init();
  let data = '';

  const destroyStream = (message: any, status: number): any => {
    stream.close();
    return {
      message,
      status,
    };
  };
  return new Promise(resolve => {
    stream.on('response', headers => {
      const status = Number(headers[HTTP2_HEADER_STATUS]);
      if (status > 302) {
        // TODO when https://github.com/confluentinc/ksql/pull/4702 is merged, get this to actually work
        resolve(destroyStream(`ddl failed. Status ${headers[HTTP2_HEADER_STATUS]}`, status));
      }
      stream
        .on('data', chunk => (data += chunk))
        .on('error', error => resolve(destroyStream(error, status)))
        .on('abort', () => resolve(destroyStream(new Error('abort'), status)))
        .on('timeout', () => resolve(destroyStream(new Error('timeout'), status)))
        .on('end', () => {
          stream.close();
          resolve(destroyStream(data, status));
        });
    });
  }).catch(e => {
    destroyStream(e, 0);
  });
};
/*
 *const session = http2.connect('https://localhost:8089');
 *const q = await ddl(session, { sql: 'select * from foo' });
 *
 */
