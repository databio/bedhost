# Deploying bedbase.org

This repository deploys the API for bedbase. It will run these services:

1. production API: https://api.bedbase.org/
2. dev API: https://api-dev.bedbase.org/

This repo will deploy a new service by following these steps:

1. Build an image by packaging the bedhost image (from dockerhub) with the bbconf file in this repository.
2. Push that image to AWS.
3. Deploy it to yeti cluster with aws task def.

## Build the container

Here we use the `databio/bedhost` container on dockerhub, and just add the configuration file in this repo to it, so build is super fast.

```
docker build -t databio/bedhost-configured -f Dockerfiles/primary.Dockerfile .
```

Or for dev:

```
docker build -t databio/bedhost-configured-dev -f Dockerfiles/dev1.Dockerfile .
```

## Run it locally to test

First, source the .env file to set env vars in the calling environment.
Then, use `--env-file` to pass those env vars through to the container

```
source environment/production.env
docker run --rm --network="host" \
  --env-file environment/docker.env \
  databio/bedhost-configured-dev
```

Here's another example for running the container:

```
docker run --rm --init -p 8000:8000 --name bedstat-rest-server \
  --network="host" \
  --volume ~/code/bedbase.org/config/api.bedbase.org.yaml:/bedbase.yaml \
  --env-file ../bedbase.org/environment/docker.env \
  --env BEDBASE_CONFIG=/bedbase.yaml \
  databio/bedhost  uvicorn bedhost.main:app --reload
```

## Building the Amazon-tagged version

You could build and push to ECR like this if you need it... but the github action will do this for you.

Authenticate with AWS ECR:
```
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 235728444054.dkr.ecr.us-east-1.amazonaws.com
```

Build/tag/push image:
```
docker build -t 235728444054.dkr.ecr.us-east-1.amazonaws.com/bedhost -f Dockerfiles/primary.Dockerfile .
docker push 235728444054.dkr.ecr.us-east-1.amazonaws.com/bedhost
```

## Upload data to the bedbase AWS S3 bucket

You'll also have to upload the actual artifacts produced by the pipelines into our s3 buckets. These are then hosted via the basic s3 file server, which is configured using the `path:  remote_url_base:` in the bedbase configuration yaml.

For this server we're using the `data.bedbase.org` bucket.

Upload all BED files
```
cd $BEDBASE_DATA_PATH/bed_files
aws s3 sync . s3://data.bedbase.org/big_files/ --include '*.bed.gz'
```
Upload all .bigBed files
```
cd $BEDBASE_DATA_PATH/bigbed_files
aws s3 sync . s3://data.bedbase.org/bigbed_files/ --exclude 'tmp*' --include '*.bigBed'
```
Upload `bedstat` and `bedbuncher` outputs
```
cd $BEDBASE_DATA_PATH/outputs
aws s3 sync . s3://data.bedbase.org/outputs/ 
```


## Uploading files to S3 (new back-end)

To upload files to S3, we need some credentials. Set the credentials for the aws CLI int to the proper environment variables like this:

```
source code/bedbase.org/environment/production.env
```

Then you can list files with `aws s3 ls bedbase`.

```
aws s3 ls s3://bedbase
```

And you can add new ones like this:

```
aws s3 cp <local_files> s3://bedbase
```

aws s3 cp $HOME/garage/bedbase_tutorial/out2023/* s3://bedbase

aws s3 sync $HOME/garage/bedbase_tutorial/out2023/output s3://bedbase/output



```
bedboss all --sample-name tutorial_f1 --input-file bed_files/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38.bed.gz --input-type bed --outfolder out2023 --genome GRCh38 --bedbase-config ~/code/bedbase.org/config/bedbase2.yaml
```

