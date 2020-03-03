# Rideshare

A demo app of markers moving around on a map.

To run be sure you are in the root of the repository.

1) Locate your ksql directory and update `/config/ksql-server.properties` with 
```
ksql.apiserver.listen.port=8089
ksql.new.api.enabled=true
```
1) [Start ksql](https://github.com/confluentinc/ksql#getting-started). In the logs, you should see the phrase `KSQL New API Server started`.
1) `yarn install`
1) Go to [google map platform](https://developers.google.com/maps/gmp-get-started), and generate an API key. Save the new key to `src/.mapApiKey.js`  
1) `yarn rideshare` 