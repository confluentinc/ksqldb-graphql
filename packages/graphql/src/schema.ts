import {
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  printSchema,
} from 'graphql';

const axios = require('axios');

type KsqlType = 'BIGINT' | 'STRING' | 'INTEGER' | 'ARRAY' | 'VARCHAR';
type Field = {
  name: string;
  schema: {
    type: KsqlType;
    fields: Array<Field>;
    memberSchema: {
      type: Exclude<'ARRAY', KsqlType>; // TODO - can you have arrays in member schemas?
    };
  };
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
};

const setSchemaType = (accum: any, field: Field) => {
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

const buildSchemaObject = (accum: any, field: Field) => {
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

export const generateSchemaFromKsql = ({ name, fields }: { name: string; fields: Array<any> }) => {
  return new GraphQLObjectType({ name, fields: fields.reduce(buildSchemaObject, {}) });
};

const schemas = async (ksqlUrl: string, config?: any) => {
  const endpoint = `${ksqlUrl}/ksql`;
  try {
    const response = await axios.post(endpoint, {
      ksql: 'show streams extended;',
    });

    if (response.status !== 200) {
      // eslint-disable-next-line
      console.error(`request to ksql failed`, config.url, config.data);
      return;
    }
    const schemas: GraphQLObjectType[] = [];
    const streams = response.data[0].sourceDescriptions;

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
    const gqlSchema = new GraphQLSchema({ query: queryType });

    // eslint-disable-next-line
    console.log(printSchema(gqlSchema));
    return new GraphQLSchema({ query: queryType });
  } catch (e) {
    // eslint-disable-next-line
    console.error(`unable to connect to ksql`, ksqlUrl);
  }
};
export function getKsqlSchemas(ksqlUrl: string, config?: any): Promise<any> {
  return new Promise(resolve => {
    (async function run() {
      const output = await schemas(ksqlUrl, config);
      resolve(output);
    })();
  });
}
