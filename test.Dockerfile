FROM bedhost

COPY config.yaml /config.yaml
ENV BEDBASE_CONFIG=/config.yaml

RUN mkdir -p /data/outputs/bedstat_output
RUN mkdir -p /data/outputs/bedbuncher_output

ENTRYPOINT ["uvicorn", "bedhost.main:app", "--host", "0.0.0.0", "--port", "80"]