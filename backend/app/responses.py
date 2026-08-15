from typing import Any, Optional, List

from fastapi.responses import JSONResponse


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
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": message, "statusCode": status_code},
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
