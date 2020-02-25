import React from 'react';
import { ApolloProvider } from '@apollo/react-hooks';

import GoogleApiWrapper from './GoogleApiWrapper';
import RideshareMap from './RideshareMap';
import { client } from './apolloClient';

const Rideshare = GoogleApiWrapper(RideshareMap);
const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
      <Rideshare />
    </ApolloProvider>
  );
};

export default App;
