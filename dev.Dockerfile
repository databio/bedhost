FROM tiangolo/uvicorn-gunicorn:python3.8-alpine3.10
LABEL authors="Michal Stolarczyk"

COPY . /app
RUN apk add --no-cache --virtual .build-deps build-base alpine-sdk postgresql-dev gcc python3-dev musl-dev bash git openssh

RUN pip install -r requirements/requirements-dev.txt
RUN pip install -r requirements/requirements-all.txt
RUN git clone https://github.com/vishnubob/wait-for-it.git
RUN pip install . 