const { createESClient } = require('./es_client.js');
const node = process.env.ES_ENDPOINT;
const esclient = createESClient(node);

exports.handler = async(event, context) => {
  var keyword = '';
  if (event.queryStringParameters && event.queryStringParameters.q) {
    console.log("Received keyword: " + event.queryStringParameters.q);
    keyword = event.queryStringParameters.q;
  }

  var res = await esclient.search({
    q: keyword,
    index: 'files'
  });
  // console.log(res.body.hits.hits);
  const total = res.body.hits.total;
  if (total > 0) {
    var result = JSON.parse(JSON.stringify(res.body.hits.hits));
    for(var k in result) {
      // remove Base64
      delete result[k]['_source'].data;
      // console.log(k, result[k]);
    }
  }
  
  let responseCode = 200;
  let responseBody = {
    total: total,
    hits: result
  };

  let response = {
    statusCode: responseCode,
    body: JSON.stringify(responseBody)
  };
  console.log("response: " + JSON.stringify(response))
  return response;
};
