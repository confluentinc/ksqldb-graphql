import { printSchema, GraphQLSchema } from 'graphql';

import { generateSchemaFromKsql } from './schema';

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

const schemaResult = `schema {
  query: KSQL_PROCESSING_LOG
}

type DESERIALIZATIONERROR {
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

type RECORDPROCESSINGERROR {
  ERRORMESSAGE: String
  RECORD: String
  CAUSE: [String]
}
`;

describe('processing fields', () => {
  it('creates a type for the processing log', () => {
    const type = generateSchemaFromKsql({
      name: 'KSQL_PROCESSING_LOG',
      fields: processingLogFields,
    });
    const schema = printSchema(new GraphQLSchema({ query: type }));
    expect(schema).toEqual(schemaResult);
  });
});
