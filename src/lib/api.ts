import type {
  AuthSession,
  HealthResponse,
  ImportResponse,
  LoginResponse,
  Student,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const SESSION_STORAGE_KEY = 'class_platform_session';

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function readSessionFrom(storage: Storage, storageType: AuthSession['storage']): AuthSession | null {
  const raw = storage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as LoginResponse;
    if (!parsed.accessToken || !parsed.expiresAt || !parsed.username) {
      storage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      storage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return { ...parsed, storage: storageType };
  } catch {
    storage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function readStoredSession(): AuthSession | null {
  return readSessionFrom(localStorage, 'local') ?? readSessionFrom(sessionStorage, 'session');
}

export function storeSession(session: LoginResponse, remember: boolean): AuthSession {
  clearStoredSession();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return { ...session, storage: remember ? 'local' : 'session' };
}

export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const session = readStoredSession();
  const headers = new Headers(init?.headers);
  const hasBody = init?.body !== undefined && init.body !== null;

  if (hasBody && !(init?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (session) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'detail' in payload &&
      typeof payload.detail === 'string'
        ? payload.detail
        : `请求失败（${response.status}）`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health');
}

export function login(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getStudents(): Promise<Student[]> {
  return apiRequest<Student[]>('/students');
}

export function createStudent(student: Student): Promise<Student> {
  return apiRequest<Student>('/students', {
    method: 'POST',
    body: JSON.stringify(student),
  });
}

export function updateStudent(studentId: string, student: Student): Promise<Student> {
  const { id: _id, ...payload } = student;
  return apiRequest<Student>(`/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteStudent(studentId: string): Promise<void> {
  await apiRequest(`/students/${studentId}`, {
    method: 'DELETE',
  });
}

export function importStudents(students: Student[]): Promise<ImportResponse> {
  return apiRequest<ImportResponse>('/students/import', {
    method: 'POST',
    body: JSON.stringify({ students }),
  });
}
