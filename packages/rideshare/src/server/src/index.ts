import { ApolloServer } from 'apollo-server';

import typeDefs from './schema';

const server = new ApolloServer({ typeDefs });
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
