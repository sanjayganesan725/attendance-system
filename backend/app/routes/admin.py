from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.database.session import get_db
from app.models import models
from app.schemas import schemas
from app.core import security
from app.auth.auth_handler import RoleChecker, get_current_user
from app.utils.helpers import log_activity

router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(RoleChecker(["admin"]))])

# ----------------- ANALYTICS & STATISTICS -----------------
@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_students = db.query(models.Student).count()
    total_faculty = db.query(models.Faculty).count()
    total_departments = db.query(models.Department).count()
    total_classes = db.query(models.Class).count()
    
    # Today's attendance analytics
    today = date.today()
    today_records = db.query(models.Attendance).filter(models.Attendance.date == today).all()
    today_marked = len(today_records)
    
    present_count = sum(1 for r in today_records if r.status in ["Present", "Late"])
    absent_count = sum(1 for r in today_records if r.status == "Absent")
    leave_count = sum(1 for r in today_records if r.status == "Leave")
    late_count = sum(1 for r in today_records if r.status == "Late")
    
    attendance_rate = 0.0
    if today_marked > 0:
        attendance_rate = round((present_count / today_marked) * 100, 2)
        
    # Overall attendance rate (historical average)
    all_time_records = db.query(models.Attendance.status).all()
    total_all_time = len(all_time_records)
    total_present_all_time = sum(1 for r in all_time_records if r[0] in ["Present", "Late"])
    overall_attendance_rate = 0.0
    if total_all_time > 0:
        overall_attendance_rate = round((total_present_all_time / total_all_time) * 100, 2)

    # Monthly trends (last 6 months)
    # We will aggregate by month
    trends = []
    for i in range(5, -1, -1):
        target_date = today - timedelta(days=i*30)
        month_name = target_date.strftime("%B")
        # Start and end of month approximation
        month_start = date(target_date.year, target_date.month, 1)
        if target_date.month == 12:
            month_end = date(target_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(target_date.year, target_date.month + 1, 1) - timedelta(days=1)
            
        m_records = db.query(models.Attendance).filter(
            models.Attendance.date >= month_start,
            models.Attendance.date <= month_end
        ).all()
        
        m_total = len(m_records)
        m_present = sum(1 for r in m_records if r.status in ["Present", "Late"])
        m_rate = round((m_present / m_total) * 100, 2) if m_total > 0 else 0.0
        trends.append({"name": month_name, "rate": m_rate})

    # Recent activity logs
    recent_logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(5).all()
    
    return {
        "counters": {
            "students": total_students,
            "faculty": total_faculty,
            "departments": total_departments,
            "classes": total_classes
        },
        "today_stats": {
            "marked": today_marked,
            "present": present_count,
            "absent": absent_count,
            "leave": leave_count,
            "late": late_count,
            "rate": attendance_rate
        },
        "overall_rate": overall_attendance_rate,
        "trends": trends,
        "recent_activities": [
            {
                "id": log.id,
                "action": log.action,
                "details": log.details,
                "created_at": log.created_at,
                "user_name": db.query(models.User.full_name).filter(models.User.id == log.user_id).scalar() or "System"
            }
            for log in recent_logs
        ]
    }

# ----------------- DEPARTMENTS CRUD -----------------
@router.post("/departments", response_model=schemas.DepartmentOut)
def create_department(data: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    # Check uniqueness
    existing_name = db.query(models.Department).filter(models.Department.name == data.name).first()
    if existing_name:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
    existing_code = db.query(models.Department).filter(models.Department.code == data.code.upper()).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Department with this code already exists")
        
    db_dept = models.Department(
        name=data.name,
        code=data.code.upper(),
        description=data.description
    )
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.get("/departments", response_model=List[schemas.DepartmentOut])
def list_departments(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100
):
    query = db.query(models.Department)
    if search:
        query = query.filter(
            or_(
                models.Department.name.ilike(f"%{search}%"),
                models.Department.code.ilike(f"%{search}%")
            )
        )
    return query.offset(skip).limit(limit).all()

@router.put("/departments/{id}", response_model=schemas.DepartmentOut)
def update_department(id: str, data: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Uniqueness check excluding self
    existing = db.query(models.Department).filter(
        (models.Department.name == data.name) | (models.Department.code == data.code.upper()),
        models.Department.id != id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department name or code is already in use")
        
    dept.name = data.name
    dept.code = data.code.upper()
    dept.description = data.description
    db.commit()
    db.refresh(dept)
    return dept

@router.delete("/departments/{id}")
def delete_department(id: str, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Cascades handled by database relationships (or blocked if there are students)
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted successfully"}

# ----------------- ACADEMIC YEARS CRUD -----------------
@router.post("/academic-years", response_model=schemas.AcademicYearOut)
def create_academic_year(data: schemas.AcademicYearCreate, db: Session = Depends(get_db)):
    existing = db.query(models.AcademicYear).filter(models.AcademicYear.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Academic year name already exists")
        
    if data.is_active:
        # Deactivate all others
        db.query(models.AcademicYear).update({models.AcademicYear.is_active: False})
        
    db_ay = models.AcademicYear(
        name=data.name,
        start_date=data.start_date,
        end_date=data.end_date,
        is_active=data.is_active
    )
    db.add(db_ay)
    db.commit()
    db.refresh(db_ay)
    return db_ay

@router.get("/academic-years", response_model=List[schemas.AcademicYearOut])
def list_academic_years(db: Session = Depends(get_db)):
    return db.query(models.AcademicYear).order_by(models.AcademicYear.start_date.desc()).all()

@router.put("/academic-years/{id}", response_model=schemas.AcademicYearOut)
def update_academic_year(id: str, data: schemas.AcademicYearCreate, db: Session = Depends(get_db)):
    ay = db.query(models.AcademicYear).filter(models.AcademicYear.id == id).first()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic year not found")
        
    if data.is_active and not ay.is_active:
        db.query(models.AcademicYear).update({models.AcademicYear.is_active: False})
        
    ay.name = data.name
    ay.start_date = data.start_date
    ay.end_date = data.end_date
    ay.is_active = data.is_active
    
    db.commit()
    db.refresh(ay)
    return ay

# ----------------- SEMESTERS CRUD -----------------
@router.post("/semesters", response_model=schemas.SemesterOut)
def create_semester(data: schemas.SemesterCreate, db: Session = Depends(get_db)):
    ay = db.query(models.AcademicYear).filter(models.AcademicYear.id == data.academic_year_id).first()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic Year not found")
        
    db_sem = models.Semester(
        name=data.name,
        code=data.code.upper(),
        academic_year_id=data.academic_year_id
    )
    db.add(db_sem)
    db.commit()
    db.refresh(db_sem)
    return db_sem

@router.get("/semesters", response_model=List[schemas.SemesterOut])
def list_semesters(db: Session = Depends(get_db), academic_year_id: Optional[str] = Query(None)):
    query = db.query(models.Semester)
    if academic_year_id:
        query = query.filter(models.Semester.academic_year_id == academic_year_id)
    return query.all()

# ----------------- CLASSES CRUD -----------------
@router.post("/classes", response_model=schemas.ClassOut)
def create_class(data: schemas.ClassCreate, db: Session = Depends(get_db)):
    # Check exists
    dept = db.query(models.Department).filter(models.Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    sem = db.query(models.Semester).filter(models.Semester.id == data.semester_id).first()
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found")
    ay = db.query(models.AcademicYear).filter(models.AcademicYear.id == data.academic_year_id).first()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic year not found")
        
    # Check duplicate class name under department/semester/ay
    existing = db.query(models.Class).filter(
        models.Class.name == data.name,
        models.Class.department_id == data.department_id,
        models.Class.semester_id == data.semester_id,
        models.Class.academic_year_id == data.academic_year_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Class already exists with these configurations")

    db_class = models.Class(
        name=data.name,
        department_id=data.department_id,
        semester_id=data.semester_id,
        academic_year_id=data.academic_year_id
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

@router.get("/classes", response_model=List[schemas.ClassDetailOut])
def list_classes(
    db: Session = Depends(get_db),
    department_id: Optional[str] = Query(None),
    academic_year_id: Optional[str] = Query(None),
    semester_id: Optional[str] = Query(None)
):
    query = db.query(models.Class)
    if department_id:
        query = query.filter(models.Class.department_id == department_id)
    if academic_year_id:
        query = query.filter(models.Class.academic_year_id == academic_year_id)
    if semester_id:
        query = query.filter(models.Class.semester_id == semester_id)
    return query.all()

# ----------------- SUBJECTS CRUD -----------------
@router.post("/subjects", response_model=schemas.SubjectOut)
def create_subject(data: schemas.SubjectCreate, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    existing = db.query(models.Subject).filter(models.Subject.code == data.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject code already exists")
        
    db_sub = models.Subject(
        name=data.name,
        code=data.code.upper(),
        department_id=data.department_id
    )
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

@router.get("/subjects", response_model=List[schemas.SubjectOut])
def list_subjects(
    db: Session = Depends(get_db),
    department_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    query = db.query(models.Subject)
    if department_id:
        query = query.filter(models.Subject.department_id == department_id)
    if search:
        query = query.filter(
            or_(
                models.Subject.name.ilike(f"%{search}%"),
                models.Subject.code.ilike(f"%{search}%")
            )
        )
    return query.all()

# ----------------- FACULTY SUBJECT ASSIGNMENTS -----------------
@router.post("/assignments", response_model=schemas.SubjectFacultyAssignmentDetailOut)
def assign_subject_faculty(data: schemas.SubjectFacultyAssignmentCreate, db: Session = Depends(get_db)):
    fac = db.query(models.Faculty).filter(models.Faculty.id == data.faculty_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty member not found")
    sub = db.query(models.Subject).filter(models.Subject.id == data.subject_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")
    cls = db.query(models.Class).filter(models.Class.id == data.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
        
    # Duplicate check
    existing = db.query(models.SubjectFacultyAssignment).filter(
        models.SubjectFacultyAssignment.faculty_id == data.faculty_id,
        models.SubjectFacultyAssignment.subject_id == data.subject_id,
        models.SubjectFacultyAssignment.class_id == data.class_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Assignment already exists")
        
    db_assign = models.SubjectFacultyAssignment(
        faculty_id=data.faculty_id,
        subject_id=data.subject_id,
        class_id=data.class_id
    )
    db.add(db_assign)
    db.commit()
    db.refresh(db_assign)
    return db_assign

@router.get("/assignments", response_model=List[schemas.SubjectFacultyAssignmentDetailOut])
def list_assignments(
    db: Session = Depends(get_db),
    faculty_id: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None)
):
    query = db.query(models.SubjectFacultyAssignment)
    if faculty_id:
        query = query.filter(models.SubjectFacultyAssignment.faculty_id == faculty_id)
    if class_id:
        query = query.filter(models.SubjectFacultyAssignment.class_id == class_id)
    return query.all()

@router.delete("/assignments/{id}")
def delete_assignment(id: str, db: Session = Depends(get_db)):
    assign = db.query(models.SubjectFacultyAssignment).filter(models.SubjectFacultyAssignment.id == id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assign)
    db.commit()
    return {"message": "Assignment deleted successfully"}

# ----------------- STUDENTS CRUD -----------------
@router.post("/students", response_model=schemas.StudentDetailOut)
def create_student(data: schemas.StudentCreate, db: Session = Depends(get_db)):
    # Check emails/roll numbers
    existing_user = db.query(models.User).filter(models.User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    existing_roll = db.query(models.Student).filter(models.Student.roll_number == data.roll_number).first()
    if existing_roll:
        raise HTTPException(status_code=400, detail="Roll number already exists")
        
    existing_reg = db.query(models.Student).filter(models.Student.registration_number == data.registration_number).first()
    if existing_reg:
        raise HTTPException(status_code=400, detail="Registration number already exists")
        
    # Transactional save
    try:
        hashed_password = security.get_password_hash(data.password)
        db_user = models.User(
            email=data.email,
            hashed_password=hashed_password,
            role="student",
            full_name=data.full_name,
            phone=data.phone
        )
        db.add(db_user)
        db.flush()  # Gen UUID for user.id
        
        db_student = models.Student(
            id=db_user.id,
            roll_number=data.roll_number,
            registration_number=data.registration_number,
            department_id=data.department_id,
            class_id=data.class_id,
            academic_year_id=data.academic_year_id,
            semester_id=data.semester_id
        )
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
        
        log_activity(db, user_id=db_user.id, action="CREATE_STUDENT", details=f"Created student profile for {data.full_name} ({data.roll_number})")
        return db_student
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database transaction error: {str(e)}")

@router.get("/students", response_model=List[schemas.StudentDetailOut])
def list_students(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50
):
    query = db.query(models.Student).join(models.User)
    
    if department_id:
        query = query.filter(models.Student.department_id == department_id)
    if class_id:
        query = query.filter(models.Student.class_id == class_id)
        
    if search:
        query = query.filter(
            or_(
                models.User.full_name.ilike(f"%{search}%"),
                models.User.email.ilike(f"%{search}%"),
                models.Student.roll_number.ilike(f"%{search}%"),
                models.Student.registration_number.ilike(f"%{search}%")
            )
        )
        
    return query.order_by(models.Student.roll_number.asc()).offset(skip).limit(limit).all()

@router.put("/students/{id}", response_model=schemas.StudentDetailOut)
def update_student(id: str, data: schemas.StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    user = student.user
    
    # Check roll number uniqueness
    if data.roll_number and data.roll_number != student.roll_number:
        existing = db.query(models.Student).filter(models.Student.roll_number == data.roll_number, models.Student.id != id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Roll number already in use")
        student.roll_number = data.roll_number
        
    if data.registration_number and data.registration_number != student.registration_number:
        existing = db.query(models.Student).filter(models.Student.registration_number == data.registration_number, models.Student.id != id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Registration number already in use")
        student.registration_number = data.registration_number

    if data.full_name:
        user.full_name = data.full_name
    if data.phone:
        user.phone = data.phone
    if data.department_id:
        student.department_id = data.department_id
    if data.class_id:
        student.class_id = data.class_id
    if data.academic_year_id:
        student.academic_year_id = data.academic_year_id
    if data.semester_id:
        student.semester_id = data.semester_id
        
    db.commit()
    db.refresh(student)
    return student

@router.delete("/students/{id}")
def delete_student(id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student user not found")
        
    db.delete(user)
    db.commit()
    return {"message": "Student deleted successfully"}

# ----------------- FACULTY CRUD -----------------
@router.post("/faculty", response_model=schemas.FacultyDetailOut)
def create_faculty(data: schemas.FacultyCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    existing_emp = db.query(models.Faculty).filter(models.Faculty.employee_id == data.employee_id).first()
    if existing_emp:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
        
    try:
        hashed_password = security.get_password_hash(data.password)
        db_user = models.User(
            email=data.email,
            hashed_password=hashed_password,
            role="faculty",
            full_name=data.full_name,
            phone=data.phone
        )
        db.add(db_user)
        db.flush()
        
        db_fac = models.Faculty(
            id=db_user.id,
            employee_id=data.employee_id,
            department_id=data.department_id,
            designation=data.designation
        )
        db.add(db_fac)
        db.commit()
        db.refresh(db_fac)
        
        log_activity(db, user_id=db_user.id, action="CREATE_FACULTY", details=f"Created faculty profile for {data.full_name} ({data.employee_id})")
        return db_fac
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database transaction error: {str(e)}")

@router.get("/faculty", response_model=List[schemas.FacultyDetailOut])
def list_faculty(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50
):
    query = db.query(models.Faculty).join(models.User)
    
    if department_id:
        query = query.filter(models.Faculty.department_id == department_id)
        
    if search:
        query = query.filter(
            or_(
                models.User.full_name.ilike(f"%{search}%"),
                models.User.email.ilike(f"%{search}%"),
                models.Faculty.employee_id.ilike(f"%{search}%")
            )
        )
        
    return query.offset(skip).limit(limit).all()

@router.put("/faculty/{id}", response_model=schemas.FacultyDetailOut)
def update_faculty(id: str, data: schemas.FacultyUpdate, db: Session = Depends(get_db)):
    fac = db.query(models.Faculty).filter(models.Faculty.id == id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty member not found")
        
    user = fac.user
    
    if data.employee_id and data.employee_id != fac.employee_id:
        existing = db.query(models.Faculty).filter(models.Faculty.employee_id == data.employee_id, models.Faculty.id != id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Employee ID already in use")
        fac.employee_id = data.employee_id

    if data.full_name:
        user.full_name = data.full_name
    if data.phone:
        user.phone = data.phone
    if data.department_id:
        fac.department_id = data.department_id
    if data.designation:
        fac.designation = data.designation
        
    db.commit()
    db.refresh(fac)
    return fac

@router.delete("/faculty/{id}")
def delete_faculty(id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Faculty user not found")
    db.delete(user)
    db.commit()
    return {"message": "Faculty deleted successfully"}

# ----------------- HOLIDAYS CRUD -----------------
@router.post("/holidays", response_model=schemas.HolidayOut)
def create_holiday(data: schemas.HolidayCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Holiday).filter(models.Holiday.date == data.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="A holiday is already marked on this date")
        
    db_hol = models.Holiday(
        name=data.name,
        date=data.date,
        description=data.description
    )
    db.add(db_hol)
    db.commit()
    db.refresh(db_hol)
    return db_hol

@router.get("/holidays", response_model=List[schemas.HolidayOut])
def list_holidays(db: Session = Depends(get_db)):
    return db.query(models.Holiday).order_by(models.Holiday.date.asc()).all()

@router.delete("/holidays/{id}")
def delete_holiday(id: str, db: Session = Depends(get_db)):
    hol = db.query(models.Holiday).filter(models.Holiday.id == id).first()
    if not hol:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(hol)
    db.commit()
    return {"message": "Holiday deleted successfully"}

# ----------------- ANNOUNCEMENTS CRUD -----------------
@router.post("/announcements", response_model=schemas.AnnouncementOut)
def create_announcement(
    data: schemas.AnnouncementCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(RoleChecker(["admin"]))
):
    db_ann = models.Announcement(
        title=data.title,
        content=data.content,
        target_role=data.target_role,
        created_by=admin_user.id
    )
    db.add(db_ann)
    db.commit()
    db.refresh(db_ann)
    return db_ann

@router.get("/announcements", response_model=List[schemas.AnnouncementOut])
def list_announcements(db: Session = Depends(get_db)):
    return db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()

@router.delete("/announcements/{id}")
def delete_announcement(id: str, db: Session = Depends(get_db)):
    ann = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted successfully"}

# ----------------- GENERAL AUDIT LOGS -----------------
@router.get("/audit-logs", response_model=List[schemas.AuditLogOut])
def list_audit_logs(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()

# ----------------- ADMIN ATTENDANCE MANAGEMENT -----------------
@router.get("/attendance")
def list_all_attendance(
    db: Session = Depends(get_db),
    class_id: Optional[str] = Query(None),
    subject_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    date_val: Optional[date] = Query(None),
    skip: int = 0,
    limit: int = 100
):
    query = db.query(models.Attendance)
    if class_id:
        query = query.filter(models.Attendance.class_id == class_id)
    if subject_id:
        query = query.filter(models.Attendance.subject_id == subject_id)
    if student_id:
        query = query.filter(models.Attendance.student_id == student_id)
    if date_val:
        query = query.filter(models.Attendance.date == date_val)
    records = query.order_by(models.Attendance.date.desc()).offset(skip).limit(limit).all()

    result = []
    for r in records:
        result.append({
            "id": r.id,
            "date": r.date,
            "period": r.period,
            "status": r.status,
            "remarks": r.remarks,
            "student_name": r.student.user.full_name,
            "roll_number": r.student.roll_number,
            "class_name": r.class_.name,
            "subject_name": r.subject.name,
            "subject_code": r.subject.code,
            "marked_by": r.marker.full_name,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        })
    return result

@router.put("/attendance/{attendance_id}")
def admin_edit_attendance(
    attendance_id: str,
    data: schemas.AttendanceUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(RoleChecker(["admin"]))
):
    attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    old_status = attendance.status
    db_audit = models.AttendanceAuditLog(
        attendance_id=attendance.id,
        old_status=old_status,
        new_status=data.status,
        changed_by=admin_user.id,
        change_reason=data.change_reason or "Admin override"
    )
    attendance.status = data.status
    if data.remarks is not None:
        attendance.remarks = data.remarks

    db.add(db_audit)
    db.commit()
    db.refresh(attendance)
    return {"message": "Attendance updated", "id": attendance.id}

# ----------------- ANALYTICS -----------------
@router.get("/analytics/departments")
def get_department_analytics(db: Session = Depends(get_db)):
    departments = db.query(models.Department).all()
    result = []
    for dept in departments:
        dept_students = db.query(models.Student).filter(models.Student.department_id == dept.id).all()
        student_ids = [s.id for s in dept_students]
        if not student_ids:
            result.append({"department": dept.name, "code": dept.code, "students": 0, "rate": 0.0})
            continue

        records = db.query(models.Attendance).filter(models.Attendance.student_id.in_(student_ids)).all()
        total = len(records)
        present = sum(1 for r in records if r.status in ["Present", "Late"])
        rate = round((present / total) * 100, 2) if total > 0 else 0.0
        result.append({
            "department": dept.name,
            "code": dept.code,
            "students": len(student_ids),
            "total_records": total,
            "present": present,
            "rate": rate
        })
    return result

@router.get("/analytics/classes")
def get_class_analytics(db: Session = Depends(get_db)):
    classes = db.query(models.Class).all()
    result = []
    for cls in classes:
        cls_students = db.query(models.Student).filter(models.Student.class_id == cls.id).all()
        student_ids = [s.id for s in cls_students]
        if not student_ids:
            result.append({"class_name": cls.name, "department": cls.department.name, "students": 0, "rate": 0.0})
            continue

        records = db.query(models.Attendance).filter(models.Attendance.class_id == cls.id).all()
        total = len(records)
        present = sum(1 for r in records if r.status in ["Present", "Late"])
        rate = round((present / total) * 100, 2) if total > 0 else 0.0
        result.append({
            "class_id": cls.id,
            "class_name": cls.name,
            "department": cls.department.name,
            "semester": cls.semester.name,
            "students": len(student_ids),
            "total_records": total,
            "present": present,
            "rate": rate
        })
    return result

@router.get("/analytics/student/{student_id}")
def get_student_analytics(student_id: str, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    records = db.query(models.Attendance).filter(models.Attendance.student_id == student_id).all()
    total = len(records)
    present = sum(1 for r in records if r.status in ["Present", "Late"])
    absent = sum(1 for r in records if r.status == "Absent")
    leave = sum(1 for r in records if r.status == "Leave")
    rate = round((present / total) * 100, 2) if total > 0 else 0.0

    return {
        "student_name": student.user.full_name,
        "roll_number": student.roll_number,
        "department": student.department.name,
        "total": total,
        "present": present,
        "absent": absent,
        "leave": leave,
        "rate": rate
    }

# ----------------- STAFF DIRECTORY -----------------
@router.get("/staff-directory", response_model=List[schemas.FacultyDetailOut])
def get_admin_staff_directory(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Faculty).all()

@router.get("/staff-directory/{faculty_id}", response_model=schemas.FacultyProfileOut)
def get_admin_staff_member_profile(
    faculty_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    faculty_member = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not faculty_member:
        raise HTTPException(status_code=404, detail="Faculty member not found")
    return faculty_member

# ----------------- STAFF DAILY ATTENDANCE (ADMIN ONLY) -----------------
@router.get("/staff-attendance")
def get_staff_daily_attendance(
    attendance_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db)
):
    faculty_list = db.query(models.Faculty).all()
    records = db.query(models.StaffAttendance).filter(models.StaffAttendance.date == attendance_date).all()
    rec_map = {r.faculty_id: r for r in records}
    
    result = []
    for f in faculty_list:
        rec = rec_map.get(f.id)
        result.append({
            "faculty_id": f.id,
            "employee_id": f.employee_id,
            "full_name": f.user.full_name,
            "email": f.user.email,
            "designation": f.designation,
            "specialization": f.specialization,
            "status": rec.status if rec else "Present",
            "remarks": rec.remarks if rec else None,
            "marked": rec is not None
        })
    return result

@router.post("/staff-attendance/take")
def take_staff_attendance(
    payload: schemas.StaffAttendanceSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    att_date = payload.date
    for rec in payload.records:
        existing = db.query(models.StaffAttendance).filter(
            models.StaffAttendance.faculty_id == rec.faculty_id,
            models.StaffAttendance.date == att_date
        ).first()
        
        if existing:
            existing.status = rec.status
            existing.remarks = rec.remarks
            existing.marked_by = current_user.id
        else:
            staff_att = models.StaffAttendance(
                faculty_id=rec.faculty_id,
                date=att_date,
                status=rec.status,
                remarks=rec.remarks,
                marked_by=current_user.id
            )
            db.add(staff_att)
            
    db.commit()
    return {"message": "Staff daily attendance recorded successfully"}

