import {
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  printSchema,
} from 'graphql';
import axios from 'axios';

import { generateResolvers } from './resolvers';

export interface Config {
  ksqlUrl: string;
  subscription: any;
}

type KsqlType = 'BIGINT' | 'STRING' | 'INTEGER' | 'ARRAY' | 'VARCHAR' | 'STRUCT';
type MemberSchema = {
  type: Exclude<'ARRAY' | 'STRUCT', KsqlType>; // TODO - can you have arrays in member schemas?
};
export interface Field {
  name: string;
  schema: {
    type: KsqlType;
    fields: Array<Field> | null;
    memberSchema: MemberSchema | null;
  };
}
type KSqlEntities = {
  [key: string]: {
    type: GraphQLObjectType;
  };
};
type KsqlResponse = {
  name: string;
  readQueries: Array<any>; // TODO
  writeQueries: Array<any>; // TOOD
  fields: Array<Field>;
  type: 'STREAM' | 'TABLE';
  key: string;
  timestamp: string;
  statistics: string;
  errorStats: string;
  extended: boolean;
  format: 'JSON' | 'AVRO'; // TODO verify this value
  topic: string;
  partitions: number;
  replication: number;
};

const TypeMap = {
  STRING: GraphQLString,
  VARCHAR: GraphQLString,
  BIGINT: GraphQLInt,
  INTEGER: GraphQLInt,
  ARRAY: {
    STRING: new GraphQLList(GraphQLString),
    VARCHAR: new GraphQLList(GraphQLString),
    BIGINT: new GraphQLList(GraphQLInt),
    INTEGER: new GraphQLList(GraphQLInt),
  },
  STRUCT: {}, // MemberSchema exclude not excluding this?
};

const setSchemaType = (accum: any, field: Field): void => {
  if (TypeMap[field.schema.type] == null) {
    // eslint-disable-next-line
    console.error(`type ${field.schema.type} is not supported`);
    accum[field.name] = { type: GraphQLString };
    return;
  }

  if (field.schema.memberSchema?.type != null) {
    accum[field.name] = {
      type: TypeMap[field.schema.type][field.schema.memberSchema.type],
    };
  } else {
    accum[field.name] = { type: TypeMap[field.schema.type] };
  }
};

const buildSchemaObject = (accum: KSqlEntities, field: Field): KSqlEntities => {
  if (field.schema.fields == null) {
    setSchemaType(accum, field);
  } else if (Array.isArray(field.schema.fields)) {
    const fields = field.schema.fields.reduce(buildSchemaObject, {});
    if (accum[field.name] == null) {
      accum[field.name] = { type: new GraphQLObjectType({ name: field.name, fields: fields }) };
    } else {
      // eslint-disable-next-line
      console.warn(`${field.name} already exists.`);
    }
  }
  return accum;
};

export const generateSchemaFromKsql = ({ name, fields }: KsqlResponse): GraphQLObjectType => {
  const schemaFields = fields.reduce(buildSchemaObject, {});
  return new GraphQLObjectType({
    name,
    fields: {
      ...schemaFields,
      command: {
        type: GraphQLString,
      },
    },
  });
};

const schemas = async (
  ksqlUrl: string
): Promise<{ schema: GraphQLSchema; fields: KSqlEntities } | undefined> => {
  const endpoint = `${ksqlUrl}/ksql`;
  try {
    const response = await axios.post(endpoint, {
      ksql: 'show streams extended;',
    });

    if (response.status !== 200) {
      // eslint-disable-next-line
      console.error(`request to ksql failed`, ksqlUrl, response);
      return;
    }
    const schemas: GraphQLObjectType[] = [];
    const streams: Array<KsqlResponse> = response.data[0].sourceDescriptions;

    for (const stream of streams) {
      schemas.push(generateSchemaFromKsql(stream));
    }

    const queryFields = schemas.reduce(
      (accum: { [name: string]: { type: GraphQLObjectType } }, query: GraphQLObjectType) => {
        accum[query.name] = { type: query };
        return accum;
      },
      {}
    );

    const queryType = new GraphQLObjectType({ name: 'Query', fields: queryFields });
    const subscriptionType = new GraphQLObjectType({ name: 'Subscription', fields: queryFields });
    const gqlSchema = new GraphQLSchema({ query: queryType, subscription: subscriptionType });

    // eslint-disable-next-line
    console.log(printSchema(gqlSchema));
    return { schema: gqlSchema, fields: queryFields };
  } catch (e) {
    // eslint-disable-next-line
    console.error(`unable to connect to ksql`, ksqlUrl);
  }
};

export function getKsqlSchemas({
  ksqlUrl,
  subscription,
}: Config): Promise<{ schemas: any; queryResolvers: any; subscriptionResolvers: any }> {
  return new Promise(resolve => {
    (async function run(): Promise<void> {
      const result = await schemas(ksqlUrl);
      if (result) {
        const { queryResolvers, subscriptionResolvers } = generateResolvers(
          result.fields,
          subscription
        );
        resolve({ schemas: result.schema, queryResolvers, subscriptionResolvers });
      } else {
        throw new Error('Unable to create schemas and resolvers');
      }
    })();
  });
}
