# Attendance Management System

A COMPLETE, production-ready, full-stack Attendance Management System suitable for colleges, schools, companies, and training institutes. Designed with a clean, minimal monochrome aesthetic inspired by Notion, Linear, and GitHub.

---

## Technical Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Router v6, React Hook Form, Zod, TanStack Query, Axios, Lucide Icons, Recharts (for dashboards).
- **Backend**: FastAPI (Python 3.10+), SQLAlchemy (ORM), Pydantic v2 (Validation), Python-jose (JWT), Passlib + bcrypt (Password hashing), Pandas/Openpyxl (Report compilation).
- **Database**: PostgreSQL (with automatic SQLite fallback for ease of local evaluation).
- **File Upload**: Local server storage (`/backend/app/uploads`).

---

## Folder Structure

```text
/attendance-system
├── /backend
│   ├── /app
│   │   ├── /auth          # Authentication dependencies & role protection
│   │   ├── /core          # Security settings, hashing & JWT policies
│   │   ├── /database      # DB session, connection pooling setup
│   │   ├── /models        # SQLAlchemy schema declarations
│   │   ├── /routes        # Individual API routing handlers
│   │   ├── /schemas       # Pydantic validation schemas
│   │   ├── /utils         # Generic helper methods (audit logging)
│   │   └── main.py        # Entrypoint starting FastAPI, mounting static files
│   ├── requirements.txt   # Backend python dependencies list
│   └── seed.py            # Pre-populates DB accounts and history stats
└── /frontend
    ├── /src
    │   ├── /components    # Custom modal overlays, toasts & skeletons
    │   ├── /context       # JWT session storage Context
    │   ├── /layouts       # Auth layouts & Collapsible sidebar navigation Layouts
    │   ├── /pages         # Admin/Faculty/Student dashboards and subviews
    │   ├── /services      # Axios configs and JWT request interceptors
    │   ├── App.tsx        # Router setup and providers wrapper
    │   ├── index.css      # Custom scrollbars, buttons, shadows
    │   └── main.tsx       # Mounts React DOM
    ├── index.html         # HTML wrapper importing Inter font
    ├── package.json       # Node package manager declarations
    ├── tailwind.config.js # Color variables and design system tokens
    ├── tsconfig.json      # TypeScript compiler settings
    └── vite.config.ts     # Proxy routes to backend
```

---

## Installation & Launch Guide

### 1. Backend Setup
Navigate to the `backend` folder:
```bash
cd backend
```

Create a python virtual environment:
```bash
python -m venv venv
venv\Scripts\activate   # On Windows
source venv/bin/activate # On Unix/macOS
```

Install requirements:
```bash
pip install -r requirements.txt
```

*(Optional)* Run the database seeder to initialize the database with mock accounts and 30 days of historical attendance:
```bash
python seed.py
```

Launch the FastAPI application server:
```bash
uvicorn app.main:app --reload --port 8000
```
API Documentation is served at: `http://localhost:8000/docs`.

---

### 2. Frontend Setup
Navigate to the `frontend` folder:
```bash
cd ../frontend
```

Install NPM packages:
```bash
npm install
```

Launch the Vite hot-reloading development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your web browser.

---

## Environment Variables

### Backend (`/backend/.env`)
Create a `.env` file in the `/backend` folder to configure database and security credentials:

```ini
# Project Information
PROJECT_NAME="Attendance Management System"

# Security (Change in production!)
SECRET_KEY="supersecretkeychangeinproduction1234567890"

# Access token expiry (e.g. 7 days)
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Database Configuration (Auto-falls back to SQLite 'attendance.db' if empty)
DATABASE_URL="postgresql://user:password@localhost:5432/attendance_db"

# Allowed CORS origins
BACKEND_CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
```

---

## Database Schema

```mermaid
erDiagram
    users ||--|| students : "student profile (1-1)"
    users ||--|| faculty : "faculty profile (1-1)"
    users ||--o{ attendance : "marks"
    users ||--o{ announcements : "creates"
    users ||--o{ audit_logs : "triggers"
    departments ||--o{ classes : "has"
    departments ||--o{ subjects : "has"
    departments ||--o{ students : "enrolled"
    departments ||--o{ faculty : "employs"
    academic_years ||--o{ classes : "has"
    academic_years ||--o{ semesters : "has"
    classes ||--o{ students : "contains"
    classes ||--o{ subject_faculty_assignments : "has workloads"
    classes ||--o{ attendance : "conducted in"
    subjects ||--o{ subject_faculty_assignments : "included in"
    subjects ||--o{ attendance : "conducted for"
    faculty ||--o{ subject_faculty_assignments : "teaches"
    attendance ||--o{ attendance_audit_logs : "tracks changes"
```

