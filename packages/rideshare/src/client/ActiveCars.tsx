import React, { useState } from 'react';
import { useSubscription } from '@apollo/react-hooks';

import { SUBSCRIBE_TO_CAR } from './gql';
import { Heading, CarInfo, ActiveCarWrapper } from './StyledComponents';
import { useUniqueCars } from './hooks';

export default function ActiveCars(): JSX.Element {
  const [selectedCar, setSelectedCar] = useState<string>('select');
  const { cars, count } = useUniqueCars();

  const { data } = useSubscription(SUBSCRIBE_TO_CAR, { variables: { ID: selectedCar } });
  const carKeys = Object.keys(cars);
  return (
    <ActiveCarWrapper>
      <div>Active cars: {count}</div>
      <div>
        <div style={{ marginBottom: '12px' }}>
          Car lookup{' '}
          <select
            onChange={(e): void => {
              setSelectedCar(e.target.value);
            }}
            value={selectedCar}
          >
            <option value="select">Select car...</option>
            {carKeys.map((car) => (
              <option key={car} value={car}>
                {car}
              </option>
            ))}
          </select>
        </div>
        {data != null && (
          <CarInfo>
            <Heading>{selectedCar}</Heading>
            <div>lat: {data.CARS.LAT}</div>
            <div>long: {data.CARS.LONG}</div>
          </CarInfo>
        )}
      </div>
    </ActiveCarWrapper>
  );
}
