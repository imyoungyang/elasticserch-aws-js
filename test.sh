#!/bin/bash
sam local invoke s3LambdaES -e s3LambdaES/event.json --env-vars ./env.json
sam local invoke getObjectStreamToES --env-vars ./env.json
sam local invoke keywordSearch -e keywordSearch/event.json --env-vars ./env.json