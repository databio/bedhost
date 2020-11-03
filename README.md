# bedhost

This is a REST API for the bedstat pipeline produced statistics.
It needs a path to the *bedbase configuration file*, which can be provided either via `-c`/`--config` argument or read from `$BEDBASE` environment variable. 
## Configuration

### Required

The only required section in the config file is the path to the [`bedstat`](https://github.com/databio/bedstat) pipeline output, where all the BED file related statistics and figures live.
For example:

```yaml
path:
  bedstat_output: $HOME/results_pipeline
```
### Optional

The software also needs a working database, we use [Elasticsearch](https://www.elastic.co/). The config file can point to this database's host. By default `localhost` is used.
For example:

```yaml
database:
  host : 125.132.33.111
```

In order to configure the server itself, a section of config exists, where server host address and port can be defined. By default host `0.0.0.0` and port `80` are used.
For example:

```yaml
server:
  host: 125.132.33.111
  port: 8000
```

To run Elastic in docker, follow the instructions in the `bedstat` pipeline software [README.md](https://github.com/databio/bedstat#2-create-a-persistent-volume-to-house-elasticsearch-data), steps 2 and 3.

After the elastic database has been run and the bedstat pipeline was used to populate it, see how to do it [here](https://github.com/databio/bedstat/blob/master/README.md#4-run-the-bedstat-pipeline-on-the-pep), one can just start the `bedhost` server like so:

```
bedhost serve -c /path/to/cfg.yaml
```

This will start the server, which will listen on [http://0.0.0.0:8000](http:/0.0.0.0:8000)

---

## Running the server in Docker

### Building container

In the same directory as Dockerfile:

```
docker build -t bedstat-rest-api-server .
```

Or, maybe this is better:

```
docker build -t databio/bedhost -f dev.Dockerfile .
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

