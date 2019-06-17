const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const { createESClient } = require('./es_client.js');
const node = process.env.ES_ENDPOINT;
const esclient = createESClient(node);

const getContentBase64 = (bucket, key) => {
  return new Promise((resolve, reject) => {
    s3.getObject({ Bucket: bucket, Key: key }, (err, data) => {
      if (err) {
        reject(err);
      }
      else {
        // console.log('data: ', data); // successful response
        var attachment = data.Body.toString('base64');
        resolve(attachment);
      }
    });
  });
};


exports.handler = async(event, context, callback) => {

  var bucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  console.log(bucket)
  console.log(key);

  const attachment = await getContentBase64(bucket, key);
  // console.log(attachment);
  
  console.log('index attachment');
  var res = await esclient.index({
    index: 'files',
    id: bucket + '/' + key,
    pipeline: 'attachment',
    body: {
      bucket: bucket,
      key: key,
      data: attachment
    }
  });

  // TODO implement
  callback(null, res);
};
