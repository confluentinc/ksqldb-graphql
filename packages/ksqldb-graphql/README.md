# ksqldb-graphql
Generates a graphQL schema and resolvers from an existing ksqlDB server using the [ksqlDB http2 API](https://github.com/confluentinc/ksql/pull/4069).

## Installation
`yarn add @confluentinc/ksqldb-graphql`

## Integration
`generateGraphQL({ options })` - accepts [RequestOptions](https://nodejs.org/api/http.html#http_http_request_options_callback) and returns a promise with schemas and resolvers for use in a graphQL server.

`runCommand(command, options)` - accepts a [ksqlDB statement](https://docs.confluent.io/current/ksql/docs/developer-guide/syntax-reference.html) and [RequestOptions](https://nodejs.org/api/http.html#http_http_request_options_callback), returns a [ksqlDB REST response](https://docs.confluent.io/current/ksql/docs/developer-guide/api.html#run-a-ksql-statement).

## Examples
[Rideshare](https://github.com/confluentinc/ksqldb-graphql/tree/master/packages/rideshare)
