class BedHostException(Exception):
    """Base error type for bedhost custom errors."""

    def __init__(self, msg):
        super(BedHostException, self).__init__(msg)


class IncorrectSchemaException(BedHostException):
    """
    Exception raised for errors in the pipestat input schema.
    """
    def __init__(self, msg=""):
        super().__init__(f"""Incorrect schema. {msg}""")
