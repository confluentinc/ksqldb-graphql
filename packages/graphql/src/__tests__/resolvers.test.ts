import { GraphQLSchema, GraphQLResolveInfo, GraphQLString, GraphQLObjectType } from 'graphql';

import { generateResolvers, generateStatement, createInsertStatement } from '../resolvers';

const testGraphQL = () => {
  const objType = new GraphQLObjectType({
    name: 'PAGEVIEWS_ORIGINAL',
    fields: { one: { type: GraphQLString } },
  });
  const schema = new GraphQLSchema({ query: objType });
  const selectionSet = {
    kind: 'SelectionSet',
    selections: [
      { kind: 'FragmentSpread', name: { value: 'command', kind: 'Name' } },
      { kind: 'FragmentSpread', name: { value: ';Drop TABLES;viewtime', kind: 'Name' } },
    ],
  };
  const info: GraphQLResolveInfo = {
    fieldName: 'spongebob',
    fieldNodes: [
      {
        kind: 'Field',
        name: { value: 'PAGEVIEWS_ORIGINAL', kind: 'Name' },
        selectionSet,
      },
    ],
    returnType: objType,
    parentType: objType,
    path: {
      prev: undefined,
      key: 'PAGEVIEWS_ORIGINAL',
    },
    schema: schema,
    fragments: {},
    rootValue: undefined,
    operation: {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getPageviews' },
      selectionSet,
    },
    variableValues: {},
  } as GraphQLResolveInfo;
  return info;
};

describe('resolvers', () => {
  it('takes graphql and maps a command', () => {
    const info = testGraphQL();
    const resolvedValue = generateStatement(info, {});
    expect(resolvedValue).toEqual(
      'select %3BDrop%20TABLES%3Bviewtime from PAGEVIEWS_ORIGINAL emit changes;'
    );
  });
  it('creates an insert statement', () => {
    const info = testGraphQL();
    const resolvedValue = createInsertStatement(info, { VIEWTIME: ';DROP TABLES', ROWKEY: 69 });
    expect(resolvedValue).toEqual(
      `INSERT INTO PAGEVIEWS_ORIGINAL (VIEWTIME, ROWKEY) VALUES ('%3BDROP%20TABLES', 69);`
    );
  });
  it('creates resolvers for queries and subscriptions', () => {
    const fields = { one: { type: GraphQLString }, two: { type: GraphQLString } };
    const resolvers = generateResolvers(fields);
    expect(Object.keys(resolvers).length).toEqual(3);
    const { mutationResolvers, queryResolvers, subscriptionResolvers } = resolvers;
    expect(mutationResolvers).toEqual({
      one: expect.any(Function),
      two: expect.any(Function),
    });
    expect(queryResolvers).toEqual({
      one: expect.any(Function),
      two: expect.any(Function),
    });
    expect(subscriptionResolvers).toEqual({
      one: { subscribe: expect.any(Function) },
      two: { subscribe: expect.any(Function) },
    });
  });
});
