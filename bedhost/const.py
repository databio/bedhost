import os

PKG_NAME = "bedhost"

TEMPLATES_DIRNAME = "templates"
STATIC_DIRNAME = "../docs"
STATIC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), STATIC_DIRNAME)

EXAMPLE_BED = "bbad85f21962bb8d972444f7f9a3a932"
EXAMPLE_BEDSET = "gse218680"

# how often to save usage data (in hours)
USAGE_SAVE_HOURS = 1
# For how many days record usage data (every month this will be reset)
USAGE_RECORD_DAYS = 30


MAX_FILE_SIZE = 1024 * 1024 * 2
MAX_REGION_NUMBER = 5000000
MIN_REGION_WIDTH = 10
