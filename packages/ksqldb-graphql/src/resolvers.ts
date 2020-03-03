import { connect, ClientHttp2Session } from 'http2';

import { FieldNode, GraphQLResolveInfo } from 'graphql';
import { asyncIteratorQueryStream } from '@ksqldb/client';

import {
  KSqlDBEntities,
  Resolver,
  SubscriptionResolver,
  KsqlDBGraphResolver,
} from './type/definition';

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

  return escape(node.name.value);
};

function getFields(selections: Array<FieldNode>): Array<string> {
  const fields = selections
    // For debugging commands - remove eventually
    // __typename - TODO remove internal graphql stuff
    .filter(({ name }: FieldNode) => name.value !== 'command' && name.value !== '__typename')
    .map(({ name }: FieldNode) => {
      return escape(name.value);
    });
  return fields;
}

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
  const fields = getFields(selections);
  const name = getNameFromResolveInfo(info);
  command.push(`select ${fields.join(', ')} from ${name}`);

  // Add where clause
  const whereArguments = Object.keys(args);
  if (whereArguments.length > 0) {
    command.push(
      `where ${whereArguments
        .map(key => {
          return `${key}='${escape(args[key])}'`;
        })
        .join(' and ')}`
    );
  }
  return `${command.join(' ')} emit changes;`;
};

/*
 *  a generic form of these does not really exist (eg taking the latest of every field)
 */
export const handleQueryResolve: KsqlDBGraphResolver = async (
  obj,
  args,
  context,
  info
): Promise<{ command: string } | null> => {
  const sql = generateStatement(info, args)?.replace(' emit changes', '');
  const { requester } = context;
  // TODO handle the values that come back from this request
  await requester.post('ksql', { sql });

  if (!sql) {
    return null;
  }

  return {
    command: sql,
  };
};

export const createResolver = (resolver: KsqlDBGraphResolver) => (
  resolvers: Resolver,
  key: string
): Resolver => {
  resolvers[key] = resolver;
  return resolvers;
};

const handleSubscriptionResolve: KsqlDBGraphResolver = async (obj, args, context, info) => {
  const sql = generateStatement(info, args);

  if (!sql) {
    return Promise.resolve(new Error('Unable to generate ksql from graphql statement.'));
  }
  const nameKey = getNameFromResolveInfo(info) as string;
  const stream = asyncIteratorQueryStream(session, { sql }, nameKey);
  return stream;
};

export function createInsertStatement(
  info: GraphQLResolveInfo,
  args: { [key: string]: string | number }
): string | null {
  // TODO what about multiple field nodes?
  const node = info.fieldNodes[0];
  if (!node || !node.selectionSet) {
    return null;
  }

  const name = getNameFromResolveInfo(info);
  const keys = Object.keys(args).map(key => escape(key));
  // this seems bad, but maybe it's ok
  const values = Object.values(args).map(val =>
    typeof val === 'string' ? `'${escape(val)}'` : val
  );
  const command = `INSERT INTO ${name} (${keys.join(', ')}) VALUES (${values.join(', ')});`;
  return command;
}

const handleMutationResolve: KsqlDBGraphResolver = async (obj, args, context, info) => {
  const { requester } = context;
  const command = createInsertStatement(info, args);
  try {
    const response = await requester.post('ksql', { ksql: command });
    return { command, status: response.status };
  } catch (e) {
    throw new Error(e.response.data.message);
  }
};

export function generateResolvers(
  fields: KSqlDBEntities
): {
  queryResolvers: Resolver;
  subscriptionResolvers: SubscriptionResolver;
  mutationResolvers: Resolver;
} {
  const queries = Object.keys(fields);

  const queryResolvers = queries.reduce(createResolver(handleQueryResolve), {});
  const mutationResolvers = queries.reduce(createResolver(handleMutationResolve), {});

  const subscriptionResolvers = queries.reduce((resolvers: SubscriptionResolver, key: string) => {
    resolvers[key] = {
      subscribe: handleSubscriptionResolve,
    };
    return resolvers;
  }, {});

  return { queryResolvers, subscriptionResolvers, mutationResolvers };
}
