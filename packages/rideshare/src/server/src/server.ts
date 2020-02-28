import { ApolloServer } from 'apollo-server';
import { buildKsqlDBGraphQL } from '@ksqldb/graphql';
import { addResolveFunctionsToSchema } from 'graphql-tools';
import axios from 'axios';

import { ksqlServer } from './index';

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
      context: async () => {
        return {
          // TODO make this generic enough that anything can be used
          requester: instance,
        };
      },
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
