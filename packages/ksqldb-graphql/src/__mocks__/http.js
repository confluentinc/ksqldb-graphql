/* eslint  @typescript-eslint/explicit-function-return-type: 0 */
/* eslint  @typescript-eslint/no-var-requires: 0 */

const http = jest.genMockFromModule('http');
const events = require('events');

const reqEv = new events.EventEmitter();

http.request = (opts, callback) => {
  const res = {
    statusCode: 200,
    on: (eventName, callback) => {
      callback(
        Buffer.from(
          JSON.stringify({
            '@type': 'source_descriptions',
            statementText: 'show tables extended;',
            sourceDescriptions: [],
            warnings: [],
          })
        )
      );
    },
  };
  callback(res);
  return {
    on: (eventName, callback) => {
      if (eventName === 'close') {
        reqEv.on('end', () => {
          callback();
        });
      }
    },
    write: () => null,
    end: () => {
      reqEv.emit('end');
    },
  };
};

module.exports = http;
