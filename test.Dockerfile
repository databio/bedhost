FROM bedhost

COPY config.yaml /bedbase.yaml
ENV BEDBASE_CONFIG=/bedbase.yaml

RUN mkdir -p /data/outputs/bedstat_output
RUN mkdir -p /data/outputs/bedbuncher_output

ENTRYPOINT ["uvicorn", "bedhost.main:app", "--host", "0.0.0.0", "--port", "80"]