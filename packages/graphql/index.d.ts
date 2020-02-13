declare module '@ksql/graphql' {
  export const getKsqlSchemas: (ksqlUrl: string, config?: any) => Promise<any>;
}
