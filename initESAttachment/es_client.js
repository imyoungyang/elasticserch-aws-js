const { AwsConnector } = require('./aws_es_connector.js');
const { Client } = require('@elastic/elasticsearch');

const createESClient = (node) => { return new Client({
  node,
  Connection: AwsConnector
})};

//use this client to talk to AWS managed ES service.
exports.createESClient = createESClient;