from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


Gender = Literal["\u7537", "\u5973"]
SortBy = Literal["id", "name", "grade", "age", "enrollmentDate"]
SortDirection = Literal["asc", "desc"]


class AppBaseModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)


class LoginRequest(AppBaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=100)


class LoginResponse(AppBaseModel):
    accessToken: str
    username: str
    expiresAt: str


class CurrentUserResponse(AppBaseModel):
    username: str


class HealthResponse(AppBaseModel):
    status: str
    database: str
    version: str


class StudentBase(AppBaseModel):
    name: str = Field(min_length=2, max_length=50)
    gender: Gender
    grade: str = Field(min_length=2, max_length=20)
    age: int = Field(ge=1, le=100)
    phone: str = Field(pattern=r"^1[3-9]\d{9}$")
    address: str = Field(min_length=5, max_length=255)
    enrollmentDate: str

    @field_validator("enrollmentDate")
    @classmethod
    def validate_enrollment_date(cls, value: str) -> str:
        date.fromisoformat(value)
        return value


class StudentCreate(StudentBase):
    id: str = Field(pattern=r"^[A-Za-z0-9]{4,12}$")


class StudentUpdate(StudentBase):
    pass


class Student(StudentCreate):
    pass


class ImportRequest(AppBaseModel):
    students: list[StudentCreate]


class ImportResponse(AppBaseModel):
    requested: int
    imported: int
    skipped: int
    skippedIds: list[str]


class GradeDistribution(AppBaseModel):
    name: str
    count: int


class StudentStats(AppBaseModel):
    total: int
    male: int
    female: int
    averageAge: float
    gradeDistribution: list[GradeDistribution]
