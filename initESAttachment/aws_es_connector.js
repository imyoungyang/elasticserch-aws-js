const AWS = require("aws-sdk");
const { Connection } = require('@elastic/elasticsearch');

class AwsConnector extends Connection {
  async request(params, callback) {
    try {
      const creds = new AWS.EnvironmentCredentials('AWS'); // in lambda
      const req = this.createRequest(params);
      //console.log(req);
      const { request: signedRequest } = this.signRequest(req, creds);
      super.request(signedRequest, callback);
    } catch (error) {
      throw error;
    }
  }

  createRequest(params) {
    const endpoint = new AWS.Endpoint(this.url.href);
    let req = new AWS.HttpRequest(endpoint);

    Object.assign(req, params);
    req.region = AWS.config.region;

    if (!req.headers) {
      req.headers = {};
    }

    let body = params.body;

    if (body) {
      let contentLength = Buffer.isBuffer(body)
        ? body.length
        : Buffer.byteLength(body);
      req.headers['Content-Length'] = contentLength;
      req.body = body;
    }
    req.headers['Host'] = endpoint.host;
    // aws HttpRequest did not support query string. need to put in the path
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/HttpRequest.html
    if (req.querystring) {
      req.path+='/?'+req.querystring;
      delete req.querystring;
    }
    return req;
  }

  signRequest(request, creds) {
    const signer = new AWS.Signers.V4(request, 'es');
    signer.addAuthorization(creds, new Date());
    return signer;
  }
}

exports.AwsConnector = AwsConnector;