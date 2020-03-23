const ksqlHost = process.env.KSQL_HOST || 'localhost';
const ksqlPort = process.env.KSQL_PORT || '8088';
export const ksqlDBOpts = {
    hostname: ksqlHost,
    port: ksqlPort,
};
