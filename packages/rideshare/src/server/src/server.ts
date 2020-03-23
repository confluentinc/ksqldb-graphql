import { connect, ClientHttp2Session } from 'http2';

import { ApolloServer } from 'apollo-server';
import { generateGraphQL } from '@confluentinc/ksqldb-graphql';
import { addResolveFunctionsToSchema } from 'graphql-tools';

import { ksqlDBOpts as options } from './index';

/*
 * Creates an http2 session
 * this is used in conjunction with klip-15 to talk to the ksqlDB api
 */
const createSession = (): ClientHttp2Session | void => {
  try {
    const ksqlDBServer = `http://${options.hostname}:${options.port}`;
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

generateGraphQL({
  options
}).then(
  ({ schemas, queryResolvers, subscriptionResolvers, mutationResolvers }) => {
    const server = new ApolloServer({
      context: async (): Promise<any> => ({
        ksqlDB: {
          options,
          session,
        },
      }),
      schema: addResolveFunctionsToSchema({
        schema: schemas,
        resolvers: {
          Subscription: subscriptionResolvers,
          Query: queryResolvers,
          Mutation: mutationResolvers,
        }
      }),
      subscriptions: {
        keepAlive: 1000,
      },
      tracing: true,
    });

    const options = { port: 4000, host: 'localhost' };
    const host = process.env.API_HOST;
    const port = process.env.API_PORT;
    if (host != null) {
      options.host = host;
    }
    if (port != null) {
      options.port = parseInt(port, 10);
    }

    server.listen(options).then(({ url, subscriptionsUrl }: any) => {
      // eslint-disable-next-line
      console.log(`🚀 Server ready at ${url}`);
      // eslint-disable-next-line
      console.log(`🚀 Subscriptions ready at ${subscriptionsUrl} `);
    });
  }
);
