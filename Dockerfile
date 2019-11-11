FROM tiangolo/uvicorn-gunicorn-fastapi:python3.7-alpine3.8
LABEL authors="Ognen Duzlevski"

COPY . /app
RUN pip install -r requirements.txt

