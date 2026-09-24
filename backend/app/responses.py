import logging

from typing import Any, Optional, List

from fastapi.responses import JSONResponse

logger = logging.getLogger("gym-app")


def success_response(
    data: Any = None,
    message: str = "Success",
    meta: Optional[dict] = None,
) -> dict:
    result = {"success": True, "message": message}
    if data is not None:
        result["data"] = data
    if meta is not None:
        result["meta"] = meta
    return result


def error_response(message: str = "Error", status_code: int = 400):
    logger.error("API error %s: %s", status_code, message)
    return JSONResponse(
        status_code=status_code,
        # "message" mirrors "error": the frontend ApiResponse type reads message.
        content={"success": False, "error": message, "message": message, "statusCode": status_code},
    )


def paginated_response(
    data: List,
    total: int,
    page: int,
    page_size: int,
    message: str = "Success",
) -> dict:
    return {
        "success": True,
        "message": message,
        "data": data,
        "meta": {
            "page": page,
            "pageSize": page_size,
            "total": total,
            "totalPages": (total + page_size - 1) // page_size if page_size > 0 else 0,
        },
    }


def log_exception(exc: Exception, request_path: str = "") -> None:
    """Log an exception with context for debugging."""
    logger.exception("Unhandled exception on %s: %s", request_path, exc)
