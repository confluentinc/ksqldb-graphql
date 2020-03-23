# ksqldb-graphql
Graphql integration for ksqldb

# Background
Because of ksqldb [klip-15](https://github.com/confluentinc/ksql/pull/4069), there will be a new API with which to interact. This library contains graphql wrappers around that API in order to facilitate easier app creation.

# Installation
`yarn install @confluentinc/ksqldb-graphql`
 
# Integration
For statements to be executed against ksqdb, [RequestOptions](https://nodejs.org/api/http.html#http_http_request_options_callback) must be provided, both at startup and in the context of the graphql resolvers.

The prebuild step, `generateGraphQL`, returns a promise and should be called prior to starting the graphql server.

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
      });
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
The main graphql package. This generates the schema and resolvers based on an existing ksqldb cluster.

### [Rideshare](https://github.com/confluentinc/ksqldb-graphql/tree/master/packages/rideshare)

