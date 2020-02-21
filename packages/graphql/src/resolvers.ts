import { FieldNode, GraphQLResolveInfo } from 'graphql';

import { KSqlEntities, Resolver, SubscriptionResolver } from './type/definition';

export const handleResolve = (
  obj: void,
  args: { [key: string]: string },
  context: void,
  info: GraphQLResolveInfo
): { command: string } | null => {
  // TODO what about multiple field nodes?
  const node = info.fieldNodes[0];
  if (!node || !node.selectionSet) {
    return null;
  }
  const command = [];

  // Generate the select statement
  const selections: Array<FieldNode> = node.selectionSet.selections as Array<FieldNode>;
  const fields = selections
    .filter(({ name }: FieldNode) => name.value !== 'command')
    .map(({ name }: FieldNode) => {
      return name.value;
    });
  command.push(`select ${fields.join(', ')} from ${node.name.value}`);

  // Add where clause
  const whereArguments = Object.keys(args);
  if (whereArguments.length > 0) {
    command.push(
      `where ${whereArguments
        .map(key => {
          return `${key}=${args[key]}`;
        })
        .join(' and ')}`
    );
  }

  return {
    command: `${command.join(' ')};`,
  };
};

export const createResolver = (resolvers: Resolver, key: string): Resolver => {
  resolvers[key] = handleResolve;
  return resolvers;
};

export function generateResolvers(
  fields: KSqlEntities,
  subscription: any
): { queryResolvers: Resolver; subscriptionResolvers: SubscriptionResolver } {
  const queries = Object.keys(fields);

  const queryResolvers = queries.reduce(createResolver, {});

  const subscriptionResolvers = queries.reduce((resolvers: SubscriptionResolver, key: string) => {
    resolvers[key] = {
      subscribe: (): Promise<void> => subscription.asyncIterator(`@ksqldb/${key}`),
    };
    return resolvers;
  }, {});

  return { queryResolvers, subscriptionResolvers };
}
