# 📋 Attendance Management System

A full-stack web application for managing student attendance, built for the **Department of Civil Engineering** at a university. Admins, faculty, and students each have their own dashboards with role-specific features.

> **Live Demo**: Coming soon (deploying to Render + Vercel)

---

## ✨ What This App Does

### For Admins
- View department-wide statistics (total students, faculty, attendance rates)
- Manage faculty members, students, classes, subjects, and academic years
- Assign faculty to subjects and classes
- Manage holidays and post daily updates/announcements
- Export attendance reports as PDF, Excel, or CSV

### For Faculty
- Take attendance for assigned classes and subjects
- View and edit past attendance records (with audit trail)
- See attendance statistics for their classes
- Post daily updates visible to all department members

### For Students
- View personal attendance percentage (overall and subject-wise)
- See today's attendance status
- View attendance history with filters
- Access staff directory with faculty details
- Read daily department updates

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, React Router v6 |
| **State Management** | TanStack Query (React Query), React Hook Form + Zod |
| **UI** | Lucide Icons, Recharts (charts), Custom Modal/Toast components |
| **Backend** | FastAPI (Python), SQLAlchemy ORM, Pydantic v2 |
| **Auth** | JWT tokens (python-jose), bcrypt password hashing |
| **Database** | PostgreSQL (production) / SQLite (local development) |
| **Reports** | Pandas, Openpyxl (Excel), ReportLab (PDF) |

---

## 📁 Project Structure

```
attendance-system/
├── backend/
│   ├── app/
│   │   ├── auth/           # JWT authentication & role-based access control
│   │   ├── core/           # Config settings, password hashing, JWT helpers
│   │   ├── database/       # SQLAlchemy engine & session setup
│   │   ├── models/         # Database table definitions (SQLAlchemy models)
│   │   ├── routes/         # API endpoints (auth, admin, faculty, student, reports)
│   │   ├── schemas/        # Request/response validation (Pydantic schemas)
│   │   ├── uploads/        # Profile pictures storage
│   │   ├── utils/          # Helper functions
│   │   └── main.py         # FastAPI app entry point
│   ├── Dockerfile          # Docker config for Render deployment
│   ├── requirements.txt    # Python dependencies
│   └── seed.py             # Database seeder with sample data
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI (Modal, Toast, Skeleton loader)
│   │   ├── context/        # Auth context (login state management)
│   │   ├── layouts/        # Page layouts (sidebar navigation, auth pages)
│   │   ├── pages/          # All page components organized by role
│   │   │   ├── admin/      # Dashboard, Faculty, Students, Academic, Holidays
│   │   │   ├── auth/       # Login, Forgot Password, Reset Password
│   │   │   ├── faculty/    # Dashboard, Take Attendance, History, Manage Marks
│   │   │   ├── shared/     # Daily Updates, Profile, Reports
│   │   │   └── student/    # Dashboard, History, Marks, Staff Directory
│   │   ├── services/       # Axios API client with JWT interceptors
│   │   └── App.tsx         # Router setup
│   ├── vercel.json         # Vercel SPA routing config
│   ├── vite.config.ts      # Vite dev server + API proxy
│   └── package.json        # Node.js dependencies
├── render.yaml             # Render deployment blueprint
└── .gitignore
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Python 3.10+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)

### Step 1: Start the Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Seed the database with sample data
python seed.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

The API will be running at `http://localhost:8000`  
Swagger docs available at `http://localhost:8000/docs`

### Step 2: Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

> **Note**: The Vite dev server automatically proxies `/api/v1` requests to `http://localhost:8000`, so both servers need to be running.

---

## 🔐 Login Credentials

After running `python seed.py`, you can log in with these accounts:

### Admin
| Email | Password |
|-------|----------|
| admin@attendance.com | admin123 |

### Students (Sample)
| Email | Password | Name | Year |
|-------|----------|------|------|
| student@attendance.com | student123 | Sumesh Srinivas N | 2nd Year |
| s24209001@attendance.com | 24209001 | Sanjay G S | 3rd Year |

> **All other students** use their roll number as both the email prefix (`s{roll_no}@attendance.com`) and password.

