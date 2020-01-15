import React from 'react';
import { Map, Marker } from 'google-maps-react';

export default function RideshareMap({ google }: any) {
  return (
    <Map google={google} zoom={14}>
      <Marker />
    </Map>
  );
}
