class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource} '{resource_id}' not found.",
            status_code=404,
        )


class InvalidFileError(AppError):
    def __init__(self, message: str):
        super().__init__(message=message, status_code=422)


class AIParsingError(AppError):
    def __init__(self, message: str):
        super().__init__(message=message, status_code=502)