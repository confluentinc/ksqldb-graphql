import { ApolloServer } from 'apollo-server';
import { getKsqlSchemas } from '@ksql/graphql';

const ksqlServer = process.env.KSQL_URL || `http://localhost:8088`;

getKsqlSchemas(ksqlServer).then(ksqlSchemas => {
  const server = new ApolloServer({ schema: ksqlSchemas });
  const options = { port: 4000, host: 'localhost' };
  const host = process.env.HOST;
  const port = process.env.PORT;
  if (host != null) {
    options.host = host;
  }
  if (port != null) {
    options.port = parseInt(port, 10);
  }

  server.listen(options).then(({ url }: any) => {
    // eslint-disable-next-line
    console.log(`🚀 Server ready at ${url}`);
  });
});
