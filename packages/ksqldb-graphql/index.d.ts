import { Config } from './src/type/definition';

declare module '@ksqldb/graphql' {
  export const buildKsqlDBGraphQL: (
    params: Config,
    config?: any
  ) => Promise<{
    schemas: any;
    queryResolvers: any;
    subscriptionResolvers: any;
    mutationResolvers: any;
  }>;
}
