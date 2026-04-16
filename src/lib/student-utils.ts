import type { Student, StudentFormErrors, StudentStats } from '../types';

const TEXT = {
  male: '\u7537',
  female: '\u5973',
  gradeSuffix: '\u7ea7',
  studentId: '\u5b66\u53f7',
  name: '\u59d3\u540d',
  gender: '\u6027\u522b',
  grade: '\u5e74\u7ea7',
  age: '\u5e74\u9f84',
  phone: '\u8054\u7cfb\u7535\u8bdd',
  address: '\u5bb6\u5ead\u4f4f\u5740',
  enrollmentDate: '\u5165\u6821\u65e5\u671f',
  idRequired: '\u5b66\u53f7\u4e0d\u80fd\u4e3a\u7a7a\u3002',
  idInvalid: '\u5b66\u53f7\u9700\u4e3a 4 \u5230 12 \u4f4d\u5b57\u6bcd\u6216\u6570\u5b57\u3002',
  idExists: '\u8be5\u5b66\u53f7\u5df2\u5b58\u5728\u3002',
  nameRequired: '\u59d3\u540d\u4e0d\u80fd\u4e3a\u7a7a\u3002',
  nameTooShort: '\u59d3\u540d\u81f3\u5c11\u9700\u8981 2 \u4e2a\u5b57\u7b26\u3002',
  phoneRequired: '\u8054\u7cfb\u7535\u8bdd\u4e0d\u80fd\u4e3a\u7a7a\u3002',
  phoneInvalid: '\u8bf7\u8f93\u5165\u6709\u6548\u7684 11 \u4f4d\u624b\u673a\u53f7\u3002',
  ageInvalid: '\u5e74\u9f84\u5fc5\u987b\u5728 1 \u5230 100 \u4e4b\u95f4\u3002',
  addressRequired: '\u5bb6\u5ead\u4f4f\u5740\u4e0d\u80fd\u4e3a\u7a7a\u3002',
  addressTooShort: '\u5bb6\u5ead\u4f4f\u5740\u81f3\u5c11\u9700\u8981 5 \u4e2a\u5b57\u7b26\u3002',
  enrollmentDateRequired: '\u5165\u6821\u65e5\u671f\u4e0d\u80fd\u4e3a\u7a7a\u3002',
  jsonArrayRequired: 'JSON \u5185\u5bb9\u5fc5\u987b\u662f\u5b66\u751f\u5bf9\u8c61\u6570\u7ec4\u3002',
  fileTypeUnsupported: '\u4ec5\u652f\u6301\u5bfc\u5165 CSV \u6216 JSON \u6587\u4ef6\u3002',
  exportFileName: '\u5b66\u751f\u4fe1\u606f',
  maleLabel: '\u7537\u751f',
  femaleLabel: '\u5973\u751f',
} as const;

export const GRADES = ['2024\u7ea7', '2023\u7ea7', '2022\u7ea7', '2021\u7ea7'];

const HEADER_KEY_MAP: Record<string, keyof Student> = {
  [TEXT.studentId]: 'id',
  id: 'id',
  [TEXT.name]: 'name',
  name: 'name',
  [TEXT.gender]: 'gender',
  gender: 'gender',
  [TEXT.grade]: 'grade',
  grade: 'grade',
  [TEXT.age]: 'age',
  age: 'age',
  [TEXT.phone]: 'phone',
  phone: 'phone',
  [TEXT.address]: 'address',
  address: 'address',
  [TEXT.enrollmentDate]: 'enrollmentDate',
  enrollmentDate: 'enrollmentDate',
};

export function getDefaultStudent(): Student {
  return {
    id: '',
    name: '',
    gender: TEXT.male,
    grade: GRADES[0],
    age: 18,
    phone: '',
    address: '',
    enrollmentDate: new Date().toISOString().slice(0, 10),
  };
}

export function validateStudent(
  student: Student,
  existingIds: Set<string>,
  currentId?: string,
): StudentFormErrors {
  const errors: StudentFormErrors = {};

  if (!student.id) {
    errors.id = TEXT.idRequired;
  } else if (!/^[A-Za-z0-9]{4,12}$/.test(student.id)) {
    errors.id = TEXT.idInvalid;
  } else if (student.id !== currentId && existingIds.has(student.id)) {
    errors.id = TEXT.idExists;
  }

  if (!student.name.trim()) {
    errors.name = TEXT.nameRequired;
  } else if (student.name.trim().length < 2) {
    errors.name = TEXT.nameTooShort;
  }

  if (!student.phone) {
    errors.phone = TEXT.phoneRequired;
  } else if (!/^1[3-9]\d{9}$/.test(student.phone)) {
    errors.phone = TEXT.phoneInvalid;
  }

  if (!Number.isInteger(student.age) || student.age < 1 || student.age > 100) {
    errors.age = TEXT.ageInvalid;
  }

  if (!student.address.trim()) {
    errors.address = TEXT.addressRequired;
  } else if (student.address.trim().length < 5) {
    errors.address = TEXT.addressTooShort;
  }

  if (!student.enrollmentDate) {
    errors.enrollmentDate = TEXT.enrollmentDateRequired;
  }

  return errors;
}

