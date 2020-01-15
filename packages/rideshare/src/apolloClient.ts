import ApolloClient from 'apollo-boost';

const client = new ApolloClient({
  uri: 'http://localhost:3054',
});
export default client;
