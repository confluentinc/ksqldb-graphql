import {
  GraphQLFieldResolver,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLResolveInfo,
} from 'graphql';

export interface KSqlDBEntities {
  [key: string]: {
    type: GraphQLObjectType | GraphQLScalarType;
  };
}

export type Request = (url: string, body: any, args: any) => void;
export interface Config {
  requester: any;
}
type KsqldbType = 'BIGINT' | 'STRING' | 'INTEGER' | 'ARRAY' | 'VARCHAR' | 'STRUCT';
export interface MemberSchema {
  type: Exclude<'ARRAY' | 'STRUCT', KsqldbType>; // TODO - can you have arrays in member schemas?
}

export interface Field {
  name: string;
  schema: {
    type: KsqldbType;
    fields: Array<Field> | null;
    memberSchema: MemberSchema | null;
  };
}

export interface KsqlDBResponse {
  name: string;
  readQueries: Array<any>; // TODO
  writeQueries: Array<any>; // TOOD
  fields: Array<Field>;
  type: 'STREAM' | 'TABLE';
  key: string;
  timestamp: string;
  statistics: string;
  errorStats: string;
  extended: boolean;
  format: 'JSON' | 'AVRO'; // TODO verify this value
  topic: string;
  partitions: number;
  replication: number;
}
export interface Resolver {
  [key: string]: GraphQLFieldResolver<void, { requester: any }>;
}
export interface SubscriptionResolver {
  [name: string]: {
    subscribe: (
      obj: void,
      args: { [key: string]: string },
      context: { requester: any },
      info: GraphQLResolveInfo
    ) => Promise<void>;
  };
}

export type KsqlDBGraphResolver = GraphQLFieldResolver<
  void,
  { requester: any },
  { [argName: string]: string }
>;
