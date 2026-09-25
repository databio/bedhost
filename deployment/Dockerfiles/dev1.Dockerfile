# The deploy workflow passes BASE_IMAGE built from this checkout's Dockerfile,
# so a deploy never depends on what was last published to Docker Hub.
ARG BASE_IMAGE=databio/bedhost:dev
FROM ${BASE_IMAGE}

COPY deployment/config/api-dev.bedbase.org.yaml /bedbase.yaml
ENV BEDBASE_CONFIG=/bedbase.yaml
