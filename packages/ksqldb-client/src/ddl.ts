import { constants, ClientHttp2Session } from 'http2';

const {
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_CONTENT_TYPE,
  HTTP2_HEADER_METHOD,
} = constants;

type DdlArgs = {
  ksql: string;
};

export const DELIMITED_CONTENT_TYPE = 'application/vnd.ksqlapi.delimited.v1'

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

  init = (): Promise<any> => {
    return new Promise(resolve => {

      try {
        const stream = this.session.request(this.headers());
        const reqPayload = Buffer.from(JSON.stringify(this.ddlArgs));
        stream.on('error', (e) => {
          resolve(e)
        })
        stream.on('connect', () => {
          resolve(stream);
        })

        stream.end(reqPayload);
        return stream;
      } catch (e) {
        resolve(e);
      }
    })
  }
}

type DdlRepsonse = {
  message: any,
  statusCode: string,
  error?: boolean,
}
export const ddl = (session: ClientHttp2Session, ddlArgs: DdlArgs): Promise<void | DdlRepsonse> => {
  return new Promise<void | DdlRepsonse>(async resolve => {

    const ddl = new Ddl(session, ddlArgs);
    const stream = await ddl.init();
    const destroyStream = (message: any, statusCode: string): DdlRepsonse => {
      stream.close();
      return {
        message,
        statusCode,
      };
    };


    let data = '';
    if (stream instanceof Error) {
      const errors: NodeJS.ErrnoException = stream as NodeJS.ErrnoException;
      resolve({
        message: errors.stack,
        statusCode: errors.code,
        error: true
      })
      return;
    }
    stream.on('response', headers => {
      const status = headers[HTTP2_HEADER_STATUS];
      if (Number(status) > 302 || isNaN(status)) {
        // TODO when https://github.com/confluentinc/ksql/pull/4702 is merged, get this to actually work
        resolve(destroyStream(`ddl failed. Status ${headers[HTTP2_HEADER_STATUS]}`, status));
      }
      stream
        .on('data', chunk => (data += chunk))
        .on('error', error => resolve(destroyStream(error, status)))
        .on('abort', () => resolve(destroyStream(new Error('abort'), status)))
        .on('timeout', () => resolve(destroyStream(new Error('timeout'), status)))
        .on('end', () => {
          resolve(destroyStream(data, status));
        });
    });
  }).catch(e => {
    console.error(e);
    Promise.resolve(e);
  });
};
/*
 *const session = http2.connect('https://localhost:8089');
 *const q = await ddl(session, { ksql: 'select * from foo' });
 *
 */
