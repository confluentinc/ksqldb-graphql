ℹ️ *This project is a proof of concept*

# ksqldb-graphql
GraphQL integration for ksqlDB to facilitate easier app creation by abstracting ksqlDB syntax and protocol.

# Background
[KLIP-15](https://github.com/confluentinc/ksql/pull/4069) creates a new API with which to interact. This repository contains packages to generate graphQL as well as handle the ksqlDB protocol. 

# Installation
`yarn add @confluentinc/ksqldb-graphql`
 
# Integration
For statements to be executed against ksqDB, [RequestOptions](https://nodejs.org/api/http.html#http_http_request_options_callback) must be provided, both at startup and in the context of the graphQL resolvers.

The prebuild step, `generateGraphQL`, returns a promise and should be called prior to starting a graphQL server.

# Usage
```js
import { connect } from 'http2';
import { ApolloServer } from 'apollo-server';
import { generateGraphQL } from '@confluentinc/ksqldb-graphql';
import { addResolveFunctionsToSchema } from 'graphql-tools';

const session = connect(`http://localhost:8088`);
const options = {
  hostname: 'localhost',
  port: 8088,
};

generateGraphQL({ options }).then(
  ({ schemas, queryResolvers, subscriptionResolvers, mutationResolvers }) => {
    const server = new ApolloServer({
      context: async () => ({
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
    });
    server.listen();
  }
);
```


# Packages
### @confluentinc/ksqldb-graphql
Generates the schema and resolvers based on an existing ksqlDB cluster.

### @confluentinc/ksqldb-client
Resolves the ksqlDB protocol and executes [ksqlDB statements](https://docs.confluent.io/current/ksql/docs/developer-guide/syntax-reference.html)

### [Rideshare](https://github.com/confluentinc/ksqldb-graphql/tree/master/packages/rideshare)

