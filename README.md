# bedhost
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

`bedhost` is a Python FastAPI module for the API that powers BEDbase
It needs a path to the *bedbase configuration file*, which can be provided either via `-c`/`--config` argument or read from `$BEDBASE_CONFIG` environment variable. 

## Running for development

Running with `uvicorn` provides auto-reload. To configure, this assumes you have previously set up `databio/secrets`. 

1. Source `.env` file to populate the environment variables referenced in the configuration file.
2. Start `bedhost` using `uvicorn` and pass the configuration file via the `BEDBASE_CONFIG` env var.


```console
source ../bedbase.org/environment/production.env
BEDBASE_CONFIG=../bedbase.org/config/api.bedbase.org.yaml uvicorn bedhost.main:app --reload
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

## Running the server in Docker

### Building image

- Primary image: `docker build -t databio/bedhost -f .Dockerfile .`
- Dev image `docker build -t databio/bedhost:dev -f dev.Dockerfile .`
- Test image: `docker build -t databio/bedhost:dev -f test.Dockerfile .`

Existing images can be found [at dockerhub](https://hub.docker.com/r/databio/bedhost).

### Running container for development

Configuration settings and deployment instructions are in the `bedbase.org` repository.
