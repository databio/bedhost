FROM bedhost

COPY config.yaml /bedbase.yaml
ENV BEDBASE_CONFIG=/bedbase.yaml
