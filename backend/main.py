from __future__ import annotations

import sqlite3
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from backend.auth import build_expiration_time, create_access_token, get_current_username, verify_credentials
from backend.database import (
    GENDER_FEMALE,
    GENDER_MALE,
    bulk_insert_students,
    create_student,
    delete_student,
    get_database_path,
    get_student,
    initialize_database,
    list_students,
    update_student,
)
from backend.schemas import (
    CurrentUserResponse,
    HealthResponse,
    ImportRequest,
    ImportResponse,
    LoginRequest,
    LoginResponse,
    SortBy,
    SortDirection,
    Student,
    StudentCreate,
    StudentStats,
    StudentUpdate,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Class Information Platform API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def build_student_stats(students: list[dict[str, object]]) -> StudentStats:
    total = len(students)
    male = sum(1 for student in students if student["gender"] == GENDER_MALE)
    female = sum(1 for student in students if student["gender"] == GENDER_FEMALE)
    average_age = round(sum(int(student["age"]) for student in students) / total, 1) if total else 0.0

    grade_map: dict[str, int] = {}
    for student in students:
        grade = str(student["grade"])
        grade_map[grade] = grade_map.get(grade, 0) + 1

    grade_distribution = [{"name": grade, "count": count} for grade, count in sorted(grade_map.items(), key=lambda item: item[0], reverse=True)]
    return StudentStats(total=total, male=male, female=female, averageAge=average_age, gradeDistribution=grade_distribution)


@app.get("/api/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", database=str(get_database_path()), version=app.version)


@app.post("/api/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    if not verify_credentials(payload.username, payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef\uff0c\u8bf7\u91cd\u65b0\u8f93\u5165\u3002")

    expiration = build_expiration_time()
    return LoginResponse(accessToken=create_access_token(payload.username), username=payload.username, expiresAt=expiration.isoformat())


@app.get("/api/auth/me", response_model=CurrentUserResponse)
def current_user(username: str = Depends(get_current_username)) -> CurrentUserResponse:
    return CurrentUserResponse(username=username)


@app.get("/api/students", response_model=list[Student])
def read_students(
    search: str | None = Query(default=None),
    gender: str | None = Query(default=None),
    grade: str | None = Query(default=None),
    sortBy: SortBy = Query(default="id"),
    sortDirection: SortDirection = Query(default="asc"),
    _: str = Depends(get_current_username),
) -> list[Student]:
    return [Student.model_validate(student) for student in list_students(search=search, gender=gender, grade=grade, sort_by=sortBy, sort_direction=sortDirection)]


@app.get("/api/students/stats", response_model=StudentStats)
def read_student_stats(_: str = Depends(get_current_username)) -> StudentStats:
    return build_student_stats(list_students())


@app.get("/api/students/{student_id}", response_model=Student)
def read_student(student_id: str, _: str = Depends(get_current_username)) -> Student:
    student = get_student(student_id)
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="\u672a\u627e\u5230\u5bf9\u5e94\u7684\u5b66\u751f\u4fe1\u606f\u3002")
    return Student.model_validate(student)


@app.post("/api/students", response_model=Student, status_code=status.HTTP_201_CREATED)
def create_student_record(payload: StudentCreate, _: str = Depends(get_current_username)) -> Student:
    try:
        student = create_student(payload.model_dump())
    except sqlite3.IntegrityError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="\u8be5\u5b66\u53f7\u5df2\u5b58\u5728\uff0c\u65e0\u6cd5\u91cd\u590d\u521b\u5efa\u3002") from error
    return Student.model_validate(student)


@app.put("/api/students/{student_id}", response_model=Student)
def update_student_record(student_id: str, payload: StudentUpdate, _: str = Depends(get_current_username)) -> Student:
    student = update_student(student_id, payload.model_dump())
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="\u672a\u627e\u5230\u8981\u66f4\u65b0\u7684\u5b66\u751f\u4fe1\u606f\u3002")
    return Student.model_validate(student)


@app.delete("/api/students/{student_id}", status_code=status.HTTP_200_OK)
def delete_student_record(student_id: str, _: str = Depends(get_current_username)) -> dict[str, bool]:
    if not delete_student(student_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="\u672a\u627e\u5230\u8981\u5220\u9664\u7684\u5b66\u751f\u4fe1\u606f\u3002")
    return {"ok": True}


@app.post("/api/students/import", response_model=ImportResponse)
def import_student_records(payload: ImportRequest, _: str = Depends(get_current_username)) -> ImportResponse:
    result = bulk_insert_students([student.model_dump() for student in payload.students])
    return ImportResponse.model_validate(result)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
