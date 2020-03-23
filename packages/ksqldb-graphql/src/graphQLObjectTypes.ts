import { GraphQLString, GraphQLObjectType, GraphQLScalarType } from 'graphql';

export const Missing = {
  name: 'Missing data',
  type: new GraphQLScalarType({
    name: 'NoPullQueries',
    description:
      'No materalized views have been registered. Register materialized views in order to use pull queries. Refer to https://cnfl.io/queries for info on query types.',
    serialize(): null {
      return null;
    },
    parseValue(): null {
      return null;
    },
    parseLiteral(): null {
      return null;
    },
  }),
};
export const KsqlDBMutation = new GraphQLObjectType({
  name: `KsqlDBMutation`,
  fields: {
    command: {
      type: GraphQLString,
    },
    statusCode: {
      type: GraphQLString,
    },
  },
});
