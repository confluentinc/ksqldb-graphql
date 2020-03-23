import React from 'react';
import { Map, Marker, MapProps } from 'google-maps-react';
import { useSubscription } from '@apollo/react-hooks';

import { SUBSCRIBE_TO_CAR } from './gql';
import Sidebar from './Sidebar';
import { useUniqueCars } from './hooks';

const Car = ({ rowKey, ...otherProps }: any): JSX.Element => {
  const { data } = useSubscription(SUBSCRIBE_TO_CAR, { variables: { ID: `${rowKey}` } });
  const {
    CARS: { LAT, LONG },
  } = data ?? { CARS: { LAT: null, LONG: null } };
  return <Marker position={{ lat: LAT, lng: LONG }} {...otherProps} />;
};

export default function RideshareMap({ google }: MapProps): JSX.Element {
  const { cars } = useUniqueCars();
  return (
    <>
      <Sidebar />
      <Map google={google} initialCenter={{ lat: 47.612295, lng: -122.331734 }} zoom={14}>
        {cars &&
          Object.keys(cars).map((name) => {
            return <Car key={name} name={name} rowKey={name} />;
          })}
      </Map>
    </>
  );
}
