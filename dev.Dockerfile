FROM python:3.13-slim
LABEL authors="Oleksandr Khoroshevskyi, Nathan Sheffield"

# gcc/build-essential/python3-dev: hnswlib build (geniml); libpq-dev: postgres; git: git deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends gcc build-essential python3-dev libpq-dev git \
 && rm -rf /var/lib/apt/lists/*

ENV HNSWLIB_NO_NATIVE=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN pip install --no-cache-dir --upgrade pip uv

WORKDIR /app
# Install deps before copying the full source so the dep layer caches
COPY pyproject.toml /app/pyproject.toml
RUN uv pip install torch --index-url https://download.pytorch.org/whl/cpu --system --no-cache-dir --compile-bytecode

# Install dependencies only (from pyproject.toml), NOT bedhost itself: the app
# runs from the /app source tree copied below (uvicorn bedhost.main:app), and
# the version is read from bedhost/_version.py, so bedhost is intentionally not
# installed as a distribution here.
RUN uv pip install -r pyproject.toml --system --no-cache-dir --compile-bytecode

COPY . /app
RUN python -m compileall -q /app/bedhost

# Unprivileged runtime user. /app and site-packages stay root-owned (read-only to the app).
RUN useradd --system --uid 10001 --user-group --create-home --home-dir /home/bedhost --shell /usr/sbin/nologin bedhost
ENV HOME=/home/bedhost \
    HF_HOME=/home/bedhost/.cache/huggingface \
    FASTEMBED_CACHE_PATH=/home/bedhost/.cache/fastembed \
    NUMBA_CACHE_DIR=/home/bedhost/.cache/numba
USER bedhost

EXPOSE 8000
CMD ["uvicorn", "bedhost.main:app", "--host", "0.0.0.0", "--port", "8000"]
