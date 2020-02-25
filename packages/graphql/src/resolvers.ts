import { connect, ClientHttp2Session } from 'http2';

import { FieldNode, GraphQLResolveInfo } from 'graphql';
import { asyncIteratorQueryStream } from '@ksqldb/client';

import { KSqlEntities, Resolver, SubscriptionResolver, KsqlGraphResolver } from './type/definition';

const createSession = (): ClientHttp2Session | void => {
  try {
    /*
     * in ksqldb server do:
     * ksql.new.api.enabled=true
     * ksql.apiserver.listen.port=8089
     */
    const ksqlServer = `http://localhost:8089`;
    const session = connect(ksqlServer);
    session.on('error', error => {
      // eslint-disable-next-line
      console.error(error);
    });
    return session;
  } catch (e) {
    // eslint-disable-next-line
    console.error(e.message);
  }
};
const session: ClientHttp2Session = createSession() as ClientHttp2Session;

const getNameFromResolveInfo = (info: GraphQLResolveInfo): string | null => {
  const node = info.fieldNodes[0];
  if (!node || !node.selectionSet) {
    return null;
  }

  return node.name.value;
};

export const generateStatement = (
  info: GraphQLResolveInfo,
  args: { [key: string]: string }
): string | null => {
  // TODO what about multiple field nodes?
  const node = info.fieldNodes[0];
  if (!node || !node.selectionSet) {
    return null;
  }

  const command = [];
  const selections: Array<FieldNode> = node.selectionSet.selections as Array<FieldNode>;
  const fields = selections
    // For debugging commands - remove eventually
    // __typename - TODO remove internal graphql stuff
    .filter(({ name }: FieldNode) => name.value !== 'command' && name.value !== '__typename')
    .map(({ name }: FieldNode) => {
      return name.value;
    });
  const name = getNameFromResolveInfo(info);
  command.push(`select ${fields.join(', ')} from ${name}`);

  // Add where clause
  const whereArguments = Object.keys(args);
  if (whereArguments.length > 0) {
    command.push(
      `where ${whereArguments
        .map(key => {
          return `${key}='${args[key]}'`;
        })
        .join(' and ')}`
    );
  }
  return `${command.join(' ')} emit changes;`;
};

export const handleResolve: KsqlGraphResolver = async (
  obj,
  args,
  context,
  info
): Promise<{ command: string } | null> => {
  const sql = generateStatement(info, args);

  if (!sql) {
    return null;
  }

  return {
    command: sql,
  };
};

export const createResolver = (resolvers: Resolver, key: string): Resolver => {
  resolvers[key] = handleResolve;
  return resolvers;
};
const createSubscriptionResolver: KsqlGraphResolver = async (
  obj,
  args,
  context,
  info
): Promise<any> => {
  const sql = generateStatement(info, args);
  if (!sql) {
    return Promise.resolve(new Error('Unable to generate ksql from graphql statement'));
  }
  const nameKey = getNameFromResolveInfo(info) as string;
  const stream = asyncIteratorQueryStream(session, { sql }, nameKey);
  return stream;
};

export function generateResolvers(
  fields: KSqlEntities
): { queryResolvers: Resolver; subscriptionResolvers: SubscriptionResolver } {
  const queries = Object.keys(fields);

  const queryResolvers = queries.reduce(createResolver, {});

  const subscriptionResolvers = queries.reduce((resolvers: SubscriptionResolver, key: string) => {
    resolvers[key] = {
      subscribe: createSubscriptionResolver,
    };
    return resolvers;
  }, {});

  return { queryResolvers, subscriptionResolvers };
}
