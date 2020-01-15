import React from 'react';
import { GoogleApiWrapper } from 'google-maps-react';

import GOOGLE_MAPS_API_KEY from './.mapApiKey';

const LoadingContainer: React.FC = () => <div>Loading...</div>;

export default GoogleApiWrapper({
  apiKey: GOOGLE_MAPS_API_KEY,
  LoadingContainer: LoadingContainer,
});
