import gql from 'graphql-tag';

export const ADD_CAR = gql`
mutation createCar($ROWKEY: String, $LAT: Float, $LONG: Float){
  CARS(ROWKEY: $ROWKEY, LAT: $LAT, LONG: $LONG) {
    status
  }
}
`;
export const SUBSCRIBE_TO_CAR = gql`
  subscription getCarById($ID: String) {
    CARS(ID: $ID) {
      LAT
      LONG
    }
  }
`;
export const UNIQUE_CARS = gql`
 subscription uniqueCars {
     UNIQUE_CARS {
         ID
     }
 }
`;
