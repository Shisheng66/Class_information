import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Users, LayoutDashboard, UserPlus, Search, Edit, Trash2, X, GraduationCap, BookOpen, Filter, ArrowUpDown, ArrowUp, ArrowDown, Eye, ArrowLeft, Phone, MapPin, Calendar, Hash, Upload, LogOut, Lock, User, Download, QrCode } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

interface Student {
  id: string;
  name: string;
  gender: '男' | '女';
  grade: string;
  age: number;
  phone: string;
  address: string;
  enrollmentDate: string;
}

type SortKey = 'id' | 'name' | 'grade' | 'age' | 'enrollmentDate';

const GRADES = ['2024级', '2023级', '2022级', '2021级'];

const initialData: Student[] = [
  { id: '20230101', name: '张伟', gender: '男', grade: '2023级', age: 19, phone: '13812345678', address: '北京市海淀区中关村大街1号', enrollmentDate: '2023-09-01' },
  { id: '20220102', name: '王芳', gender: '女', grade: '2022级', age: 20, phone: '13987654321', address: '上海市浦东新区世纪大道', enrollmentDate: '2022-09-01' },
  { id: '20230103', name: '李娜', gender: '女', grade: '2023级', age: 19, phone: '13700000000', address: '广州市天河区天河路', enrollmentDate: '2023-09-02' },
  { id: '20210104', name: '赵强', gender: '男', grade: '2021级', age: 21, phone: '13611112222', address: '深圳市南山区深南大道', enrollmentDate: '2021-09-01' },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true' || sessionStorage.getItem('isAuthenticated') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('class_students');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialData;
      }
    }
    return initialData;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'students'>('dashboard');
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  
  const viewingStudent = useMemo(() => students.find(s => s.id === viewingStudentId) || null, [students, viewingStudentId]);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Student>({
    id: '', name: '', gender: '男', grade: '2023级', age: 18, phone: '', address: '', enrollmentDate: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Student, string>>>({});

  // Save to localStorage (JSON format) whenever students change
  useEffect(() => {
    localStorage.setItem('class_students', JSON.stringify(students));
  }, [students]);

  const stats = useMemo(() => {
    const total = students.length;
    const male = students.filter(s => s.gender === '男').length;
    const female = students.filter(s => s.gender === '女').length;
    const avgAge = total > 0 ? (students.reduce((acc, s) => acc + Number(s.age), 0) / total).toFixed(1) : '0';
    return { total, male, female, avgAge };
  }, [students]);

  const chartData = useMemo(() => {
    // Gender Data
    const genderData = [
      { name: '男生', value: stats.male },
      { name: '女生', value: stats.female },
    ];

    // Grade Data
    const gradeMap: Record<string, number> = {};
    GRADES.forEach(g => gradeMap[g] = 0);
    students.forEach(s => {
      if (gradeMap[s.grade] !== undefined) {
        gradeMap[s.grade]++;
      } else {
        gradeMap[s.grade] = 1;
      }
    });
    
    // Sort by grade descending (e.g. 2024, 2023, 2022)
    const gradeData = Object.keys(gradeMap)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({
        name: key,
        人数: gradeMap[key]
      }));

    return { genderData, gradeData };
  }, [students, stats]);

  const PIE_COLORS = ['#3b82f6', '#ec4899']; // Blue, Pink

  const filteredStudents = useMemo(() => {
    let result = students.filter(s => {
      // 1. Search by Name or ID
      const matchSearch = s.name.includes(searchQuery) || s.id.includes(searchQuery);
      // 2. Filter by Gender
      const matchGender = filterGender === 'all' || s.gender === filterGender;
      // 3. Filter by Grade
      const matchGrade = filterGrade === 'all' || s.grade === filterGrade;
      
      return matchSearch && matchGender && matchGrade;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [students, searchQuery, filterGender, filterGrade, sortConfig]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400 inline" />;
    if (sortConfig.direction === 'asc') return <ArrowUp className="w-4 h-4 ml-1 text-blue-600 inline" />;
    return <ArrowDown className="w-4 h-4 ml-1 text-blue-600 inline" />;
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const keyMap: Record<string, keyof Student> = {
      '学号': 'id', 'id': 'id',
      '姓名': 'name', 'name': 'name',
      '性别': 'gender', 'gender': 'gender',
      '年级': 'grade', 'grade': 'grade',
      '年龄': 'age', 'age': 'age',
      '联系电话': 'phone', 'phone': 'phone',
      '家庭住址': 'address', 'address': 'address',
      '入校日期': 'enrollmentDate', 'enrollmentDate': 'enrollmentDate'
    };
    
    const result: Student[] = [];
    for (let i = 1; i < lines.length; i++) {
      let row = lines[i];
      let values = [];
      let inQuotes = false;
      let currentVal = '';
      for (let char of row) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim());

      const student: Partial<Student> = {};
      headers.forEach((header, index) => {
        const key = keyMap[header];
        if (key && values[index] !== undefined) {
          let val = values[index].replace(/^"|"$/g, '');
          if (key === 'age') student[key] = parseInt(val) || 0;
          else student[key] = val as any;
        }
      });
      if (student.id && student.name) {
        result.push(student as Student);
      }
    }
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let newStudents: Student[] = [];
        
        if (file.name.toLowerCase().endsWith('.json')) {
          newStudents = JSON.parse(content);
          if (!Array.isArray(newStudents)) {
            throw new Error('JSON 格式错误：必须是学生对象数组');
          }
          newStudents = newStudents.filter(s => s.id && s.name);
        } else if (file.name.toLowerCase().endsWith('.csv')) {
          newStudents = parseCSV(content);
        } else {
          alert('不支持的文件格式，请上传 CSV 或 JSON 文件。');
          return;
        }

        const existingIds = new Set(students.map(s => s.id));
        const addedStudents = newStudents.filter(s => !existingIds.has(s.id));
        const skippedCount = newStudents.length - addedStudents.length;

        if (addedStudents.length > 0) {
          setStudents(prev => [...prev, ...addedStudents]);
          alert(`成功导入 ${addedStudents.length} 条学生信息！${skippedCount > 0 ? `\n跳过 ${skippedCount} 条重复学号的数据。` : ''}`);
        } else {
          alert('没有导入任何新数据。可能文件为空或所有学号均已存在。');
        }
      } catch (error) {
        console.error('导入失败:', error);
        alert('文件解析失败，请检查文件格式是否正确。');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert('当前没有可导出的数据。');
      return;
    }

    // Define CSV headers
    const headers = ['学号', '姓名', '性别', '年级', '年龄', '联系电话', '家庭住址', '入校日期'];
    
    // Convert student data to CSV rows
    const csvRows = filteredStudents.map(student => {
      return [
        `"${student.id}"`,
        `"${student.name}"`,
        `"${student.gender}"`,
        `"${student.grade}"`,
        student.age,
        `"${student.phone}"`,
        `"${student.address.replace(/"/g, '""')}"`, // Escape quotes in address
        `"${student.enrollmentDate || ''}"`
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `学生信息导出_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateField = (name: keyof Student, value: any, currentFormData: Student) => {
    let error = '';
    switch (name) {
      case 'id':
        if (!value) {
          error = '学号不能为空';
        } else if (!/^[A-Za-z0-9]{4,12}$/.test(value)) {
          error = '学号必须为4-12位字母或数字';
        } else if (!editingStudent || editingStudent.id !== value) {
          if (students.some(s => s.id === value)) {
            error = '该学号已存在';
          }
        }
        break;
      case 'name':
        if (!value.trim()) {
          error = '姓名不能为空';
        } else if (value.trim().length < 2) {
          error = '姓名至少需要2个字符';
        }
        break;
      case 'phone':
        if (!value) {
          error = '联系电话不能为空';
        } else if (!/^1[3-9]\d{9}$/.test(value)) {
          error = '请输入有效的11位手机号码';
        }
        break;
      case 'age':
        if (value === '' || value <= 0 || value > 100) {
          error = '请输入有效的年龄 (1-100)';
        }
        break;
      case 'address':
        if (!value.trim()) {
          error = '家庭住址不能为空';
        } else if (value.trim().length < 5) {
          error = '家庭住址过于简短';
        }
        break;
      case 'enrollmentDate':
        if (!value) {
          error = '入校日期不能为空';
        }
        break;
    }
    return error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;
    if (name === 'age') {
      parsedValue = parseInt(value) || '';
    }
    
    const newFormData = { ...formData, [name]: parsedValue };
    setFormData(newFormData);
    
    const error = validateField(name as keyof Student, parsedValue, newFormData);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const errors: Partial<Record<keyof Student, string>> = {};
    let hasError = false;
    (Object.keys(formData) as Array<keyof Student>).forEach(key => {
      const err = validateField(key, formData[key as keyof Student], formData);
      if (err) {
        errors[key] = err;
        hasError = true;
      }
    });
    
    if (hasError) {
      setFormErrors(errors);
      return;
    }

    if (editingStudent) {
      setStudents(students.map(s => s.id === editingStudent.id ? formData : s));
    } else {
      // Check if ID exists
      if (students.some(s => s.id === formData.id)) {
        alert('学号已存在！请使用其他学号。');
        return;
      }
      setStudents([...students, formData]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除该学生信息吗？此操作不可恢复。')) {
      setStudents(students.filter(s => s.id !== id));
      return true;
    }
    return false;
  };

  const openModal = (student?: Student) => {
    setFormErrors({});
    if (student) {
      setEditingStudent(student);
      setFormData(student);
    } else {
      setEditingStudent(null);
      setFormData({ id: '', name: '', gender: '男', grade: '2023级', age: 18, phone: '', address: '', enrollmentDate: new Date().toISOString().split('T')[0] });
    }
    setIsModalOpen(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === 'admin' && loginPassword === 'admin123') {
      setIsAuthenticated(true);
      if (rememberMe) {
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        sessionStorage.setItem('isAuthenticated', 'true');
      }
      setLoginError('');
    } else {
      setLoginError('用户名或密码错误，请重试');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('isAuthenticated');
    setLoginUsername('');
    setLoginPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            班级信息管理平台
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请输入管理员账号登录系统
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  用户名
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border outline-none transition-colors"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  密码
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border outline-none transition-colors"
                    placeholder="admin123"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer select-none">
                    记住我
                  </label>
                </div>
              </div>

              {loginError && (
                <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg border border-red-100">
                  {loginError}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  登录
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center text-xs text-gray-400">
              <p>测试账号: admin / admin123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
          <span className="text-lg font-bold text-gray-800">班级信息管理</span>
        </div>
        <nav className="flex-1 py-4">
          <button
            onClick={() => { setActiveTab('dashboard'); setViewingStudentId(null); }}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'dashboard' && !viewingStudentId ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            数据看板
          </button>
          <button
            onClick={() => { setActiveTab('students'); setViewingStudentId(null); }}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'students' || viewingStudentId ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Users className="w-5 h-5 mr-3" />
            学生管理
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-gray-800">
            {viewingStudent ? '学生详情' : activeTab === 'dashboard' ? '数据看板' : '学生管理'}
          </h1>
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-2">
              管
            </div>
            <span>欢迎回来，管理员</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {viewingStudent ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <button 
                onClick={() => setViewingStudentId(null)} 
                className="flex items-center text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回学生列表
              </button>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                      {viewingStudent.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{viewingStudent.name}</h2>
                      <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${viewingStudent.gender === '男' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                          {viewingStudent.gender}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs border border-gray-200">
                          {viewingStudent.grade}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setQrStudent(viewingStudent)}
                      className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      二维码
                    </button>
                    <button
                      onClick={() => openModal(viewingStudent)}
                      className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </button>
                    <button
                      onClick={() => {
                        if (handleDelete(viewingStudent.id)) {
                          setViewingStudentId(null);
                        }
                      }}
                      className="flex items-center px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium shadow-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </button>
                  </div>
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4" /> 学号
                      </h3>
                      <p className="text-gray-900 font-medium">{viewingStudent.id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" /> 年龄
                      </h3>
                      <p className="text-gray-900 font-medium">{viewingStudent.age} 岁</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" /> 入校日期
                      </h3>
                      <p className="text-gray-900 font-medium">{viewingStudent.enrollmentDate || '暂无'}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4" /> 联系电话
                      </h3>
                      <p className="text-gray-900 font-medium">{viewingStudent.phone}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4" /> 家庭住址
                      </h3>
                      <p className="text-gray-900 font-medium leading-relaxed">{viewingStudent.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'dashboard' ? (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">总人数</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">男生人数</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.male}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-blue-500">♂</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">女生人数</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.female}</p>
                    </div>
                    <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-pink-500">♀</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">平均年龄</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgAge}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Gender Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-800 mb-6">男女生比例</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.genderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                        >
                          {chartData.genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} 人`, '人数']} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Grade Bar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-800 mb-6">各年级人数分布</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.gradeData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#f9fafb' }} formatter={(value) => [`${value} 人`, '人数']} />
                        <Bar dataKey="人数" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">系统简介</h3>
                <p className="text-gray-600 leading-relaxed">
                  欢迎使用班级信息管理平台。本系统采用纯前端技术栈（HTML, CSS, JavaScript, React）构建，数据以 <strong>JSON</strong> 格式存储在浏览器的本地缓存（LocalStorage）中。
                  您可以在“学生管理”模块中进行学生信息的增删改查操作，所有数据将实时同步并持久化保存。
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Search and Filter Bar */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索姓名或学号..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
                    <select
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value)}
                      className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
                    >
                      <option value="all">全部性别</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>

                    <select
                      value={filterGrade}
                      onChange={(e) => setFilterGrade(e.target.value)}
                      className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
                    >
                      <option value="all">全部年级</option>
                      {GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                  <input
                    type="file"
                    accept=".csv,.json"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 lg:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    导入
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 lg:flex-none flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    导出
                  </button>
                  <button
                    onClick={() => openModal()}
                    className="flex-1 lg:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    添加学生
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                        <th 
                          className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                          onClick={() => handleSort('id')}
                        >
                          <div className="flex items-center">学号 {getSortIcon('id')}</div>
                        </th>
                        <th 
                          className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">姓名 {getSortIcon('name')}</div>
                        </th>
                        <th className="px-6 py-4 font-medium">性别</th>
                        <th 
                          className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                          onClick={() => handleSort('grade')}
                        >
                          <div className="flex items-center">年级 {getSortIcon('grade')}</div>
                        </th>
                        <th 
                          className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                          onClick={() => handleSort('age')}
                        >
                          <div className="flex items-center">年龄 {getSortIcon('age')}</div>
                        </th>
                        <th 
                          className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                          onClick={() => handleSort('enrollmentDate')}
                        >
                          <div className="flex items-center">入校日期 {getSortIcon('enrollmentDate')}</div>
                        </th>
                        <th className="px-6 py-4 font-medium">联系电话</th>
                        <th className="px-6 py-4 font-medium">家庭住址</th>
                        <th className="px-6 py-4 font-medium text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">{student.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded-full text-xs ${student.gender === '男' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                {student.gender}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs border border-gray-200">
                                {student.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{student.age}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{student.enrollmentDate || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{student.phone}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[200px]" title={student.address}>{student.address}</td>
                            <td className="px-6 py-4 text-sm text-right space-x-3">
                              <button
                                onClick={() => setQrStudent(student)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                title="二维码"
                              >
                                <QrCode className="w-4 h-4 inline" />
                              </button>
                              <button
                                onClick={() => setViewingStudentId(student.id)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                title="查看详情"
                              >
                                <Eye className="w-4 h-4 inline" />
                              </button>
                              <button
                                onClick={() => openModal(student)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="编辑"
                              >
                                <Edit className="w-4 h-4 inline" />
                              </button>
                              <button
                                onClick={() => handleDelete(student.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                            没有找到匹配的学生信息
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingStudent ? '编辑学生信息' : '添加学生信息'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学号 *</label>
                <input
                  type="text"
                  name="id"
                  required
                  disabled={!!editingStudent}
                  value={formData.id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${formErrors.id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 outline-none disabled:bg-gray-100 disabled:text-gray-500 transition-all`}
                  placeholder="例如: 20230101"
                />
                {formErrors.id && <p className="text-red-500 text-xs mt-1">{formErrors.id}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 outline-none transition-all`}
                  placeholder="学生姓名"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    {GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                  <input
                    type="number"
                    name="age"
                    required
                    min="1"
                    max="100"
                    value={formData.age}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.age ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 outline-none transition-all`}
                  />
                  {formErrors.age && <p className="text-red-500 text-xs mt-1">{formErrors.age}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">入校日期 *</label>
                <input
                  type="date"
                  name="enrollmentDate"
                  required
                  value={formData.enrollmentDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${formErrors.enrollmentDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 outline-none transition-all bg-white`}
                />
                {formErrors.enrollmentDate && <p className="text-red-500 text-xs mt-1">{formErrors.enrollmentDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 outline-none transition-all`}
                  placeholder="手机号码"
                />
                {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">家庭住址</label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${formErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 outline-none resize-none transition-all`}
                  placeholder="详细地址"
                />
                {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
              </div>

              <div className="pt-4 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrStudent(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">
                学生名片
              </h2>
              <button
                onClick={() => setQrStudent(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center space-y-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <QRCodeSVG
                  value={`姓名: ${qrStudent.name}\n学号: ${qrStudent.id}\n性别: ${qrStudent.gender}\n年级: ${qrStudent.grade}\n年龄: ${qrStudent.age}岁\n电话: ${qrStudent.phone}\n入校: ${qrStudent.enrollmentDate || '暂无'}\n住址: ${qrStudent.address}`}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">{qrStudent.name}</h3>
                <p className="text-gray-500 mt-1">{qrStudent.id} | {qrStudent.grade}</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-center">
              <p className="text-sm text-gray-500">扫一扫，获取学生详细信息</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
