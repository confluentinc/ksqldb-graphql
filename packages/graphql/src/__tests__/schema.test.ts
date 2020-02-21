import { printSchema } from 'graphql';

import { Field } from '../type/definition';
import { generateSchemaAndFields } from '../schema';

const processingLogFields = [
  {
    name: 'ROWTIME',
    schema: {
      type: 'BIGINT',
      fields: null,
      memberSchema: null,
    },
  },
  {
    name: 'ROWKEY',
    schema: {
      type: 'STRING',
      fields: null,
      memberSchema: null,
    },
  },
  {
    name: 'LOGGER',
    schema: {
      type: 'STRING',
      fields: null,
      memberSchema: null,
    },
  },
  {
    name: 'LEVEL',
    schema: {
      type: 'STRING',
      fields: null,
      memberSchema: null,
    },
  },
  {
    name: 'TIME',
    schema: {
      type: 'BIGINT',
      fields: null,
      memberSchema: null,
    },
  },
  {
    name: 'MESSAGE',
    schema: {
      type: 'STRUCT',
      fields: [
        {
          name: 'TYPE',
          schema: {
            type: 'INTEGER',
            fields: null,
            memberSchema: null,
          },
        },
        {
          name: 'DESERIALIZATIONERROR',
          schema: {
            type: 'STRUCT',
            fields: [
              {
                name: 'ERRORMESSAGE',
                schema: {
                  type: 'STRING',
                  fields: null,
                  memberSchema: null,
                },
              },
              {
                name: 'RECORDB64',
                schema: {
                  type: 'STRING',
                  fields: null,
                  memberSchema: null,
                },
              },
              {
                name: 'CAUSE',
                schema: {
                  type: 'ARRAY',
                  fields: null,
                  memberSchema: {
                    type: 'STRING',
                    fields: null,
                    memberSchema: null,
                  },
                },
              },
            ],
            memberSchema: null,
          },
        },
        {
          name: 'RECORDPROCESSINGERROR',
          schema: {
            type: 'STRUCT',
            fields: [
              {
                name: 'ERRORMESSAGE',
                schema: {
                  type: 'STRING',
                  fields: null,
                  memberSchema: null,
                },
              },
              {
                name: 'RECORD',
                schema: {
                  type: 'STRING',
                  fields: null,
                  memberSchema: null,
                },
              },
              {
                name: 'CAUSE',
                schema: {
                  type: 'ARRAY',
                  fields: null,
                  memberSchema: {
                    type: 'STRING',
                    fields: null,
                    memberSchema: null,
                  },
                },
              },
            ],
            memberSchema: null,
          },
        },
        {
          name: 'PRODUCTIONERROR',
          schema: {
            type: 'STRUCT',
            fields: [
              {
                name: 'ERRORMESSAGE',
                schema: {
                  type: 'STRING',
                  fields: null,
                  memberSchema: null,
                },
              },
            ],
            memberSchema: null,
          },
        },
      ],
      memberSchema: null,
    },
  },
];

const schemaResult = `type DESERIALIZATIONERROR {
  ERRORMESSAGE: String
  RECORDB64: String
  CAUSE: [String]
}

type KSQL_PROCESSING_LOG {
  ROWTIME: Int
  ROWKEY: String
  LOGGER: String
  LEVEL: String
  TIME: Int
  MESSAGE: MESSAGE
  command: String
}

type MESSAGE {
  TYPE: Int
  DESERIALIZATIONERROR: DESERIALIZATIONERROR
  RECORDPROCESSINGERROR: RECORDPROCESSINGERROR
  PRODUCTIONERROR: PRODUCTIONERROR
}

type PRODUCTIONERROR {
  ERRORMESSAGE: String
}

type Query {
  KSQL_PROCESSING_LOG(ROWTIME: Int, ROWKEY: String, LOGGER: String, LEVEL: String, TIME: Int, command: String): KSQL_PROCESSING_LOG
}

type RECORDPROCESSINGERROR {
  ERRORMESSAGE: String
  RECORD: String
  CAUSE: [String]
}

type Subscription {
  KSQL_PROCESSING_LOG(ROWTIME: Int, ROWKEY: String, LOGGER: String, LEVEL: String, TIME: Int, command: String): KSQL_PROCESSING_LOG
}
`;

describe('processing fields', () => {
  it('creates a type for the processing log', () => {
    const fields: Array<Field> = processingLogFields as Array<Field>;
    const { schema, fields: rawFields } = generateSchemaAndFields([
      {
        name: 'KSQL_PROCESSING_LOG',
        fields,
        readQueries: [],
        writeQueries: [],
        type: 'STREAM',
        key: '',
        timestamp: '',
        statistics: '',
        errorStats: '',
        extended: true,
        format: 'JSON',
        topic: 'ksql_processing_log',
        partitions: 1,
        replication: 1,
      },
    ]);
    const testSchema = printSchema(schema);
    expect(testSchema).toEqual(schemaResult);
    expect(rawFields).not.toBe(undefined);
  });
});
