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
  bedstat_pipeline_output_path : /home/ognen/bedstat/output/results_pipeline
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
python3 main.py
```

This will start the server, which will listen on [http://127.0.0.1:8000](http://127.0.0.1:8000)

To try it out, use an API point such as: http://127.0.0.1:8000/bedstat/{{id}} - where *id* is the ID of one of the bed files processed by the pipeline.
