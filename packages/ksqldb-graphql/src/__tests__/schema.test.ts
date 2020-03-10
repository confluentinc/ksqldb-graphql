import { printSchema } from 'graphql';

import { generateSchemaAndFields } from '../schema';
import { carsPayload, carSchemaResult } from '../__mocks__/cars';
import { processingLogPayload, processingLogResult } from '../__mocks__/processingLog';

jest.mock('http2', () => {
  return {
    connect: (): any => ({
      on: jest.fn(),
    }),
  };
});
describe('processing fields', () => {
  it('creates a type for the cars demo', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const { schema, fields: rawFields } = generateSchemaAndFields(carsPayload);
    expect(printSchema(schema)).toEqual(carSchemaResult);
    expect(rawFields).not.toBe(undefined);
  });
  it('creates a type for the processing log', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const { schema, fields: rawFields } = generateSchemaAndFields(processingLogPayload);
    expect(printSchema(schema)).toEqual(processingLogResult);
    expect(rawFields).not.toBe(undefined);
  });
});
