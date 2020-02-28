import React from 'react';
import { Map, Marker, MapProps } from 'google-maps-react';
import gql from 'graphql-tag';
import { useSubscription } from '@apollo/react-hooks';

const generateQuery = (index: number): any => gql`
  subscription getPageviews {
    CARS(ID: "car${index}") {
      LAT
      LONG
    }
  }
`;

const Car = ({ query, ...otherProps }: any): JSX.Element => {
  const { data } = useSubscription(query);
  if (!data) {
    return <div>Loading...</div>;
  }
  const {
    CARS: { LAT, LONG },
  } = data;
  return <Marker position={{ lat: LAT, lng: LONG }} {...otherProps} />;
};
const cars = [1, 2, 3, 4].map(index => {
  return <Car key={index} query={generateQuery(index)} />;
});

export default function RideshareMap({ google }: MapProps): JSX.Element {
  return (
    <Map google={google} initialCenter={{ lat: 47.612295, lng: -122.331734 }} zoom={14}>
      {cars}
    </Map>
  );
}
