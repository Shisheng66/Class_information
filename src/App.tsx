import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Download,
  Eye,
  Filter,
  LogOut,
  PencilLine,
  QrCode,
  Search,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { LoginScreen } from './components/LoginScreen';
import { QrCodeModal } from './components/QrCodeModal';
import { StudentFormModal } from './components/StudentFormModal';
import {
  ApiError,
  clearStoredSession,
  createStudent,
  deleteStudent,
  getHealth,
  getStudents,
  importStudents,
  login,
  readStoredSession,
  storeSession,
  updateStudent,
} from './lib/api';
import { downloadStudentsAsCsv, getDefaultStudent, getStudentStats, parseStudentUpload, validateStudent } from './lib/student-utils';
import type { AuthSession, Gender, SortKey, Student, StudentFormErrors } from './types';

const DashboardView = lazy(() => import('./components/DashboardView'));

type TabKey = 'dashboard' | 'students';
type Notice = { tone: 'success' | 'error'; message: string };

const TEXT = {
  male: '\u7537',
  female: '\u5973',
  title: '\u73ed\u7ea7\u4fe1\u606f\u7ba1\u7406\u5e73\u53f0',
  dashboard: '\u6570\u636e\u770b\u677f',
  students: '\u5b66\u751f\u7ba1\u7406',
  logout: '\u9000\u51fa',
  backendOnline: '\u5728\u7ebf',
  backendOffline: '\u79bb\u7ebf',
  backendChecking: '\u68c0\u67e5\u4e2d',
  loadingStudents: '\u6b63\u5728\u52a0\u8f7d\u5b66\u751f\u6570\u636e...',
  loadingDashboard: '\u6b63\u5728\u52a0\u8f7d\u7edf\u8ba1\u770b\u677f...',
  backToList: '\u8fd4\u56de\u5217\u8868',
  age: '\u5e74\u9f84',
  phone: '\u7535\u8bdd',
  enrollmentDate: '\u5165\u6821\u65e5\u671f',
  address: '\u5730\u5740',
  searchPlaceholder: '\u641c\u7d22\u59d3\u540d\u6216\u5b66\u53f7',
  allGenders: '\u5168\u90e8\u6027\u522b',
  allGrades: '\u5168\u90e8\u5e74\u7ea7',
  import: '\u5bfc\u5165',
  export: '\u5bfc\u51fa',
  addStudent: '\u65b0\u589e\u5b66\u751f',
  noExportData: '\u5f53\u524d\u6ca1\u6709\u53ef\u5bfc\u51fa\u7684\u6570\u636e\u3002',
  noStudents: '\u5f53\u524d\u6ca1\u6709\u7b26\u5408\u7b5b\u9009\u6761\u4ef6\u7684\u5b66\u751f\u8bb0\u5f55\u3002',
  sessionExpired: '\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55\u3002',
  loginSuccess: '\u767b\u5f55\u6210\u529f\uff0c\u5df2\u8fde\u63a5\u5230\u540e\u7aef\u6570\u636e\u5e93\u3002',
  loginFailed: '\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002',
  loadStudentsFailed: '\u52a0\u8f7d\u5b66\u751f\u6570\u636e\u5931\u8d25\u3002',
  saveFailed: '\u4fdd\u5b58\u5b66\u751f\u4fe1\u606f\u5931\u8d25\u3002',
  importFailed: '\u5bfc\u5165\u6587\u4ef6\u5931\u8d25\u3002',
  deleteFailed: '\u5220\u9664\u5b66\u751f\u5931\u8d25\u3002',
  studentId: '\u5b66\u53f7',
  name: '\u59d3\u540d',
  gender: '\u6027\u522b',
  grade: '\u5e74\u7ea7',
  actions: '\u64cd\u4f5c',
  viewDetails: '\u67e5\u770b\u8be6\u60c5',
  viewQrCode: '\u67e5\u770b\u4e8c\u7ef4\u7801',
  edit: '\u7f16\u8f91',
  delete: '\u5220\u9664',
};

