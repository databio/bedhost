FROM tiangolo/uvicorn-gunicorn-fastapi:python3.11-slim
LABEL authors="Nathan Sheffield"

# RUN apt-get update -y && \
#     apt-get install -y libpq-dev && \  # for postgres backend
#     apt-get install -y gcc && \
#     apt-get install -y wget && \
#     apt-get install -y libcurl4 && \
# cpp compiler required for hsnwlib

# RUN wget http://hgdownload.cse.ucsc.edu/admin/exe/linux.x86_64/bigBedToBed -P /usr/local/bin
# RUN wget http://hgdownload.cse.ucsc.edu/admin/exe/linux.x86_64/bedIntersect -P /usr/local/bin
# RUN chmod 755 /usr/local/bin/bigBedToBed /usr/local/bin/bedIntersect

RUN pip install --upgrade pip
# Install CPU-only pytorch, eliminating huge nvidia dependencies
RUN pip install torch==2.1.0+cpu -f https://download.pytorch.org/whl/torch_stable.html
RUN pip install https://github.com/pepkit/pipestat/archive/refs/heads/dev.zip

RUN pip install sqlmodel  # to be removed after https://github.com/pepkit/pipestat/issues/117 
RUN pip install psycopg2-binary  # to be removed after https://github.com/pepkit/pipestat/issues/117 
RUN pip install "pydantic>=1.10.7,<2.0.0"  # to be removed after https://github.com/pepkit/pipestat/issues/117 


COPY . /app
RUN pip install -r requirements/requirements-all.txt
RUN pip install .

# RUN pip install --upgrade "tokenizers>=0.14,<0.15"  # to be removed after https://github.com/databio/bbconf/issues/35
# RUN pip install --upgrade "biocframe==0.4.1"  # https://github.com/BiocPy/GenomicRanges/issues/41
