FROM python:3.10-slim
LABEL authors="Oleksandr Khoroshevskyi, Nathan Sheffield"

RUN apt-get update
RUN apt-get install -y gcc
RUN apt-get install -y libpq-dev
RUN apt-get install -y --no-install-recommends git

# RUN apt-get update -y && \
#     apt-get install -y libpq-dev && \  # for postgres backend
#     apt-get install -y gcc && \
#     apt-get install -y wget && \
#     apt-get install -y libcurl4 && \
# cpp compiler required for hsnwlib

EXPOSE 80
EXPOSE 6333

WORKDIR /app
COPY . /app

RUN python -m pip install --upgrade pip

# Install CPU-only pytorch, eliminating huge nvidia dependencies
RUN pip install torch==2.1.0+cpu -f https://download.pytorch.org/whl/torch_stable.html
RUN pip install https://github.com/pepkit/pipestat/archive/refs/heads/dev.zip

RUN pip install -r requirements/requirements-all.txt --no-cache-dir

CMD ["uvicorn", "bedhost.main:app", "--host", "0.0.0.0", "--port", "80"]