### Table Definitions
1. **users**: ID (UUID), Email, Hashed Password, Role (`admin`/`faculty`/`student`), Full Name, Phone, Profile Picture URL, Active Status, Timestamps.
2. **departments**: ID (UUID), Name, Department Code (e.g., CSE), Description.
3. **academic_years**: ID (UUID), Name (e.g., 2025-2026), Start/End Dates, Active state.
4. **semesters**: ID (UUID), Name (e.g., Semester 1), Code, Academic Year ID (FK).
5. **classes**: ID (UUID), Name (e.g., CSE Section A), Department (FK), Semester (FK), Academic Year (FK).
6. **subjects**: ID (UUID), Name, Subject Code (e.g., CS101), Department (FK).
7. **students**: ID (UUID, FK to User), Roll Number, Registration Number, Class (FK), Department (FK), Semester (FK), Academic Year (FK).
8. **faculty**: ID (UUID, FK to User), Employee ID, Designation, Department (FK).
9. **subject_faculty_assignments**: ID (UUID), Faculty (FK), Subject (FK), Class (FK).
10. **attendance**: ID (UUID), Student (FK), Class (FK), Subject (FK), Date, Status (`Present`, `Absent`, `Late`, `Half Day`, `Leave`), Remarks, Marked By (FK).
11. **attendance_audit_logs**: ID (UUID), Attendance ID (FK), Old Status, New Status, Changed By User (FK), Reason.
12. **announcements**: ID (UUID), Title, Content, Target Role, Created By User (FK).
13. **holidays**: ID (UUID), Name, Date, Description.
14. **audit_logs**: ID (UUID), User ID (FK), Action Name, Details text, IP Address.

---

## API Documentation Summary

### 1. Authentication (`/api/v1/auth`)
- `POST /login`: Receives `username` and `password` (urlencoded), returns JWT accessToken, user details, and active role.
- `GET /me`: Returns detailed record of current authenticated user session.
- `POST /change-password`: Modifies current password credentials.
- `POST /forgot-password`: Generates secure token; logs recovery link in backend terminal console.
- `POST /reset-password`: Resets user credentials using active JWT token.
- `POST /profile/picture`: Handles avatar image upload; saves file inside local directory `/backend/app/uploads/`.
- `PUT /profile`: Modifies full name, phone number, and email.

### 2. Administrator Operations (`/api/v1/admin`)
- `GET /dashboard/stats`: Returns analytics counters, historical monthly charts data, and system logs.
- `GET/POST/PUT/DELETE /departments`: Department management endpoints.
- `GET/POST/PUT/DELETE /classes`: Class configurations.
- `GET/POST/PUT/DELETE /subjects`: Course catalog setup.
- `GET/POST/PUT/DELETE /students`: Manage enrolled student files.
- `GET/POST/PUT/DELETE /faculty`: Manage instructor details.
- `GET/POST/DELETE /assignments`: Teach workload mapping.
- `GET/POST/DELETE /holidays`: Exempt attendance requirements on calendar dates.
- `GET/POST/DELETE /announcements`: Post notifications to dashboards.
- `GET /audit-logs`: Review system activity records.

### 3. Faculty Operations (`/api/v1/faculty`)
- `GET /dashboard/stats`: View teaching assignments and active statistics.
- `GET /classes/{class_id}/students`: Lists students in class for marking rolls.
- `POST /attendance/submit`: Submit bulk roll registers. Triggers duplicate constraints checks.
- `GET /attendance/history`: List previous logs.
- `PUT /attendance/{attendance_id}`: Edit individual rolls. Populates audit trail histories.

### 4. Student Operations (`/api/v1/student`)
- `GET /profile`: Personal academic enrollment records.
- `GET /today-attendance`: Roll checklists for today's courses.
- `GET /subject-wise-percentage`: Calculates attended lectures vs conducted weights per course.
- `GET /attendance/history`: Historical lists of all marked entries.

### 5. Reporting Services (`/api/v1/reports`)
- `GET /export`: Download spreadsheets or documents filtered by dates, student, class, and subjects.
  - Parameters: `format` (`pdf`|`excel`|`csv`), `class_id`, `subject_id`, `student_id`, `start_date`, `end_date`.

---

## Seed Accounts (For Local Evaluation)

Run `python seed.py` to pre-seed these credentials:

| Email | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| **admin@attendance.com** | `admin123` | **Admin** | System manager access |
| **student@attendance.com** | `student123` | **Student** | Sumesh Srinivas N (CE Student) |
| **b.sangeethavani@ruraluniv.ac.in** | `sangeetha123` | **Faculty** | Dr. B. Sangeethavani (CE Dept Head) |
| **r.t.balamurali@ruraluniv.ac.in** | `balamurali123` | **Faculty** | Dr. R. T. Balamurali |
| **sakthi85.env@gmail.com** | `uma123` | **Faculty** | Dr. S. Uma |
| **jeseema.nisrin@gmail.com** | `jeseema123` | **Faculty** | Dr. J. Jeseema Nisrin |
| **infant015@gmail.com** | `infant123` | **Faculty** | Er. K. Infant Xavier |
| **g.jegadhesh@ruraluniv.ac.in** | `jegadhesh123` | **Faculty** | Mr. G. Jegadhesh |
| **vinoth@ruraluniv.ac.in** | `vinoth123` | **Faculty** | Dr. Vinoth |
| **rajarajan@ruraluniv.ac.in** | `rajarajan123` | **Faculty** | Dr. Rajarajan |
| **lakshmi@ruraluniv.ac.in** | `lakshmi123` | **Faculty** | Dr. Lakshmi |
| **s.abinaya@ruraluniv.ac.in** | `abinaya123` | **Faculty** | Mrs. S. Abinaya |
| **p.marimuthu@ruraluniv.ac.in** | `marimuthu123` | **Faculty** | Er. P. Marimuthu |
| **chemistry@ruraluniv.ac.in** | `chemistry123` | **Faculty** | Chemistry Dept |
