class BedHostException(Exception):
    """Base error type for bedhost custom errors."""

    def __init__(self, msg):
        super(BedHostException, self).__init__(msg)


class IncorrectSchemaException(BedHostException):
    def __init__(self, msg=""):
        super().__init__(f"""Incorrect schema. {msg}""")