function sortIcon(activeKey: SortKey, targetKey: SortKey, direction: 'asc' | 'desc') {
  if (activeKey !== targetKey) return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
  return direction === 'asc' ? <ArrowUp className="h-4 w-4 text-blue-600" /> : <ArrowDown className="h-4 w-4 text-blue-600" />;
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(Boolean(session));
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | Gender>('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'id', direction: 'asc' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Student>(() => getDefaultStudent());
  const [formErrors, setFormErrors] = useState<StudentFormErrors>({});
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => getStudentStats(students), [students]);
  const existingIds = useMemo(() => new Set(students.map((student) => student.id)), [students]);
  const gradeOptions = useMemo(() => Array.from(new Set(students.map((student) => student.grade))), [students]);
  const selectedStudent = useMemo(() => students.find((student) => student.id === selectedStudentId) ?? null, [students, selectedStudentId]);

  const filteredStudents = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return [...students]
      .filter((student) => {
        const matchSearch = !keyword || student.name.toLowerCase().includes(keyword) || student.id.toLowerCase().includes(keyword);
        const matchGender = filterGender === 'all' || student.gender === filterGender;
        const matchGrade = filterGrade === 'all' || student.grade === filterGrade;
        return matchSearch && matchGender && matchGrade;
      })
      .sort((left, right) => {
        const leftValue = left[sortConfig.key];
        const rightValue = right[sortConfig.key];
        if (typeof leftValue === 'number' && typeof rightValue === 'number') {
          return sortConfig.direction === 'asc' ? leftValue - rightValue : rightValue - leftValue;
        }
        const comparison = String(leftValue).localeCompare(String(rightValue), 'zh-CN', { numeric: true, sensitivity: 'base' });
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
  }, [students, searchQuery, filterGender, filterGrade, sortConfig]);

  const showError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiError && error.status === 401) {
      clearStoredSession();
      setSession(null);
      setLoginError(TEXT.sessionExpired);
      return;
    }
    setNotice({ tone: 'error', message: error instanceof Error ? error.message : fallbackMessage });
  };

  useEffect(() => {
    void getHealth().then(() => setBackendStatus('online')).catch(() => setBackendStatus('offline'));
  }, []);

  useEffect(() => {
    if (!session) {
      setStudents([]);
      setIsLoadingStudents(false);
      return;
    }
    const loadStudents = async () => {
      setIsLoadingStudents(true);
      try {
        setStudents(await getStudents());
        setNotice(null);
      } catch (error) {
        showError(error, TEXT.loadStudentsFailed);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    void loadStudents();
  }, [session]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);
    try {
      const nextSession = storeSession(await login(loginUsername.trim(), loginPassword), rememberMe);
      setSession(nextSession);
      setLoginUsername('');
      setLoginPassword('');
      setNotice({ tone: 'success', message: TEXT.loginSuccess });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : TEXT.loginFailed);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    const nextData = { ...formData, [name]: name === 'age' ? Number(value) || 0 : value } as Student;
    setFormData(nextData);
    setFormErrors(validateStudent(nextData, existingIds, editingStudentId ?? undefined));
  };

  const handleSaveStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateStudent(formData, existingIds, editingStudentId ?? undefined);
    if (Object.keys(validation).length > 0) {
      setFormErrors(validation);
      return;
    }
    setIsSavingStudent(true);
    try {
      if (editingStudentId) {
        const updated = await updateStudent(editingStudentId, formData);
        setStudents((current) => current.map((student) => (student.id === editingStudentId ? updated : student)));
        setNotice({ tone: 'success', message: `已更新 ${updated.name} 的信息。` });
      } else {
        const created = await createStudent(formData);
        setStudents((current) => [created, ...current]);
        setActiveTab('students');
        setNotice({ tone: 'success', message: `已新增学生 ${created.name}。` });
      }
      setIsFormOpen(false);
      setEditingStudentId(null);
      setFormErrors({});
    } catch (error) {
      showError(error, TEXT.saveFailed);
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!window.confirm(`确定删除 ${student.name}（${student.id}）吗？`)) return;
    try {
      await deleteStudent(student.id);
      setStudents((current) => current.filter((item) => item.id !== student.id));
      if (selectedStudentId === student.id) setSelectedStudentId(null);
      setNotice({ tone: 'success', message: `已删除学生 ${student.name}。` });
    } catch (error) {
      showError(error, TEXT.deleteFailed);
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await importStudents(parseStudentUpload(file.name, await file.text()));
      setStudents(await getStudents());
      setNotice({ tone: 'success', message: result.skipped > 0 ? `导入完成：新增 ${result.imported} 条，跳过 ${result.skipped} 条重复记录。` : `导入完成：成功新增 ${result.imported} 条学生记录。` });
    } catch (error) {
      showError(error, TEXT.importFailed);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!session) {
    return <LoginScreen username={loginUsername} password={loginPassword} rememberMe={rememberMe} error={loginError} isSubmitting={isSubmittingLogin} backendStatus={backendStatus} onSubmit={handleLogin} onUsernameChange={setLoginUsername} onPasswordChange={setLoginPassword} onRememberMeChange={setRememberMe} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">{TEXT.title}</p>
          <h1 className="text-2xl font-bold tracking-tight">React + FastAPI + SQLite</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => { setActiveTab('dashboard'); setSelectedStudentId(null); }} className={`rounded-xl px-4 py-2 text-sm font-medium ${activeTab === 'dashboard' && !selectedStudentId ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{TEXT.dashboard}</button>
          <button type="button" onClick={() => { setActiveTab('students'); setSelectedStudentId(null); }} className={`rounded-xl px-4 py-2 text-sm font-medium ${activeTab === 'students' || selectedStudentId ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{TEXT.students}</button>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">后端：{backendStatus === 'online' ? TEXT.backendOnline : backendStatus === 'offline' ? TEXT.backendOffline : TEXT.backendChecking}</span>
          <button type="button" onClick={() => { clearStoredSession(); setSession(null); }} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"><LogOut className="h-4 w-4" />{TEXT.logout}</button>
        </div>
      </div>

      {notice ? <div className={`mx-auto mt-6 max-w-7xl rounded-2xl border px-4 py-3 text-sm ${notice.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{notice.message}</div> : null}

      <div className="mx-auto mt-6 max-w-7xl">
        {isLoadingStudents ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /><p className="mt-4 text-sm text-slate-500">{TEXT.loadingStudents}</p></div>
        ) : selectedStudent ? (
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <button type="button" onClick={() => setSelectedStudentId(null)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"><ArrowLeft className="h-4 w-4" />{TEXT.backToList}</button>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold">{selectedStudent.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{selectedStudent.id} · {selectedStudent.grade} · {selectedStudent.gender}</p>
                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <p>{TEXT.age}：{selectedStudent.age}</p>
                  <p>{TEXT.phone}：{selectedStudent.phone}</p>
                  <p>{TEXT.enrollmentDate}：{selectedStudent.enrollmentDate}</p>
                  <p>{TEXT.address}：{selectedStudent.address}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setQrStudent(selectedStudent)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"><QrCode className="h-4 w-4" />{TEXT.viewQrCode}</button>
                <button type="button" onClick={() => { setEditingStudentId(selectedStudent.id); setFormData(selectedStudent); setFormErrors({}); setIsFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"><PencilLine className="h-4 w-4" />{TEXT.edit}</button>
                <button type="button" onClick={() => void handleDeleteStudent(selectedStudent)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"><Trash2 className="h-4 w-4" />{TEXT.delete}</button>
              </div>
            </div>
          </div>
        ) : activeTab === 'dashboard' ? (
          <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm"><p className="text-sm text-slate-500">{TEXT.loadingDashboard}</p></div>}><DashboardView stats={stats} /></Suspense>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-1 flex-col gap-3 lg:flex-row">
                  <label className="relative block w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={TEXT.searchPlaceholder} className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600"><Filter className="h-4 w-4 text-slate-400" /><select value={filterGender} onChange={(event) => setFilterGender(event.target.value as 'all' | Gender)} className="bg-transparent outline-none"><option value="all">{TEXT.allGenders}</option><option value={TEXT.male}>{TEXT.male}</option><option value={TEXT.female}>{TEXT.female}</option></select></label>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600"><Filter className="h-4 w-4 text-slate-400" /><select value={filterGrade} onChange={(event) => setFilterGrade(event.target.value)} className="bg-transparent outline-none"><option value="all">{TEXT.allGrades}</option>{gradeOptions.map((grade) => <option key={grade} value={grade}>{grade}</option>)}</select></label>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input ref={fileInputRef} type="file" accept=".csv,.json" className="hidden" onChange={(event) => void handleImportFile(event)} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white"><Upload className="h-4 w-4" />{TEXT.import}</button>
                  <button type="button" onClick={() => { if (filteredStudents.length === 0) { setNotice({ tone: 'error', message: TEXT.noExportData }); return; } downloadStudentsAsCsv(filteredStudents); setNotice({ tone: 'success', message: `已导出 ${filteredStudents.length} 条学生记录。` }); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white"><Download className="h-4 w-4" />{TEXT.export}</button>
                  <button type="button" onClick={() => { setEditingStudentId(null); setFormData(getDefaultStudent()); setFormErrors({}); setIsFormOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"><UserPlus className="h-4 w-4" />{TEXT.addStudent}</button>
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:hidden">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <article key={student.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{student.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{TEXT.studentId}：{student.id}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{student.grade}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{student.gender}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{TEXT.age}：{student.age}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <p>{TEXT.phone}：{student.phone}</p>
                    <p>{TEXT.enrollmentDate}：{student.enrollmentDate}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setSelectedStudentId(student.id)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"><Eye className="h-4 w-4" />{TEXT.viewDetails}</button>
                    <button type="button" onClick={() => setQrStudent(student)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"><QrCode className="h-4 w-4" />{TEXT.viewQrCode}</button>
                    <button type="button" onClick={() => { setEditingStudentId(student.id); setFormData(student); setFormErrors({}); setIsFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"><PencilLine className="h-4 w-4" />{TEXT.edit}</button>
                    <button type="button" onClick={() => void handleDeleteStudent(student)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"><Trash2 className="h-4 w-4" />{TEXT.delete}</button>
                  </div>
                </article>
              )) : <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center text-slate-500 shadow-sm">{TEXT.noStudents}</div>}
            </div>

            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 text-left text-sm text-slate-600">
                    <tr>
                      {[
                        ['id', TEXT.studentId],
                        ['name', TEXT.name],
                        ['grade', TEXT.grade],
                        ['age', TEXT.age],
                        ['enrollmentDate', TEXT.enrollmentDate],
                      ].map(([key, label]) => <th key={key} className="cursor-pointer px-6 py-4 font-medium" onClick={() => setSortConfig((current) => ({ key: key as SortKey, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))}><span className="inline-flex items-center gap-1.5">{label}{sortIcon(sortConfig.key, key as SortKey, sortConfig.direction)}</span></th>)}
                      <th className="px-6 py-4 font-medium">{TEXT.gender}</th>
                      <th className="px-6 py-4 font-medium">{TEXT.phone}</th>
                      <th className="px-6 py-4 font-medium text-right">{TEXT.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{student.id}</td>
                        <td className="px-6 py-4 text-slate-700">{student.name}</td>
                        <td className="px-6 py-4 text-slate-600">{student.grade}</td>
                        <td className="px-6 py-4 text-slate-600">{student.age}</td>
                        <td className="px-6 py-4 text-slate-600">{student.enrollmentDate}</td>
                        <td className="px-6 py-4 text-slate-600">{student.gender}</td>
                        <td className="px-6 py-4 text-slate-600">{student.phone}</td>
                        <td className="px-6 py-4"><div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setQrStudent(student)} className="text-slate-500 transition hover:text-slate-900" aria-label={`${TEXT.viewQrCode}：${student.name}`} title={TEXT.viewQrCode}><QrCode className="h-4 w-4" /></button>
                          <button type="button" onClick={() => setSelectedStudentId(student.id)} className="text-slate-500 transition hover:text-slate-900" aria-label={`${TEXT.viewDetails}：${student.name}`} title={TEXT.viewDetails}><Eye className="h-4 w-4" /></button>
                          <button type="button" onClick={() => { setEditingStudentId(student.id); setFormData(student); setFormErrors({}); setIsFormOpen(true); }} className="text-blue-600 transition hover:text-blue-800" aria-label={`编辑学生：${student.name}`} title={TEXT.edit}><PencilLine className="h-4 w-4" /></button>
                          <button type="button" onClick={() => void handleDeleteStudent(student)} className="text-rose-600 transition hover:text-rose-800" aria-label={`删除学生：${student.name}`} title={TEXT.delete}><Trash2 className="h-4 w-4" /></button>
                        </div></td>
                      </tr>
                    )) : <tr><td colSpan={8} className="px-6 py-14 text-center text-slate-500">{TEXT.noStudents}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <StudentFormModal isOpen={isFormOpen} isEditing={Boolean(editingStudentId)} isSaving={isSavingStudent} formData={formData} formErrors={formErrors} onClose={() => { setIsFormOpen(false); setEditingStudentId(null); setFormErrors({}); }} onSubmit={(event) => void handleSaveStudent(event)} onFieldChange={handleFieldChange} />
      <QrCodeModal student={qrStudent} onClose={() => setQrStudent(null)} />
    </div>
  );
}
