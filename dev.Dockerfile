FROM tiangolo/uvicorn-gunicorn-fastapi:python3.11-slim
LABEL authors="Michal Stolarczyk"

RUN apt-get update -y && \
    apt-get install -y git && \
    apt-get install -y libpq-dev && \
    apt-get install -y gcc && \
    apt-get install -y wget && \
    apt-get install -y libcurl4

RUN pip install --upgrade pip
RUN pip install https://github.com/pepkit/pipestat/archive/refs/heads/dev.zip
RUN pip install https://github.com/databio/bbconf/archive/refs/heads/dev.zip

RUN wget http://hgdownload.cse.ucsc.edu/admin/exe/linux.x86_64/bigBedToBed -P /usr/local/bin
RUN wget http://hgdownload.cse.ucsc.edu/admin/exe/linux.x86_64/bedIntersect -P /usr/local/bin
RUN chmod 755 /usr/local/bin/bigBedToBed /usr/local/bin/bedIntersect

COPY . /app
RUN pip install -r requirements/requirements-all.txt
RUN pip install -r requirements/requirements-dev.txt
RUN pip install .
