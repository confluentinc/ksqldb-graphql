import { gql } from 'apollo-server';

export default gql`
  type Driver {
    id: ID!
    name: String
    lat: Int
    lng: Int
  }

  type Passenger {
    id: ID!
    name: String
    lat: Int
    lng: Int
  }

  type Query {
    getDrivers: Driver
    getPassengers: Passenger
  }
`;
