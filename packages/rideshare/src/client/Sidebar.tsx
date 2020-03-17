import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/react-hooks';

import { ADD_CAR } from './gql';
import ActiveCars from './ActiveCars';
import { Wrapper, FormWrapper, Label, InfoText, Button } from './StyledComponents';

export default function Sidebar(): JSX.Element {
  const [rowKey, setRowKey] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [lat, setLat] = useState<void | number>();
  const [long, setLong] = useState<void | number>();
  const [addCar] = useMutation(ADD_CAR);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSubmitting(false);
    }, 2000);

    return (): void => {
      clearTimeout(timer);
    };
  }, [submitting]);

  const clear = (): void => {
    setRowKey('');
    setLat();
    setLong();
  };

  const handleNewCar = (): void => {
    setSubmitting(true);
    addCar({ variables: { ROWKEY: rowKey, LAT: lat, LONG: long } });
    clear();
  };

  return (
    <Wrapper>
      <div>{submitting ? 'Car added' : ''}</div>
      <FormWrapper>
        <Label>name</Label>
        <input onChange={(e): void => setRowKey(e.target.value)} type="text" value={rowKey} />
      </FormWrapper>
      <FormWrapper>
        <Label>lat</Label>
        <input
          onChange={(e): void => setLat(parseFloat(e.target.value))}
          type="text"
          value={lat || ''}
        />
      </FormWrapper>
      <FormWrapper>
        <Label>long</Label>
        <input
          onChange={(e): void => setLong(parseFloat(e.target.value))}
          type="text"
          value={long || ''}
        />
      </FormWrapper>
      <Button onClick={handleNewCar} type="button">
        Add car
      </Button>
      <ActiveCars />
      <InfoText>starting point: lat: 47.612295, lng: -122.331734</InfoText>
    </Wrapper>
  );
}
