import { FieldNode, GraphQLResolveInfo } from 'graphql';
import { ddl, asyncIteratorQueryStream } from '@ksqldb/client';
import { runCommand } from './requester';

import {
  Resolver,
  SubscriptionResolver,
  ResolverFields,
  KsqlDBGraphResolver,
} from './type/definition';

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
  whitelistFields: Set<string> = new Set();

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

  constructor(protected fields: ResolverFields) {
    const { queryFields, subscriptionFields, mutationFields } = fields;
    const queries: Array<string> = Object.keys(queryFields);
    const mutations: Array<string> = Object.keys(mutationFields);
    const subscriptions: Array<string> = Object.keys(subscriptionFields);
    queries.concat(subscriptions, mutations).reduce((accum: Set<string>, key: any) => {
      let args;
      if (queryFields[key]) {
        args = queryFields[key].args;
      } else if (subscriptionFields[key]) {
        args = subscriptionFields[key].args;
      } else if (mutationFields[key]) {
        args = mutationFields[key].args;
      }

      if (args) {
        Object.keys(args).forEach((key) => {
          accum.add(key)
        })
      }
      return accum;
    }, this.whitelistFields);
    this.queryResolvers = queries.reduce(createResolver(this.handleQueryResolve), {});
    this.mutationResolvers = mutations.reduce(createResolver(this.handleMutationResolve), {});
    this.subscriptionResolvers = subscriptions.reduce(
      (resolvers: SubscriptionResolver, key: string) => {
        resolvers[key] = {
          subscribe: this.handleSubscriptionResolve,
        };
        return resolvers;
      },
      {}
    );
  }

  /*
   * Filter out any internal graphQL items that could break KSQL statement generation
   */
  getFields(selections: Array<FieldNode>): Array<string> {
    const fields = selections
      // __typename is part of these selections. enforce only using ksql fields as a response
      .filter(({ name }: FieldNode) => this.whitelistFields.has(name.value))
      .map(({ name }: FieldNode) => {
        return escape(name.value);
      });
    if (fields.length === 0) {
      throw new Error('No ksqlDB fields available.');
    }
    return fields;
  }

  /*
   *Creates a generic kaql statement based for graphql.
   */
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
    return `${command.join(' ')}`;
  };

  /*
   * To generate pull queries, the underlying ksqlDB stream/table must be materialized
   * There are a bunch of extra parameters that need to be decorated into the schema
   * https://docs.ksqldb.io/en/latest/concepts/queries/pull/#pull-query-features-and-limitations
   * a generic form of these does not really exist (eg taking the latest of every field) - https://github.com/confluentinc/ksql/issues/3985
   */
  handleQueryResolve: KsqlDBGraphResolver = async (obj, args, { ksqlDB }, info): Promise<any> => {
    const sql = `${this.generateStatement(info, args)};`;
    if (!sql) {
      return null;
    }
    const stream = asyncIteratorQueryStream(ksqlDB.session, { sql }, 'query');
    for await (const row of stream) {
      // both of these are possible, seems like a bug in @ksqldb/client
      // { query: { COUNT: { value: [Array], done: true } } }
      // { query: { COUNT: 1 } }
      const { query } = row;
      return Object.keys(query).reduce((accum: any, qry) => {
        if (query[qry].done) {
          const { value } = query[qry];
          try {
            const parsedVal = JSON.parse(value[0]);
            accum[qry] = parsedVal[0]; // maybe?
          } catch (e) {
            // eslint-disable-next-line
            console.error(e);
          }
        } else {
          accum[qry] = query[qry];
        }
        return accum;
      }, {});
    }
  };

  /*
   * Modifies the generic ksql statement and converts it into a push query
   */
  handleSubscriptionResolve: KsqlDBGraphResolver = async (obj, args, { ksqlDB }, info) => {
    const sql = `${this.generateStatement(info, args)} emit changes;`;

    if (!sql) {
      return Promise.resolve(new Error('Unable to generate ksqlDB from graphql statement.'));
    }
    const nameKey = getNameFromResolveInfo(info) as string;
    const stream = asyncIteratorQueryStream(ksqlDB.session, { sql }, nameKey);
    return stream;
  };

  /*
   * Creates insert statements to add new messages
   */
  handleMutationResolve: KsqlDBGraphResolver = async (obj, args, { ksqlDB }, info) => {
    const { options, session } = ksqlDB;
    const command = createInsertStatement(info, args);
    try {
      if (!command) {
        throw new Error('Unable to create insert statement from graphql args');
      }
      const response = await ddl(session, { ksql: command });
      if (response && response.error) {
        // eslint-disable-next-line
        console.warn('new api unavailable, falling back to default REST.')
        const response = await runCommand(command, options);
        return { command, statusCode: response.statusCode };
      }
      return { command, statusCode: response && response.statusCode };
    } catch (e) {
      if (e.response) {
        throw new Error(e.response.data.message);
      }
      throw new Error(e);
    }
  };
}
