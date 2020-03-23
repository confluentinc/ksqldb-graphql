import { ddl } from '../ddl';

describe('ddl', () => {
    // this only errors right now
    it('fails over when http2 is not supported', async () => {
        const session = {
            request: () => {
                return {
                    on: (eventType, cb) => {
                        if (eventType === 'error') {
                            cb(new Error('itsbad'))
                        }
                    }
                }
            }
        }
        const command = { ksql: "select * from cars where ROWKEY='fd'GROUP BY id ;" }
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const result = await ddl(session, command);
        expect(result.error).toEqual(true);
    });
}) 