### Faculty
| Email | Password | Name |
|-------|----------|------|
| b.sangeethavani@ruraluniv.ac.in | sangeetha123 | Dr. B. Sangeethavani (HOD) |
| r.t.balamurali@ruraluniv.ac.in | balamurali123 | Dr. R. T. Balamurali |
| sakthi85.env@gmail.com | uma123 | Dr. S. Uma |
| jeseema.nisrin@gmail.com | jeseema123 | Dr. J. Jeseema Nisrin |
| infant015@gmail.com | infant123 | Er. K. Infant Xavier |
| g.jegadhesh@ruraluniv.ac.in | jegadhesh123 | Mr. G. Jegadhesh |
| vinoth@ruraluniv.ac.in | vinoth123 | Dr. Vinoth |
| rajarajan@ruraluniv.ac.in | rajarajan123 | Dr. Rajarajan |
| lakshmi@ruraluniv.ac.in | lakshmi123 | Dr. Lakshmi |
| s.abinaya@ruraluniv.ac.in | abinaya123 | Mrs. S. Abinaya |
| p.marimuthu@ruraluniv.ac.in | marimuthu123 | Er. P. Marimuthu |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```ini
# Database (defaults to SQLite if not set)
DATABASE_URL=postgresql://user:password@localhost:5432/attendance_db

# JWT Secret Key (change in production!)
SECRET_KEY=your-secret-key-here

# Allowed frontend origins (comma-separated)
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend (`frontend/.env.production`)

```ini
# Backend API URL (set to your deployed backend URL)
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

---

## 🌐 Deployment

### Backend → Render

1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → New → Blueprint
3. Connect your GitHub repo — Render auto-detects `render.yaml`
4. It creates a **Web Service** (Docker) + **PostgreSQL database** automatically
5. Set `BACKEND_CORS_ORIGINS` to your Vercel frontend URL
6. After deploy, open the Render Shell and run `python seed.py` to populate data

### Frontend → Vercel

1. Go to [Vercel](https://vercel.com) → Import Project → Select repo
2. Set **Root Directory** to `frontend`
3. Set **Framework Preset** to `Vite`
4. Add environment variable: `VITE_API_URL` = `https://your-backend.onrender.com/api/v1`
5. Deploy

---

## 📊 API Endpoints

All API endpoints are prefixed with `/api/v1`.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email & password, returns JWT |
| GET | `/auth/me` | Get current user details |
| POST | `/auth/change-password` | Change password |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/profile/picture` | Upload profile picture |
| PUT | `/auth/profile` | Update profile info |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard/stats` | Dashboard analytics & charts |
| CRUD | `/admin/departments` | Manage departments |
| CRUD | `/admin/classes` | Manage classes |
| CRUD | `/admin/subjects` | Manage subjects |
| CRUD | `/admin/students` | Manage students |
| CRUD | `/admin/faculty` | Manage faculty |
| CRUD | `/admin/assignments` | Faculty-subject-class mapping |
| CRUD | `/admin/holidays` | Manage holidays |
| CRUD | `/admin/announcements` | Post announcements |
| GET | `/admin/audit-logs` | View system activity logs |

### Faculty
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/faculty/dashboard/stats` | Teaching load & statistics |
| GET | `/faculty/classes/{id}/students` | Student list for attendance |
| POST | `/faculty/attendance/submit` | Submit attendance for a class |
| GET | `/faculty/attendance/history` | View past attendance records |
| PUT | `/faculty/attendance/{id}` | Edit attendance (creates audit trail) |

### Student
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/student/profile` | Personal academic details |
| GET | `/student/today-attendance` | Today's attendance status |
| GET | `/student/subject-wise-percentage` | Attendance % per subject |
| GET | `/student/attendance/history` | Full attendance history |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/export` | Export as PDF, Excel, or CSV |

Full interactive API docs: `http://localhost:8000/docs`

---

## 📱 Mobile Support

The application is fully responsive and optimized for phone screens, including:
- Collapsible sidebar navigation
- Touch-friendly form inputs and buttons
- Responsive data tables and cards
- Mobile-optimized attendance marking interface

---

## 📄 License

This project is for educational purposes. Built for the Department of Civil Engineering.