export function getStudentStats(students: Student[]): StudentStats {
  const total = students.length;
  const male = students.filter((student) => student.gender === TEXT.male).length;
  const female = students.filter((student) => student.gender === TEXT.female).length;
  const averageAge = total
    ? Number((students.reduce((sum, student) => sum + student.age, 0) / total).toFixed(1))
    : 0;

  const gradeMap = new Map<string, number>();
  GRADES.forEach((grade) => gradeMap.set(grade, 0));
  students.forEach((student) => {
    gradeMap.set(student.grade, (gradeMap.get(student.grade) || 0) + 1);
  });

  return {
    total,
    male,
    female,
    averageAge,
    genderDistribution: [
      { name: TEXT.maleLabel, value: male },
      { name: TEXT.femaleLabel, value: female },
    ],
    gradeDistribution: Array.from(gradeMap.entries())
      .sort((left, right) => right[0].localeCompare(left[0], 'zh-CN'))
      .map(([name, count]) => ({ name, count })),
  };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeGender(value: string): Student['gender'] {
  const normalized = value.trim().toLowerCase();
  return normalized === TEXT.female || normalized === 'female' ? TEXT.female : TEXT.male;
}

function normalizeGrade(value: string): string {
  const matchedYear = value.match(/\d{4}/);
  return matchedYear ? `${matchedYear[0]}${TEXT.gradeSuffix}` : value.trim();
}

function normalizeStudentRecord(record: Record<string, unknown>): Student | null {
  const draft = getDefaultStudent();

  for (const [rawKey, rawValue] of Object.entries(record)) {
    const normalizedKey = rawKey.trim();
    const key = HEADER_KEY_MAP[normalizedKey] ?? HEADER_KEY_MAP[normalizedKey.toLowerCase()];
    if (!key) {
      continue;
    }

    if (key === 'age') {
      draft.age = Number(rawValue) || 0;
      continue;
    }

    if (key === 'gender') {
      draft.gender = normalizeGender(String(rawValue ?? ''));
      continue;
    }

    if (key === 'grade') {
      draft.grade = normalizeGrade(String(rawValue ?? ''));
      continue;
    }

    draft[key] = String(rawValue ?? '').trim() as never;
  }

  if (!draft.id || !draft.name) {
    return null;
  }

  return draft;
}

export function parseStudentUpload(fileName: string, content: string): Student[] {
  const normalizedName = fileName.toLowerCase();

  if (normalizedName.endsWith('.json')) {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error(TEXT.jsonArrayRequired);
    }

    return parsed
      .map((item) =>
        typeof item === 'object' && item !== null
          ? normalizeStudentRecord(item as Record<string, unknown>)
          : null,
      )
      .filter((item): item is Student => item !== null);
  }

  if (normalizedName.endsWith('.csv')) {
    const lines = content
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return [];
    }

    const headers = parseCsvLine(lines[0]);

    return lines
      .slice(1)
      .map((line) => {
        const values = parseCsvLine(line);
        const row = headers.reduce<Record<string, unknown>>((accumulator, header, index) => {
          accumulator[header] = values[index] ?? '';
          return accumulator;
        }, {});
        return normalizeStudentRecord(row);
      })
      .filter((item): item is Student => item !== null);
  }

  throw new Error(TEXT.fileTypeUnsupported);
}

export function downloadStudentsAsCsv(students: Student[]): void {
  const headers = [
    TEXT.studentId,
    TEXT.name,
    TEXT.gender,
    TEXT.grade,
    TEXT.age,
    TEXT.phone,
    TEXT.address,
    TEXT.enrollmentDate,
  ];

  const rows = students.map((student) =>
    [
      student.id,
      student.name,
      student.gender,
      student.grade,
      student.age.toString(),
      student.phone,
      student.address.replace(/"/g, '""'),
      student.enrollmentDate,
    ]
      .map((value) => `"${value}"`)
      .join(','),
  );

  const csvContent = [`\uFEFF${headers.join(',')}`, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${TEXT.exportFileName}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
