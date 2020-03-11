
import { useState, useEffect } from 'react';
import { useSubscription } from '@apollo/react-hooks';
import { UNIQUE_CARS } from './gql';
export function useUniqueCars() {
    const { data } = useSubscription(UNIQUE_CARS);
    const uniqueCars = data && data.UNIQUE_CARS;
    const [cars, setCars] = useState<{ [key: string]: boolean }>({});
    const [count, setCount] = useState<number>(0);
    useEffect(() => {
        // because this is set up via ksqldb, no logic needs to be here
        if (uniqueCars) {
            setCars(prev => {
                prev[uniqueCars.ID] = true
                setCount(Object.keys(prev).length);
                return prev;
            });
        }
    }, [uniqueCars]);

    return { cars, count };
}