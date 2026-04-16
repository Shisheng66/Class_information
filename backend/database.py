from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


GENDER_MALE = "\u7537"
GENDER_FEMALE = "\u5973"

SEED_STUDENTS = [
    {
        "id": "20230101",
        "name": "\u5f20\u4f1f",
        "gender": GENDER_MALE,
        "grade": "2023\u7ea7",
        "age": 19,
        "phone": "13812345678",
        "address": "\u5317\u4eac\u5e02\u6d77\u6dc0\u533a\u4e2d\u5173\u6751\u5927\u88571\u53f7",
        "enrollmentDate": "2023-09-01",
    },
    {
        "id": "20220102",
        "name": "\u738b\u82b3",
        "gender": GENDER_FEMALE,
        "grade": "2022\u7ea7",
        "age": 20,
        "phone": "13987654321",
        "address": "\u4e0a\u6d77\u5e02\u6d66\u4e1c\u65b0\u533a\u4e16\u7eaa\u5927\u9053100\u53f7",
        "enrollmentDate": "2022-09-01",
    },
    {
        "id": "20230103",
        "name": "\u674e\u5a1c",
        "gender": GENDER_FEMALE,
        "grade": "2023\u7ea7",
        "age": 19,
        "phone": "13700000000",
        "address": "\u5e7f\u5dde\u5e02\u5929\u6cb3\u533a\u5929\u6cb3\u8def88\u53f7",
        "enrollmentDate": "2023-09-02",
    },
    {
        "id": "20210104",
        "name": "\u8d75\u5f3a",
        "gender": GENDER_MALE,
        "grade": "2021\u7ea7",
        "age": 21,
        "phone": "13611112222",
        "address": "\u6df1\u5733\u5e02\u5357\u5c71\u533a\u6df1\u5357\u5927\u9053188\u53f7",
        "enrollmentDate": "2021-09-01",
    },
]

SEED_BY_ID = {student["id"]: student for student in SEED_STUDENTS}

SORT_COLUMN_MAP = {
    "id": "id",
    "name": "name",
    "grade": "grade",
    "age": "age",
    "enrollmentDate": "enrollment_date",
}


def get_database_path() -> Path:
    configured_path = os.getenv("CLASS_DB_PATH")
    if configured_path:
        return Path(configured_path)
    return Path(__file__).resolve().parent / "data" / "class_information.db"


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_gender(value: str | None) -> str:
    if value == GENDER_FEMALE:
        return GENDER_FEMALE
    return GENDER_MALE


def _normalize_grade(value: str | None) -> str:
    if not value:
        return ""
    digits = "".join(character for character in value if character.isdigit())
    return f"{digits[:4]}\u7ea7" if len(digits) >= 4 else value


def _normalize_student_payload(student: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(student)
    seed = SEED_BY_ID.get(str(normalized.get("id", "")))

    normalized["gender"] = _normalize_gender(str(normalized.get("gender", "")))
    normalized["grade"] = _normalize_grade(str(normalized.get("grade", "")))

    if seed:
        for key in ("name", "gender", "grade", "address"):
            normalized[key] = seed[key]

    return normalized


def _table_schema_is_legacy(connection: sqlite3.Connection) -> bool:
    row = connection.execute(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'students'"
    ).fetchone()
    if row is None or row["sql"] is None:
        return False
    return GENDER_MALE not in row["sql"] or GENDER_FEMALE not in row["sql"]


def _create_students_table(connection: sqlite3.Connection, table_name: str) -> None:
    connection.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            gender TEXT NOT NULL CHECK (gender IN ('{GENDER_MALE}', '{GENDER_FEMALE}')),
            grade TEXT NOT NULL,
            age INTEGER NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            enrollment_date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )


def _migrate_legacy_students_table(connection: sqlite3.Connection) -> None:
    _create_students_table(connection, "students_new")
    rows = connection.execute(
        """
        SELECT id, name, gender, grade, age, phone, address, enrollment_date, created_at, updated_at
        FROM students
        """
    ).fetchall()

    for row in rows:
        payload = _normalize_student_payload(
            {
                "id": row["id"],
                "name": row["name"],
                "gender": row["gender"],
                "grade": row["grade"],
                "age": row["age"],
                "phone": row["phone"],
                "address": row["address"],
                "enrollmentDate": row["enrollment_date"],
            }
        )
        connection.execute(
            """
            INSERT OR REPLACE INTO students_new (
                id, name, gender, grade, age, phone, address, enrollment_date, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload["id"],
                payload["name"],
                payload["gender"],
                payload["grade"],
                payload["age"],
                payload["phone"],
                payload["address"],
                payload["enrollmentDate"],
                row["created_at"],
                row["updated_at"],
            ),
        )

    connection.execute("DROP TABLE students")
    connection.execute("ALTER TABLE students_new RENAME TO students")


def _row_to_student(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return _normalize_student_payload(
        {
            "id": row["id"],
            "name": row["name"],
            "gender": row["gender"],
            "grade": row["grade"],
            "age": row["age"],
            "phone": row["phone"],
            "address": row["address"],
            "enrollmentDate": row["enrollmentDate"],
        }
    )


@contextmanager
def get_connection() -> sqlite3.Connection:
    database_path = get_database_path()
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
    finally:
        connection.close()


def initialize_database() -> None:
    with get_connection() as connection:
        _create_students_table(connection, "students")
        if _table_schema_is_legacy(connection):
            _migrate_legacy_students_table(connection)

        total_students = connection.execute("SELECT COUNT(*) AS count FROM students").fetchone()["count"]
        if total_students == 0:
            now = _utcnow_iso()
            connection.executemany(
                """
                INSERT INTO students (
                    id, name, gender, grade, age, phone, address, enrollment_date, created_at, updated_at
                )
                VALUES (:id, :name, :gender, :grade, :age, :phone, :address, :enrollmentDate, :created_at, :updated_at)
                """,
                [{**student, "created_at": now, "updated_at": now} for student in SEED_STUDENTS],
            )
        else:
            for seed in SEED_STUDENTS:
                connection.execute(
                    """
                    UPDATE students
                    SET name = ?, gender = ?, grade = ?, address = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        seed["name"],
                        seed["gender"],
                        seed["grade"],
                        seed["address"],
                        _utcnow_iso(),
                        seed["id"],
                    ),
                )

        connection.commit()


