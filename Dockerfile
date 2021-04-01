FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8-slim
LABEL authors="Michal Stolarczyk"

COPY . /app
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y libpq-dev
RUN apt-get install -y gcc
RUN apt-get install -y wget
RUN apt-get install -y libcurl4

RUN pip install -r requirements/requirements-all.txt
RUN git clone https://github.com/vishnubob/wait-for-it.git
RUN pip install .

RUN wget http://hgdownload.cse.ucsc.edu/admin/exe/linux.x86_64/bigBedToBed -P /usr/local/bin
RUN chmod 755 /usr/local/bin/bigBedToBed
