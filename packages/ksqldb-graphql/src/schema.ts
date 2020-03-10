import {
  GraphQLSchema,
  GraphQLString,
  GraphQLFloat,
  GraphQLList,
  GraphQLObjectType,
  printSchema,
  isInputType,
  GraphQLScalarType,
  GraphQLObjectTypeConfig,
} from 'graphql';

import { ResolverGenerator } from './resolvers';
import { Config, Field, KsqlDBResponse, KSqlDBEntities, ResolverFields } from './type/definition';
import { Missing, KsqlDBMutation } from './graphQLObjectTypes';

const TypeMap = {
  STRING: GraphQLString,
  VARCHAR: GraphQLString,
  BIGINT: GraphQLFloat, // the BIGINT that is given back is larger than graphql supports, so it has to be a float
  DOUBLE: GraphQLFloat,
  INTEGER: GraphQLFloat,
  ARRAY: {
    STRING: new GraphQLList(GraphQLString),
    VARCHAR: new GraphQLList(GraphQLString),
    BIGINT: new GraphQLList(GraphQLFloat),
    INTEGER: new GraphQLList(GraphQLFloat),
    DOUBLE: new GraphQLList(GraphQLFloat),
  },
  STRUCT: {}, // MemberSchema exclude not excluding this?
};

const setSchemaType = (accum: KSqlDBEntities, field: Field): void => {
  if (TypeMap[field.schema.type] == null) {
    // eslint-disable-next-line
    console.error(`type ${field.schema.type} is not supported`);
    return;
  }

  if (field.schema.memberSchema?.type != null) {
    const sclarType: GraphQLScalarType = TypeMap[field.schema.type][
      field.schema.memberSchema.type
    ] as GraphQLScalarType;
    accum[field.name] = {
      type: sclarType,
    };
  } else {
    const sclarType: GraphQLScalarType = TypeMap[field.schema.type] as GraphQLScalarType;
    accum[field.name] = {
      type: sclarType,
    };
  }
};

const buildSchemaObject = (accum: KSqlDBEntities, field: Field): KSqlDBEntities => {
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

export const generateSchemaFromKsql = ({
  name,
  fields,
}: KsqlDBResponse): GraphQLObjectTypeConfig<void, void> => {
  const schemaFields = fields.reduce(buildSchemaObject, {});
  return {
    name,
    fields: schemaFields,
  };
};

// TODO support nested objects for resolving
const generateGraqphQLArgs = (fields: any): any =>
  Object.keys(fields).reduce((accum: any, filter: any) => {
    if (isInputType(fields[filter].type)) {
      accum[filter] = fields[filter];
    }
    return accum;
  }, {});

function generateQueries(streams: Array<KsqlDBResponse>, subscriptionFields: any) {
  return (accum: { [name: string]: any }, query: any): any => {
    const schemaType = new GraphQLObjectType(query);
    const ksqlDBQuery = streams.find(stream => stream.name === query.name);
    // if a ksqlDB query is writing something, it's materialized, so it qualifies as a query
    if (ksqlDBQuery != null && ksqlDBQuery.writeQueries.length > 0) {
      const args = generateGraqphQLArgs(query.fields);
      if (subscriptionFields[query.name] != null) {
        accum[query.name] = subscriptionFields[query.name];
      } else {
        accum[query.name] = {
          type: schemaType,
          args,
        };
      }
    }
    return accum;
  };
}

// anything can be a subscription
function generateSubscription(accum: { [name: string]: any }, query: any): any {
  const schemaType = new GraphQLObjectType(query);
  const args = generateGraqphQLArgs(query.fields);
  accum[query.name] = {
    type: schemaType,
    args,
  };
  return accum;
}

function generateMutations(accum: { [name: string]: any }, query: any): any {
  const args = generateGraqphQLArgs(query.fields);
  accum[query.name] = {
    type: KsqlDBMutation,
    args,
  };
  return accum;
}
export const generateSchemaAndFields = (
  streams: Array<KsqlDBResponse>
): {
  schema: GraphQLSchema;
  fields: ResolverFields;
} => {
  const schemas: GraphQLObjectTypeConfig<void, void>[] = [];
  for (const stream of streams) {
    schemas.push(generateSchemaFromKsql(stream));
  }

  const subscriptionFields = schemas.reduce(generateSubscription, {});
  const mutationFields = schemas.reduce(generateMutations, {});

  let queryFields = schemas.reduce(generateQueries(streams, subscriptionFields), {});
  // if you have no materialized views, graphql won't work, so default to subscriptions, already logged out this won't work
  // why default? http://spec.graphql.org/June2018/#sec-Schema
  if (Object.keys(queryFields).length === 0) {
    // eslint-disable-next-line
    console.error(
      'No materalized views have been registered.',
      'Only subscriptions and mutations will be work properly.',
      'Defaulting `type Query` to null scalar since it is required by graphQL.'
    );
    queryFields = { KsqlDBGraphQLError: Missing };
  }

  return {
    schema: new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: queryFields,
      }),
      subscription: new GraphQLObjectType({
        name: 'Subscription',
        fields: subscriptionFields,
      }),

      mutation: new GraphQLObjectType({ name: 'Mutation', fields: mutationFields }),
    }),
    fields: {
      queryFields: Object.keys(queryFields)
        .filter(key => {
          return queryFields[key] !== Missing;
        })
        .reduce((accum: any, key: string) => {
          accum[key] = queryFields[key];
          return accum;
        }, {}),
      subscriptionFields,
      mutationFields,
    },
  };
};

const schemas = async (
  requester: any
): Promise<{ schema: GraphQLSchema; fields: ResolverFields } | undefined> => {
  try {
    const response = await requester.post(
      'ksql',
      {
        ksql: 'show streams extended; show tables extended;',
      },
      { timeout: 1000 }
    );

    if (response.status !== 200) {
      // eslint-disable-next-line
      console.error(`request to ksql failed`, response);
      return;
    }
    const streams: Array<KsqlDBResponse> = response.data[0].sourceDescriptions;
    const tables: Array<KsqlDBResponse> = response.data[1].sourceDescriptions;

    if (streams.length === 0) {
      throw new Error(`No ksql tables exist on ksql server ${requester.defaults.baseURL}`);
    }

    return generateSchemaAndFields(streams.concat(tables));
  } catch (e) {
    // eslint-disable-next-line
    console.error(`Could not generate schemas:`, e.message);
  }
};

export function buildKsqlDBGraphQL({
  requester,
}: Config): Promise<{
  schemas: any;
  queryResolvers: any;
  subscriptionResolvers: any;
  mutationResolvers: any;
}> {
  return new Promise(resolve => {
    (async function run(): Promise<void> {
      try {
        const result = await schemas(requester);
        if (result) {
          // eslint-disable-next-line
          console.log(printSchema(result.schema));
          const {
            queryResolvers,
            subscriptionResolvers,
            mutationResolvers,
          } = new ResolverGenerator(result.fields);
          resolve({
            schemas: result.schema,
            queryResolvers,
            subscriptionResolvers,
            mutationResolvers,
          });
        } else {
          throw new Error('Unable to create schemas and resolvers');
        }
      } catch (e) {
        throw new Error(e);
        // noop
      }
    })();
  });
}
