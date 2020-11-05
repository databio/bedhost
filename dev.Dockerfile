FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8-slim
LABEL authors="Michal Stolarczyk"

COPY . /app
# For alpine:
#RUN apk add --no-cache --virtual .build-deps build-base alpine-sdk postgresql-dev gcc python3-dev musl-dev bash git openssh

# For slim:
RUN apt-get update 
RUN apt-get install -y git
RUN apt-get install -y libpq-dev
RUN apt-get install -y gcc

RUN pip install -r requirements/requirements-dev.txt
RUN pip install -r requirements/requirements-all.txt
RUN git clone https://github.com/vishnubob/wait-for-it.git
RUN pip install .
