
import { runCommand } from '../requester';
jest.mock('http');

describe('requester', () => {
    it('requests ksql data', async () => {
        const command = "show tables extended;";
        const data = await runCommand(command, {});
        expect(data).toEqual({ "data": { "@type": "source_descriptions", "sourceDescriptions": [], "statementText": "show tables extended;", "warnings": [] }, "statusCode": 200 });
    })
});