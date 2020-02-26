import { Config } from './src/type/definition';

declare module '@ksql/graphql' {
  export const getKsqlSchemas: (
    params: Config,
    config?: any
  ) => Promise<{
    schemas: any;
    queryResolvers: any;
    subscriptionResolvers: any;
    mutationResolvers: any;
  }>;
}
