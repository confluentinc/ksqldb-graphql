export const processingLogPayload = [
  {
    name: 'KSQL_PROCESSING_LOG',
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
    fields: [
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
    ],
  },
];
export const processingLogResult = `type DESERIALIZATIONERROR {
  ERRORMESSAGE: String
  RECORDB64: String
  CAUSE: [String]
}

type KSQL_PROCESSING_LOG {
  ROWTIME: Float
  ROWKEY: String
  LOGGER: String
  LEVEL: String
  TIME: Float
  MESSAGE: MESSAGE
  command: String
}

type KsqlDBMutation {
  command: String
  status: Int
}

type MESSAGE {
  TYPE: Float
  DESERIALIZATIONERROR: DESERIALIZATIONERROR
  RECORDPROCESSINGERROR: RECORDPROCESSINGERROR
  PRODUCTIONERROR: PRODUCTIONERROR
}

type Mutation {
  KSQL_PROCESSING_LOG(ROWTIME: Float, ROWKEY: String, LOGGER: String, LEVEL: String, TIME: Float, command: String): KsqlDBMutation
}

type PRODUCTIONERROR {
  ERRORMESSAGE: String
}

type Query

type RECORDPROCESSINGERROR {
  ERRORMESSAGE: String
  RECORD: String
  CAUSE: [String]
}

type Subscription {
  KSQL_PROCESSING_LOG(ROWTIME: Float, ROWKEY: String, LOGGER: String, LEVEL: String, TIME: Float, command: String): KSQL_PROCESSING_LOG
}
`;
