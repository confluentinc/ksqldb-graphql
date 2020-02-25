import { ApolloServer } from 'apollo-server';
import { getKsqlSchemas } from '@ksql/graphql';
import { addResolveFunctionsToSchema } from 'graphql-tools';

import { ksqlServer } from './index';

getKsqlSchemas({ ksqlUrl: ksqlServer }).then(
  ({ schemas, queryResolvers, subscriptionResolvers }) => {
    const apolloResolvers = {
      Subscription: subscriptionResolvers,
      Query: queryResolvers,
    };
    const schema = addResolveFunctionsToSchema({ schema: schemas, resolvers: apolloResolvers });
    const server = new ApolloServer({
      schema,
      tracing: true,
    });
    const options = { port: 4000, host: 'localhost' };
    const host = process.env.HOST;
    const port = process.env.PORT;
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
