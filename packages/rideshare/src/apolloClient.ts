import { ApolloClient } from 'apollo-client';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { split } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';

const cache = new InMemoryCache();
const host = process.env.HOST || 'ec2-54-187-136-198.us-west-2.compute.amazonaws.com';
const port = process.env.PORT || '3010';
const httpLink = new HttpLink({
  uri: `http://${host}:${port}/`,
});
const wsLink = new WebSocketLink({
  uri: `ws://${host}:${port}/graphql`,
  options: {
    reconnect: true,
  },
});

const link = split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  httpLink
);

export const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  cache,
  link,
});