def list_students(
    *,
    search: str | None = None,
    gender: str | None = None,
    grade: str | None = None,
    sort_by: str = "id",
    sort_direction: str = "asc",
) -> list[dict[str, Any]]:
    sql = [
        """
        SELECT
            id,
            name,
            gender,
            grade,
            age,
            phone,
            address,
            enrollment_date AS enrollmentDate
        FROM students
        """
    ]
    parameters: list[Any] = []
    where_clauses: list[str] = []

    if search:
        search_term = f"%{search.strip()}%"
        where_clauses.append("(id LIKE ? OR name LIKE ?)")
        parameters.extend([search_term, search_term])
    if gender:
        where_clauses.append("gender = ?")
        parameters.append(_normalize_gender(gender))
    if grade:
        where_clauses.append("grade = ?")
        parameters.append(_normalize_grade(grade.strip()))

    if where_clauses:
        sql.append("WHERE " + " AND ".join(where_clauses))

    sort_column = SORT_COLUMN_MAP.get(sort_by, "id")
    direction = "DESC" if sort_direction.lower() == "desc" else "ASC"
    sql.append(f"ORDER BY {sort_column} {direction}, id ASC")

    with get_connection() as connection:
        rows = connection.execute("\n".join(sql), parameters).fetchall()
    return [_row_to_student(row) for row in rows]


def get_student(student_id: str) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT
                id,
                name,
                gender,
                grade,
                age,
                phone,
                address,
                enrollment_date AS enrollmentDate
            FROM students
            WHERE id = ?
            """,
            (student_id,),
        ).fetchone()
    return _row_to_student(row)


def create_student(student: dict[str, Any]) -> dict[str, Any]:
    payload = _normalize_student_payload(student)
    now = _utcnow_iso()
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO students (
                id, name, gender, grade, age, phone, address, enrollment_date, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload["id"],
                payload["name"],
                payload["gender"],
                payload["grade"],
                payload["age"],
                payload["phone"],
                payload["address"],
                payload["enrollmentDate"],
                now,
                now,
            ),
        )
        connection.commit()

    created_student = get_student(payload["id"])
    if created_student is None:
        raise RuntimeError("\u521b\u5efa\u5b66\u751f\u8bb0\u5f55\u540e\u672a\u80fd\u8bfb\u53d6\u5230\u6570\u636e\u3002")
    return created_student


def update_student(student_id: str, student: dict[str, Any]) -> dict[str, Any] | None:
    payload = _normalize_student_payload({**student, "id": student_id})
    now = _utcnow_iso()
    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE students
            SET
                name = ?,
                gender = ?,
                grade = ?,
                age = ?,
                phone = ?,
                address = ?,
                enrollment_date = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                payload["name"],
                payload["gender"],
                payload["grade"],
                payload["age"],
                payload["phone"],
                payload["address"],
                payload["enrollmentDate"],
                now,
                student_id,
            ),
        )
        connection.commit()

    if cursor.rowcount == 0:
        return None
    return get_student(student_id)


def delete_student(student_id: str) -> bool:
    with get_connection() as connection:
        cursor = connection.execute("DELETE FROM students WHERE id = ?", (student_id,))
        connection.commit()
    return cursor.rowcount > 0


def bulk_insert_students(students: list[dict[str, Any]]) -> dict[str, Any]:
    requested = len(students)
    imported = 0
    skipped_ids: list[str] = []
    now = _utcnow_iso()

    with get_connection() as connection:
        existing_ids = {row["id"] for row in connection.execute("SELECT id FROM students").fetchall()}

        payload = []
        for student in students:
            normalized = _normalize_student_payload(student)
            student_id = normalized["id"]
            if student_id in existing_ids:
                skipped_ids.append(student_id)
                continue

            payload.append(
                (
                    normalized["id"],
                    normalized["name"],
                    normalized["gender"],
                    normalized["grade"],
                    normalized["age"],
                    normalized["phone"],
                    normalized["address"],
                    normalized["enrollmentDate"],
                    now,
                    now,
                )
            )
            existing_ids.add(student_id)

        if payload:
            connection.executemany(
                """
                INSERT INTO students (
                    id, name, gender, grade, age, phone, address, enrollment_date, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                payload,
            )
            imported = len(payload)

        connection.commit()

    return {
        "requested": requested,
        "imported": imported,
        "skipped": requested - imported,
        "skippedIds": skipped_ids,
    }
