export const carsPayload = [
  {
    name: 'CARS',
    windowType: null,
    readQueries: [
      {
        queryString:
          "CREATE TABLE CARS_COUNT WITH (KAFKA_TOPIC='CARS_COUNT', PARTITIONS=1, REPLICAS=1) AS SELECT COUNT(*) COUNT\nFROM CARS CARS\nGROUP BY CARS.ROWKEY\nEMIT CHANGES;",
        sinks: ['CARS_COUNT'],
        sinkKafkaTopics: ['CARS_COUNT'],
        id: 'CTAS_CARS_COUNT_0',
        state: 'RUNNING',
      },
    ],
    writeQueries: [],
    fields: [
      { name: 'ROWTIME', schema: { type: 'BIGINT', fields: null, memberSchema: null } },
      { name: 'ROWKEY', schema: { type: 'STRING', fields: null, memberSchema: null } },
      { name: 'ID', schema: { type: 'STRING', fields: null, memberSchema: null } },
      { name: 'LAT', schema: { type: 'DOUBLE', fields: null, memberSchema: null } },
      { name: 'LONG', schema: { type: 'DOUBLE', fields: null, memberSchema: null } },
    ],
    type: 'TABLE',
    key: 'ID',
    timestamp: '',
    statistics: '',
    errorStats: '',
    extended: true,
    keyFormat: 'KAFKA',
    valueFormat: 'JSON',
    topic: 'cars',
    partitions: 1,
    replication: 1,
    statement:
      "create table cars (id VARCHAR, lat DOUBLE, long DOUBLE) with (KAFKA_TOPIC='cars', VALUE_FORMAT='JSON', key='id', partitions=1, replicas=1);",
  },
  {
    name: 'CARS_COUNT',
    windowType: null,
    readQueries: [],
    writeQueries: [
      {
        queryString:
          "CREATE TABLE CARS_COUNT WITH (KAFKA_TOPIC='CARS_COUNT', PARTITIONS=1, REPLICAS=1) AS SELECT COUNT(*) COUNT\nFROM CARS CARS\nGROUP BY CARS.ROWKEY\nEMIT CHANGES;",
        sinks: ['CARS_COUNT'],
        sinkKafkaTopics: ['CARS_COUNT'],
        id: 'CTAS_CARS_COUNT_0',
        state: 'RUNNING',
      },
    ],
    fields: [
      { name: 'ROWTIME', schema: { type: 'BIGINT', fields: null, memberSchema: null } },
      { name: 'ROWKEY', schema: { type: 'STRING', fields: null, memberSchema: null } },
      { name: 'COUNT', schema: { type: 'BIGINT', fields: null, memberSchema: null } },
    ],
    type: 'TABLE',
    key: '',
    timestamp: '',
    statistics: '',
    errorStats: '',
    extended: true,
    keyFormat: 'KAFKA',
    valueFormat: 'JSON',
    topic: 'CARS_COUNT',
    partitions: 1,
    replication: 1,
    statement:
      "CREATE TABLE CARS_COUNT WITH (KAFKA_TOPIC='CARS_COUNT', PARTITIONS=1, REPLICAS=1) AS SELECT COUNT(*) COUNT\nFROM CARS CARS\nGROUP BY CARS.ROWKEY\nEMIT CHANGES;",
  },
];

export const carSchemaResult = `type CARS {
  ROWTIME: Float
  ROWKEY: String
  ID: String
  LAT: Float
  LONG: Float
  command: String
}

type CARS_COUNT {
  ROWTIME: Float
  ROWKEY: String
  COUNT: Float
  command: String
}

type KsqlDBMutation {
  command: String
  status: Int
}

type Mutation {
  CARS(ROWTIME: Float, ROWKEY: String, ID: String, LAT: Float, LONG: Float, command: String): KsqlDBMutation
  CARS_COUNT(ROWTIME: Float, ROWKEY: String, COUNT: Float, command: String): KsqlDBMutation
}

type Query {
  CARS_COUNT(ROWTIME: Float, ROWKEY: String, COUNT: Float, command: String): CARS_COUNT
}

type Subscription {
  CARS(ROWTIME: Float, ROWKEY: String, ID: String, LAT: Float, LONG: Float, command: String): CARS
  CARS_COUNT(ROWTIME: Float, ROWKEY: String, COUNT: Float, command: String): CARS_COUNT
}
`;
