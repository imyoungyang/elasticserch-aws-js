const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const { createESClient } = require('./es_client.js');
const node = 'es endpoint with https';
const esclient = createESClient(node);

const bucket = 'bucket Name';
const key = 'complex.pdf';

const getPdfAttachment = (bucket, key) => {
  return new Promise((resolve, reject) => {
    s3.getObject({ Bucket: bucket, Key: key }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        console.log('data: ', data); // successful response
        var attachment = data.Body.toString('base64');
        resolve(attachment);
      }
    });
  });
};

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

exports.handler = async (event, context) => {

  var res;
  console.log('delete index');
  try {
    res = await esclient.indices.delete({index: 'test'});
  } catch (err) {
    console.log(err.message);
  }

  try {
    res = await esclient.indices.delete({index: 'files'});
  } catch (err) {
    console.log(err.message);
  }

  console.log('create index');
  res = await esclient.indices.create({  
    index: 'test'
  });
  // console.log(res);
  
  console.log('add index');
  res = await esclient.index({
    index: 'test',
    type: 'house',
    id: '1',
    body: {
      name: 'huhu'
    }
  });
  // console.log(res);
  
  // without waiting, you search result will be empty.  
  await sleep(1000);
  console.log('search index');
  res = await esclient.search({
    index: 'test',
    q: 'huhu'
  });
  console.log(res.body.hits.hits);

  
  await esclient.indices.create({index: 'files'});

  console.log('put attachment pipeline');
  const attachmentMappingProperties = {
    description: "Extract attachment information",
    processors: [{
      attachment: {
        field: "data",
        indexed_chars : -1,
        properties: [ "content", "title", "author", "date", "keywords", "content_length", "language"]
      }
    }]
  };
  res = await esclient.ingest.putPipeline({id: 'attachment', body: attachmentMappingProperties});

  const attachment = await getPdfAttachment(bucket, key);
  // console.log(attachment);
  
  console.log('index attachment');
  res = await esclient.index(
  {
    index: 'files',
    id: '1',
    pipeline: 'attachment',
    body: {
      data: attachment
    }
  });
  // console.log(res);
  
  await sleep(3000);
  res = await esclient.search({
    q: '测试',
    index: 'files'
  });
  console.log(res.body.hits.hits);
};
