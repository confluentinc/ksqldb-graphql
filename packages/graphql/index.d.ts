import { Config } from './src/schema';

declare module '@ksql/graphql' {
  export const getKsqlSchemas: (
    params: Config,
    config?: any
  ) => Promise<{ schemas: any; queryResolvers: any; subscriptionResolvers: any }>;
}
