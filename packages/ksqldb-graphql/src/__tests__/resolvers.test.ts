import { GraphQLSchema, GraphQLResolveInfo, GraphQLString, GraphQLObjectType } from 'graphql';

import { ResolverGenerator, createInsertStatement } from '../resolvers';

jest.mock('http2', () => {
  return {
    connect: (): any => ({
      on: jest.fn(),
    }),
  };
});

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
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
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
    const fields = {
      one: { type: GraphQLString, args: { ';Drop TABLES;viewtime': { type: GraphQLString } } },
      two: { type: GraphQLString },
    };
    const info = testGraphQL();
    const resolver = new ResolverGenerator(fields);
    const resolvedValue = resolver.generateStatement(info, {});
    expect(resolvedValue).toEqual(
      'select %3BDrop%20TABLES%3Bviewtime from PAGEVIEWS_ORIGINAL emit changes;'
    );
  });

  it('filters out fields that ksql does not know about', () => {
    const fields = {
      one: {
        type: GraphQLString,
        args: { viewtime: { type: GraphQLString }, command: { type: GraphQLString } },
      },
      two: { type: GraphQLString },
    };
    const info = testGraphQL();
    const resolver = new ResolverGenerator(fields);
    const resolvedValue = resolver.generateStatement(info, {});
    expect(resolvedValue).toEqual(`select command from PAGEVIEWS_ORIGINAL emit changes;`);
  });

  it('throws an error if all fields have been filtered out', () => {
    const info = testGraphQL();
    const resolver = new ResolverGenerator({});
    expect(() => resolver.generateStatement(info, {})).toThrowError();
  });

  it('creates an insert statement', () => {
    const info = testGraphQL();
    const resolvedValue = createInsertStatement(info, {
      VIEWTIME: ';DROP TABLES',
      ROWKEY: 69,
    });
    expect(resolvedValue).toEqual(
      `INSERT INTO PAGEVIEWS_ORIGINAL (VIEWTIME, ROWKEY) VALUES ('%3BDROP%20TABLES', 69);`
    );
  });
  it('creates resolvers for queries and subscriptions', () => {
    const fields = { one: { type: GraphQLString }, two: { type: GraphQLString } };
    const resolver = new ResolverGenerator(fields);
    const { mutationResolvers, queryResolvers, subscriptionResolvers } = resolver;
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
