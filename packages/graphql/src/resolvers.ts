type Resolver = any;
type Name = { value: string; kind: 'Name'; loc: any };

export const handleResolve = (obj: any, args: any, context: any, info: any) => {
  // TODO what about multiple field nodes?
  const node = info.fieldNodes[0];

  const fields = node.selectionSet.selections
    .filter(({ name }: { name: Name }) => name.value !== 'command')
    .map(({ name }: { name: Name }) => {
      return name.value;
    });
  const command = `select ${fields.join(', ')} from ${node.name.value};`;
  return {
    command,
  };
};

export const createResolver = (resolvers: any, key: string) => {
  resolvers[key] = handleResolve;
  return resolvers;
};

export function generateResolvers(fields: any, subscription: any): { [name: string]: Resolver } {
  const queries = Object.keys(fields);

  const queryResolvers = queries.reduce(createResolver, {});

  const subscriptionResolvers = queries.reduce(
    (resolvers: { [name: string]: { subscribe: any } }, key: string) => {
      resolvers[key] = {
        subscribe: () => subscription.asyncIterator(`@ksqldb/${key}`),
      };
      return resolvers;
    },
    {}
  );

  return { queryResolvers, subscriptionResolvers };
}
