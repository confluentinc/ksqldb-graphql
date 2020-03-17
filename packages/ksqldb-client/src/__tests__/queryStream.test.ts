import { asyncIteratorQueryStream } from '../queryStream';
const eventer = {
    on: () => { return eventer },
}

const command = { sql: 'select * from foo' };
const createSession = (readState: any) => {
    let currentRead = -1;
    return {
        request: (headers: any) => {
            return {
                end: (payload: any) => { },
                destroy: jest.fn(),
                read: () => {
                    if (currentRead < readState.length) {
                        currentRead++;
                        return readState[currentRead];

                    }
                },
                ...eventer,
            }
        }
    }
}
describe('queryStream', () => {
    it('returns an async iterator', async (done) => {
        const session = createSession([
            Buffer.from(JSON.stringify({
                columnNames: ['first', 'second', 'third']
            })),
            Buffer.from(JSON.stringify([1, 2, 3])),
        ]);

        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const stream = asyncIteratorQueryStream(session, command, 'test');
        for await (const row of stream) {
            expect(row).toEqual({
                "test": {
                    "first": 1,
                    "second": 2,
                    "third": 3,
                },
            });
            done();
        }
    });
});
