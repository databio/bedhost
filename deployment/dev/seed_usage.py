"""Seed synthetic usage rows into the local dev bedbase Postgres.

Inserts >20 distinct usage_files rows (to prove the /v1/usage endpoint is not
capped at the top 20) spread across three date windows (to exercise the
date_from/date_to filter).

usage_bed_meta / usage_bedset_meta are left empty on purpose: their key columns
are foreign keys into the bed / bedsets tables, so seeding them would require
first creating real BED records. usage_files has no such constraint and is
enough to exercise the new endpoint.

Run with the dev venv, from the bedhost repo:
    .venv/bin/python deployment/dev/seed_usage.py
"""

import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from bbconf.db_utils import Base, UsageFiles

DB_URL = "postgresql+psycopg://bedbase:bedbase@127.0.0.1:15443/bedbase"

# Three non-overlapping monthly windows.
WINDOWS = [
    (datetime.datetime(2026, 1, 1), datetime.datetime(2026, 1, 31)),
    (datetime.datetime(2026, 2, 1), datetime.datetime(2026, 2, 28)),
    (datetime.datetime(2026, 3, 1), datetime.datetime(2026, 3, 31)),
]


def main() -> None:
    engine = create_engine(DB_URL)
    # Idempotent: make sure the schema exists (migrations also create it).
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        # Clear any prior synthetic seed rows so re-running is idempotent.
        session.query(UsageFiles).delete()
        session.commit()

        files = []
        # 25 distinct file keys => proves no top-20 cap on `type=files`.
        for i in range(25):
            date_from, date_to = WINDOWS[i % len(WINDOWS)]
            files.append(
                UsageFiles(
                    file_path=f"s3://bedbase/files/GSM{1000 + i:04d}.bed.gz",
                    count=(i + 1) * 3,
                    date_from=date_from,
                    date_to=date_to,
                )
            )
        session.add_all(files)
        session.commit()

        n_files = session.query(UsageFiles).count()
        print(f"Seeded {n_files} usage_files rows.")


if __name__ == "__main__":
    main()
