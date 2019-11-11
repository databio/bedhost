# bedstat-rest-api

This is a REST API for the bedstat pipeline produced statistics.

It needs a path to where all the .bed file statistics live, which should be the path of the output of the bedstat pipeline. It will then correlate this information with information stored in the database backend, to serve the statistics and images derived from all the .bed files.

So, for example, if the bedstat pipeline software produced output in

```
/home/ognen/bedstat/output/results_pipeline
```

the config.yaml file in the base directory of bedstat-rest-api should be:

```
path_config:
  bedstat_pipeline_output_path: /home/ognen/bedstat/output/results_pipeline
```

The software also needs a working database, (for now) we use ElasticSearch. The config.yaml file needs to point to this database's host, such as:

```
database:
  host : localhost
```

In order to configure the server itself, a section of config.yaml exists, like so:

```
server:
  host: 0.0.0.0
  port: 8000
```

Either host and port variables can be modified in this file to suit the individual situations at hand.

To run Elastic in docker, follow the instructions in the bedstat pipeline software README.md: [https://github.com/databio/bedstat#2-create-a-persistent-volume-to-house-elasticsearch-data](https://github.com/databio/bedstat#2-create-a-persistent-volume-to-house-elasticsearch-data), steps 2 and 3.

After the elastic database has been run and the bedstat pipeline was used to populate it (see how to do it here: [https://github.com/databio/bedstat/blob/master/README.md#4-run-the-bedstat-pipeline-on-the-pep](https://github.com/databio/bedstat/blob/master/README.md#4-run-the-bedstat-pipeline-on-the-pep)), one can just start the bedstat-rest-api server like so:

```
 uvicorn main:app --reload
```

This will start the server, which will listen on [http://127.0.0.1:8000](http://127.0.0.1:8000)

To try it out, use an API point such as: http://127.0.0.1:8000/bedstat/{{id}} - where *id* is the ID of one of the bed files processed by the pipeline.

## Running the server in Docker

### Building container

In the same directory as Dockerfile:

```
docker build -t bedstat-rest-api-server .
```

### Running container for development

The container will need to have access to two different directories:

1. Output of bedstat looper pipeline
2. Original location of raw .BED files used to produce bedstat pipeline output

For example, if LOLA Core DB was used as input to the bedstat pipeline and results were stored in \<some path\>/bedstat/output/results_pipeline:

```
docker run --rm -p 8000:8000 -e HOST=0.0.0.0 -e PORT=8000 --name bedstat-rest-server -v /ext/qumulo/LOLAweb/databases/LOLACore:/ext/qumulo/LOLAweb/databases/LOLACore -v /development/bedstat/output/results_pipeline:/development/bedstat/output/results_pipeline bedstat-rest-api-server
```

Add a -d to the above command to run the docker container in the background (production).

Here's how I run the container:

```
docker run --rm --init -p 8000:8000 --name bedstat-rest-server \
  --network="host" \
  -v /home/nsheff/code/bedstat/output/results_pipeline:/home/nsheff/code/bedstat/output/results_pipeline \
  bedstat-rest-api-server uvicorn main:app --reload
```

