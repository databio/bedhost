# Local dev environment

Runs bedhost against a throwaway local Postgres, with ML, Qdrant, and S3 turned off.
Commands assume a venv at the repo root (`.venv`) with bedhost and bbconf installed.

1. Start Postgres (host port 15443), from this directory:

   ```
   docker compose up
   ```

2. Create the tables, from the repo root (expects bbconf cloned next to bedhost):

   ```
   .venv/bin/alembic -c deployment/dev/alembic.dev.ini upgrade head
   ```

3. Optional: add fake usage data, from the repo root:

   ```
   .venv/bin/python deployment/dev/seed_usage.py
   ```

4. Start the API on port 8104, from this directory:

   ```
   source dev.env
   ../../.venv/bin/uvicorn bedhost.main:app --host 127.0.0.1 --port 8104
   ```

`bedbase-remote.yaml` points a read-only server at the production database instead.
It needs production credentials in the environment and never runs migrations.
