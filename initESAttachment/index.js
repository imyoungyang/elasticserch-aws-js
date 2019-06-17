const { createESClient } = require('./es_client.js');
const node = process.env.ES_ENDPOINT;
const esclient = createESClient(node);

exports.handler = async (event, context, callback) => {
  var res = "OK";
  console.log('create index: files');
  try {
    await esclient.indices.create({ index: 'files' });
  } catch (err) {
    console.log(err.message);
  }
  
  console.log('put attachment pipeline');
  const attachmentMappingProperties = {
    description: "Extract attachment information",
    processors: [{
      attachment: {
        field: "data",
        indexed_chars: -1,
        properties: ["content", "title", "author", "date", "keywords", "content_length", "language"]
      }
    }]
  };
  
  try {
    res = await esclient.ingest.putPipeline({ id: 'attachment', body: attachmentMappingProperties });
  } catch (err) {
    console.log(err.message);
  }
  callback(null, res);
};
