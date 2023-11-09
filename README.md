# bedhost
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)


This is a REST API for the bedstat pipeline produced statistics.
It needs a path to the *bedbase configuration file*, which can be provided either via `-c`/`--config` argument or read from `$BEDBASE` environment variable. 
## Running for development

Running with `uvicorn` provides auto-reload. To configure, this assumes you have previously set up `databio/secrets`. 

1. Source `.env` file to populate the environment variables referenced in the configuration file.
2. Start `bedhost` using `uvicorn` and passing the configuration file via the `BEDBASE_CONFIG` env var.


```console
source ../bedbase.org/environment/production.env
BEDBASE_CONFIG=../bedbase.org/config/bedbase.yaml uvicorn bedhost.main:app --reload
```

You can change the database you're connecting to by using a different config file:
- Using a local config: `BEDBASE_CONFIG=../bbconf/tests/data/config.yaml uvicorn bedhost.main:app --reload`
- With new database: `BEDBASE_CONFIG=../bedbase.org/config/bedbase2.yaml uvicorn bedhost.main:app --reload`

Now, you can access the service at [http://127.0.0.1:8000](http://127.0.0.1:8000). Example endpoints:
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/img/open_chromatin
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/img_path/open_chromatin
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/file/bedfile
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/file_path/bedfile
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/metadata
- 127.0.0.1:8000/bed/78c0e4753d04b238fc07e4ebe5a02984/metadata?attr_ids=md5sum&attr_ids=genome


## Running for production

You can also start the `bedhost` server like so:

```
bedhost serve -c /path/to/cfg.yaml
```

This will start the server, which will listen on [http://0.0.0.0:8000](http:/0.0.0.0:8000)

---

## Running the server in Docker

(These instructions may be a bit outdated)

### Building container

```console
docker build -t databio/bedhost:dev -f dev.Dockerfile .
```

### Running container for development

The container will need to have access to two different directories:

1. Output of bedboss pipeline
2. Original location of raw .BED files used to produce bedboss output

For example, if LOLA Core DB was used as input to the bedstat pipeline and results were stored in `<some path>/bedstat/output/results_pipeline`:

```
docker run --rm -p 8000:8000 -e HOST=0.0.0.0 -e PORT=8000 --name bedstat-rest-server -v /ext/qumulo/LOLAweb/databases/LOLACore:/ext/qumulo/LOLAweb/databases/LOLACore -v /development/bedstat/output/results_pipeline:/development/bedstat/output/results_pipeline bedstat-rest-api-server
```

Add a -d to the above command to run the docker container in the background (production).

Here's how I run the container:

```
docker run --rm --init -p 8000:8000 --name bedstat-rest-server \
  --network="host" \
  databio/bedhost:dev uvicorn main:app --reload
```
