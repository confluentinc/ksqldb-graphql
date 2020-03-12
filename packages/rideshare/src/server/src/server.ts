import { connect, ClientHttp2Session } from 'http2';

import { ApolloServer } from 'apollo-server';
import { buildKsqlDBGraphQL } from '@ksqldb/graphql';
import { addResolveFunctionsToSchema } from 'graphql-tools';
import axios from 'axios';

import { ksqlServer } from './index';

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

const instance = axios.create({
  baseURL: ksqlServer,
  timeout: 1000,
});

buildKsqlDBGraphQL({ requester: instance }).then(
  ({ schemas, queryResolvers, subscriptionResolvers, mutationResolvers }) => {
    const apolloResolvers = {
      Subscription: subscriptionResolvers,
      Query: queryResolvers,
      Mutation: mutationResolvers,
    };
    const schema = addResolveFunctionsToSchema({ schema: schemas, resolvers: apolloResolvers });
    const server = new ApolloServer({
      context: async (): Promise<any> => ({
        ksqlDB: {
          requester: instance,
          session,
        },
      }),
      schema,
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
      console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);
    });
  }
);
