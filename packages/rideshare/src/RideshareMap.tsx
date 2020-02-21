import React from 'react';
import { Map, Marker, MapProps } from 'google-maps-react';

export default function RideshareMap({ google }: MapProps): JSX.Element {
  return (
    <Map google={google} zoom={14}>
      <Marker />
    </Map>
  );
}
