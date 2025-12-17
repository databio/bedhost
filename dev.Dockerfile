FROM python:3.13-slim
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

# Need this command due to geniml dependency on hnswlib
ENV HNSWLIB_NO_NATIVE=1
RUN apt-get install -y python3-dev
RUN apt-get install -y build-essential

RUN pip install uv

# Install CPU-only pytorch, eliminating huge nvidia dependencies
#pip install torch==2.3.1+cpu -f https://download.pytorch.org/whl/torch_stable.html
RUN uv pip install torch --index-url https://download.pytorch.org/whl/cpu --system
RUN uv pip install https://github.com/pepkit/pipestat/archive/refs/heads/dev.zip --system

RUN uv pip install -r requirements/requirements-all.txt --no-cache-dir --system

CMD ["uvicorn", "bedhost.main:app", "--host", "0.0.0.0", "--port", "80"]