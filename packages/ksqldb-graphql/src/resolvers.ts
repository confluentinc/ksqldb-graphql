import { connect, ClientHttp2Session } from 'http2';

import { FieldNode, GraphQLResolveInfo, GraphQLFieldConfigMap } from 'graphql';
import { asyncIteratorQueryStream } from '@ksqldb/client';

import { Resolver, SubscriptionResolver, KsqlDBGraphResolver } from './type/definition';

/*
 * Creates an http2 session
 * this is used in conjunction with klip-15 to talk to the ksqlDB api
 */
const createSession = (): ClientHttp2Session | void => {
  try {
    /*
     * in ksqlDB server do:
     * ksql.new.api.enabled=true
     * ksql.apiserver.listen.port=8089
     */
    const ksqlDBServer = `http://localhost:8089`;
    const session = connect(ksqlDBServer);
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

/*
 * Example graphQL:
 * query listCars {
 *   CARS {
 *     LAT
 *     LONG
 *     command
 *   }
 * }
 * parses out the `CARS` key. Based on the generation, that is the `from` table
 */
const getNameFromResolveInfo = (info: GraphQLResolveInfo): string | null => {
  // TODO support multiple field nodes
  const node = info.fieldNodes[0];
  if (!node || !node.selectionSet) {
    return null;
  }

  return escape(node.name.value);
};

const createResolver = (resolver: KsqlDBGraphResolver) => (
  resolvers: Resolver,
  key: string
): Resolver => {
  resolvers[key] = resolver;
  return resolvers;
};

export const createInsertStatement = (
  info: GraphQLResolveInfo,
  args: { [key: string]: string | number }
): string | null => {
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
};

export class ResolverGenerator {
  /*
   * A list of fields available in ksqlDB
   * Used to filter out an internal graphql stuff that could affect query generation
   */
  whitelistFields: string[] = [];

  /*
   * A map of resolvers for the `Query` in graphql
   * in ksqlDB, this is a materialized view https://docs.ksqldb.io/en/latest/concepts/materialized-views/
   * it is also https://docs.ksqldb.io/en/latest/concepts/queries/pull/
   * Right now, these are not supported
   */
  queryResolvers = {};

  /*
   * A map of resolvers for the `Mutation` in graphql
   * in ksqlDB, this would be an INSERT INTO https://docs.ksqldb.io/en/latest/concepts/collections/inserting-events/
   */
  mutationResolvers = {};

  /*
   * A map of resolvers for the `Subscription` in graphql
   * in ksqlDB, this is a push query https://docs.ksqldb.io/en/latest/concepts/queries/push/
   * based on https://www.apollographql.com/docs/graphql-subscriptions/subscriptions-to-schema/
   * it should be a map of a single `subscribe` key with a function to resolve
   */
  subscriptionResolvers = {};

  constructor(protected fields: GraphQLFieldConfigMap<any, any, any>) {
    const queries = Object.keys(fields);
    this.whitelistFields = queries.reduce((accum: string[], key) => {
      const { args } = fields[key];
      if (args) {
        return accum.concat(Object.keys(args));
      }
      return accum;
    }, []);
    this.queryResolvers = queries.reduce(createResolver(this.handleQueryResolve), {});
    this.mutationResolvers = queries.reduce(createResolver(this.handleMutationResolve), {});
    this.subscriptionResolvers = queries.reduce((resolvers: SubscriptionResolver, key: string) => {
      resolvers[key] = {
        subscribe: this.handleSubscriptionResolve,
      };
      return resolvers;
    }, {});
  }

  getFields(selections: Array<FieldNode>): Array<string> {
    const fields = selections
      // __typename is part of these selections. enforce only using ksql fields as a response
      .filter(({ name }: FieldNode) => this.whitelistFields.includes(name.value))
      .map(({ name }: FieldNode) => {
        return escape(name.value);
      });
    if (fields.length === 0) {
      throw new Error('No ksqlDB fields available.');
    }
    return fields;
  }

  generateStatement = (
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
    const fields = this.getFields(selections);
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
   * To generate pull queries, the underlying ksqlDB stream/table must be materialized
   * There are a bunch of extra parameters that need to be decorated into the schema
   * https://docs.ksqldb.io/en/latest/concepts/queries/pull/#pull-query-features-and-limitations
   * a generic form of these does not really exist (eg taking the latest of every field) - https://github.com/confluentinc/ksql/issues/3985
   * a valid query would be `select LAT, LONG from CARS where ROWKEY='Car1';`, but https://github.com/confluentinc/ksql/issues/4698
   */
  handleQueryResolve: KsqlDBGraphResolver = async (
    obj,
    args,
    context,
    info
  ): Promise<{ command: string } | null> => {
    const sql = this.generateStatement(info, args)?.replace(' emit changes', '');
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

  handleSubscriptionResolve: KsqlDBGraphResolver = async (obj, args, context, info) => {
    const sql = this.generateStatement(info, args);

    if (!sql) {
      return Promise.resolve(new Error('Unable to generate ksqlDB from graphql statement.'));
    }
    const nameKey = getNameFromResolveInfo(info) as string;
    const stream = asyncIteratorQueryStream(session, { sql }, nameKey);
    return stream;
  };

  handleMutationResolve: KsqlDBGraphResolver = async (obj, args, context, info) => {
    const { requester } = context;
    const command = createInsertStatement(info, args);
    try {
      const response = await requester.post('ksql', { ksql: command });
      return { command, status: response.status };
    } catch (e) {
      throw new Error(e.response.data.message);
    }
  };
}
