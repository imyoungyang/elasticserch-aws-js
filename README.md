# Elastic Client for Lambda Node.JS

## Install
This is the SAM format. You can gitclone this repos in cloud9.

```
cd getObjectStreamToES
npm install
```
Then deploy to you aws lambda environment.

## Under the hook

### Why
Why use `@elastic/elasticsearch` instead of pure http? It is the official elastic search js client [link](https://github.com/elastic/elasticsearch-js). It supports:

- Persistent, Keep-Alive connections. **Better performance**
- One-to-one mapping with REST API.
- Configurable, automatic discovery of cluster nodes.


### AWS Credentials
AWS managed elastic search will use SigV4 and creditials to check the authetication and authorization. I extend the esclient `connection` object at code [here](https://github.com/imyoungyang/elasticserch-aws-js/blob/master/getObjectStreamToES/es_client.js#L6)

In the AwsConnector, I get the credital [here](https://github.com/imyoungyang/elasticserch-aws-js/blob/master/getObjectStreamToES/aws_es_connector.js#L7). It is easy and safe way in the lambda environment.

```
const creds = new AWS.EnvironmentCredentials('AWS'); // in lambda
```

### AWS HttpRequest
AWS HttpRequest did not support `querystring` parameters, which is generated from elasticsearch js. We need to move the `querystring` into the full url path. Code is [here](https://github.com/imyoungyang/elasticserch-aws-js/blob/master/getObjectStreamToES/aws_es_connector.js#L40)

```
    if (req.querystring) {
      req.path+='/?'+req.querystring;
      delete req.querystring;
    }
```

### SigV4

All request to elasticserch must sigV4. Code is [here](https://github.com/imyoungyang/elasticserch-aws-js/blob/master/getObjectStreamToES/aws_es_connector.js#L10)

## Full Text search for attachment

### Elastic Search Plugin
AWS support ES plugins [here](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/aes-supported-plugins.html). So that it is possible to use the following plugin to help us pdf document full index search.

- Ingest Attachment Processor
- Smart Chinese Analysis

### Ingest Attachment Processor
The ingest attachment plugin lets Elasticsearch extract file attachments in common formats (such as PPT, XLS, and PDF) by using the Apache text extraction library [Tika](http://tika.apache.org/).

![](https://www.tutorialspoint.com/tika/images/tika_architecture.jpg)

If you want to sue attachment process, you need to do the following works:

### Step 1. Enable pipeline

You must `ingest.putPipeline` command. `id` is used for the following pipeline key. `body` defines some attaributes. [code](https://github.com/imyoungyang/elasticserch-aws-js/blob/master/getObjectStreamToES/index.js#L87)

```
esclient.ingest.putPipeline({id: 'attachment', body: attachmentMappingProperties});
```

### attachmentMappingProperties

The properties example for official document [here](https://www.elastic.co/guide/en/elasticsearch/plugins/6.7/ingest-attachment-extracted-chars.html)

- indexed_chars : -1, means all contents. default is 100K.
- fields: 'data' will be post body `key`.

code is [here](https://github.com/imyoungyang/elasticserch-aws-js/blob/master/getObjectStreamToES/index.js#L87)

```
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
```

### Step 2: Index the file

code is [here](https://github.com/imyoungyang/elasticserch-aws-js/blob/master/getObjectStreamToES/index.js#L93)

Must add `pipeline: 'attachment'`, `id`, and put base64 of pdf content in the `body.data`

```
esclient.index(
  {
    index: 'files',
    id: '1',
    pipeline: 'attachment',
    body: {
      data: attachment
    }
  });
```

### Step 3: Search

**Before searching, need to wait for a while.** It depends the file size. If you don't wait, you can't get the search results.

code is [here](https://github.com/imyoungyang/elasticserch-aws-js/blob/master/getObjectStreamToES/index.js#L104)

```
await sleep(3000);
res = await esclient.search({
q: '测试',
index: 'files'
});
```


## Reference
* AWS sample code for s3 streaming to elastic search [here](https://github.com/aws-samples/amazon-elasticsearch-lambda-samples). But, it is not easy to handle. It is use "chunk" to send data.

