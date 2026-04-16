# 班级信息管理平台

这是一个前后端分离的班级信息管理平台：

- 前端使用 React + Vite + TypeScript
- 后端使用 Python FastAPI
- 数据持久化到 SQLite

当前版本已经完成从“纯前端 LocalStorage 原型”向“真实前后端应用”的迁移。

## 技术栈

### 前端

- React 19
- TypeScript 5
- Vite 6
- Tailwind CSS 4
- Recharts
- Lucide React
- qrcode.react

### 后端

- Python 3.11+
- FastAPI
- Pydantic
- Uvicorn
- SQLite

### 数据存储

- 默认数据库文件：`backend/data/class_information.db`

## 已完成的优化

- 将浏览器 `LocalStorage` 数据迁移到 FastAPI + SQLite
- 登录从前端本地状态改为后端认证接口
- 修复原页面中的中文乱码问题
- 保留并接通学生新增、编辑、删除、搜索、筛选、排序、导入、导出、二维码展示
- 为 Windows 环境补充可直接运行的启动方式
- 前端使用 `/api` 代理访问本地 FastAPI 服务，方便联调

## 环境要求

- Node.js 22+
- npm 10+
- Python 3.11+
- PowerShell

## 首次安装

### 1. 安装前端依赖

```powershell
cd F:\Shisheng_Project\Class_information
npm install
```

### 2. 创建并激活 Python 虚拟环境

```powershell
cd F:\Shisheng_Project\Class_information
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. 安装后端依赖

```powershell
pip install -r backend/requirements.txt
```

## 本地启动

建议打开两个 PowerShell 窗口分别运行。

### 终端 1：启动后端

```powershell
cd F:\Shisheng_Project\Class_information
.\.venv\Scripts\Activate.ps1
npm run backend:dev
```

启动后地址为：

- 后端接口：`http://127.0.0.1:8000`
- Swagger 文档：`http://127.0.0.1:8000/docs`

### 终端 2：启动前端

```powershell
cd F:\Shisheng_Project\Class_information
npm run dev
```

启动后地址为：

- 前端页面：`http://127.0.0.1:3000`

## 本地联调说明

前端开发服务器已经在 `vite.config.ts` 中配置了代理：

- `http://127.0.0.1:3000/api/*`
- 会自动转发到
- `http://127.0.0.1:8000/api/*`

这意味着前端页面和浏览器里的请求，默认都走前端地址，不需要手动改 API 域名。

## 默认登录账号

- 用户名：`admin`
- 密码：`admin123`

## 可选环境变量

如果你想覆盖默认管理员账号或密钥，可以在启动后端前设置：

```powershell
$env:CLASS_ADMIN_USERNAME="admin"
$env:CLASS_ADMIN_PASSWORD="admin123"
$env:CLASS_APP_SECRET="change-me"
```

前端联调相关变量见 `.env.example`：

- `VITE_API_BASE_URL`
- `VITE_API_PROXY_TARGET`

## 快速自检

### 1. 检查后端健康状态

```powershell
curl.exe http://127.0.0.1:8000/api/health
```

### 2. 检查前端代理是否生效

```powershell
curl.exe http://127.0.0.1:3000/api/health
```

如果返回里有 `"status":"ok"`，说明前端代理到后端已经打通。

## 构建与检查

### TypeScript 检查

```powershell
npm run lint
```

### 前端生产构建

```powershell
npm run build
```

### 后端语法编译检查

```powershell
.\.venv\Scripts\python -m compileall backend
```

## 已验证通过的本地联调项

我已经在本地实际验证过以下链路：

- 前端启动成功
- 后端启动成功
- `http://127.0.0.1:3000/api/health` 通过代理返回 `ok`
- 登录接口通过前端代理可正常返回 `admin`
- 学生列表接口通过前端代理可正常返回数据

## 常见问题

### 1. 前端起来了但页面打不开

先确认 3000 端口是否被占用：

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

### 2. 后端起不来

先确认虚拟环境依赖是否装好：

```powershell
.\.venv\Scripts\python -m pip list
```

再直接手动启动看报错：

```powershell
.\.venv\Scripts\python -m uvicorn backend.main:app --app-dir . --host 127.0.0.1 --port 8000
```

### 3. 浏览器里请求不到接口

优先检查：

- 后端是否已经启动在 8000
- 前端是否启动在 3000
- `vite.config.ts` 中的代理目标是否仍为 `http://127.0.0.1:8000`

## 项目结构

```text
src/                 前端页面与组件
backend/             FastAPI 后端
backend/data/        SQLite 数据文件目录
dist/                前端构建产物
```
