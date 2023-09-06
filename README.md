# bedhost
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)


This is a REST API for the bedstat pipeline produced statistics.
It needs a path to the *bedbase configuration file*, which can be provided either via `-c`/`--config` argument or read from `$BEDBASE` environment variable. 
## Configuration

### Required

The only required section in the config file are the paths to the [`bedstat`](https://github.com/databio/bedstat) pipeline outputs, where all the BED file related statistics and figures live, and the [`bedbuncher`](https://github.com/databio/bedbuncher) pipeline outputs, where the TAR ball containing the BED files that match the query criteria, iGD database created from the bedset, Bedset statistics, PEP of the bedset created using the pipeline, and the trackHub directory for the BED (for visualization on the UCSC Genome Browser) live.
For example:

```yaml
path:
  pipeline_output_path: $BEDBASE_DATA_PATH/outputs
  bedstat_dir: bedstat_output
  bedbuncher_dir: bedbuncher_output
```
### Optional

The software also needs a working database, we use [PostgreSQL](https://www.postgresql.org/). The config file can point to this database's host. By default `localhost` is used.
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

To run Postgres in docker, follow the instructions in the `bedstat` pipeline software [README.md](https://github.com/databio/bedstat/tree/trackHub#2-run-postgresql), steps 2.

After the Postgres database has been run and the bedstat pipeline was used to populate it, see how to do it [here](https://github.com/databio/bedstat/tree/trackHub#3-run-the-bedstat-pipeline-on-the-pep), one can just start the `bedhost` server like so:

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


# Refactor

I'm in the middle of refactoring this code.
For development, you can now also run it with `uvicorn`, which gives you auto-reload. Two things we need:

1. Since we dont have the argparser to read the config file through CLI, you must pass it in with a command-line variable.
2. We need some environment vars set.

```
source ../bedboss/environment/production.env
BEDBASE_CONFIG=../bedbase.org/config/bedbase.yaml uvicorn bedhost.main:app --reload
```

Using a local config:

BEDBASE_CONFIG=../bbconf/tests/data/config.yaml uvicorn bedhost.main:app --reload

With new database:

BEDBASE_CONFIG=../bedbase.org/config/bedbase2.yaml uvicorn bedhost.main:app --reload


Example bed md5sum: `78c0e4753d04b238fc07e4ebe5a02984`
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/img/open_chromatin
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/img_path/open_chromatin
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/file/bedfile
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/file_path/bedfile
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/metadata
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/metadata?attr_ids=md5sum&attr_ids=genome

