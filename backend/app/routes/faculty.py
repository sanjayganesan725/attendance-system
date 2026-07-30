from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database.session import get_db
from app.models import models
from app.schemas import schemas
from app.auth.auth_handler import RoleChecker, get_current_user

router = APIRouter(prefix="/faculty", tags=["Faculty Operations"], dependencies=[Depends(RoleChecker(["faculty", "admin"]))])

# ----------------- DASHBOARD & ASSIGNMENTS -----------------
@router.get("/dashboard/stats")
def get_faculty_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "admin":
        assignments = db.query(models.SubjectFacultyAssignment).all()
    else:
        assignments = db.query(models.SubjectFacultyAssignment).filter(
            models.SubjectFacultyAssignment.faculty_id == current_user.id
        ).all()
    
    unique_classes = len(set(a.class_id for a in assignments))
    unique_subjects = len(set(a.subject_id for a in assignments))
    
    # History of markings
    marked_count = db.query(models.Attendance).filter(
        models.Attendance.marked_by == current_user.id
    ).count()

    return {
        "classes_count": unique_classes,
        "subjects_count": unique_subjects,
        "marked_records_count": marked_count,
        "assignments": [
            {
                "id": a.id,
                "class_id": a.class_id,
                "class_name": a.class_.name,
                "subject_id": a.subject_id,
                "subject_name": a.subject.name,
                "subject_code": a.subject.code,
                "faculty_id": a.faculty_id,
                "faculty_name": a.faculty.user.full_name if a.faculty and a.faculty.user else "Unassigned",
                "department_name": a.class_.department.name
            }
            for a in assignments
        ]
    }

# ----------------- STUDENTS LIST FOR CLASS -----------------
@router.get("/classes/{class_id}/students", response_model=List[schemas.StudentDetailOut])
def get_class_students(class_id: str, db: Session = Depends(get_db)):
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
        
    # Return students in roll number order
    return db.query(models.Student).join(models.User).filter(
        models.Student.class_id == class_id
    ).order_by(models.Student.roll_number.asc()).all()

# ----------------- HOLIDAYS LIST -----------------
@router.get("/holidays", response_model=List[schemas.HolidayOut])
def get_holidays(db: Session = Depends(get_db)):
    return db.query(models.Holiday).order_by(models.Holiday.date.asc()).all()

# ----------------- ATTENDANCE HISTORY FOR ASSIGNED CLASS/SUBJECT -----------------
@router.get("/attendance/history", response_model=List[schemas.AttendanceDetailOut])
def get_attendance_history(
    class_id: str,
    subject_id: str,
    date_val: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify assignment exists for security
    assignment = db.query(models.SubjectFacultyAssignment).filter(
        models.SubjectFacultyAssignment.faculty_id == current_user.id,
        models.SubjectFacultyAssignment.class_id == class_id,
        models.SubjectFacultyAssignment.subject_id == subject_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=403, detail="You are not assigned to this class/subject")

    query = db.query(models.Attendance).filter(
        models.Attendance.class_id == class_id,
        models.Attendance.subject_id == subject_id
    )
    
    if date_val:
        query = query.filter(models.Attendance.date == date_val)
        
    return query.order_by(models.Attendance.date.desc(), models.Attendance.created_at.desc()).all()

# ----------------- SUBMIT ATTENDANCE (BULK) -----------------
@router.post("/attendance/submit")
def submit_attendance(
    data: schemas.AttendanceBulkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        assignment = db.query(models.SubjectFacultyAssignment).filter(
            models.SubjectFacultyAssignment.faculty_id == current_user.id,
            models.SubjectFacultyAssignment.class_id == data.class_id,
            models.SubjectFacultyAssignment.subject_id == data.subject_id
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="You are not authorized to mark attendance for this class/subject")
        
    # Check if date is a weekend or holiday
    if data.date.weekday() in [5, 6]:
        raise HTTPException(status_code=400, detail="Cannot mark attendance on weekends")
        
    holiday = db.query(models.Holiday).filter(models.Holiday.date == data.date).first()
    if holiday:
        raise HTTPException(status_code=400, detail=f"Cannot mark attendance on a holiday: {holiday.name}")

    # Check if attendance is already submitted for this date/class/subject/period
    existing_records = db.query(models.Attendance).filter(
        models.Attendance.class_id == data.class_id,
        models.Attendance.subject_id == data.subject_id,
        models.Attendance.date == data.date,
        models.Attendance.period == data.period
    ).first()
    if existing_records:
        raise HTTPException(status_code=400, detail=f"Attendance has already been submitted for this class, subject, and period {data.period} on this date")

    # Add records
    try:
        new_records = []
        for record in data.records:
            # Verify student belongs to this class
            student = db.query(models.Student).filter(
                models.Student.id == record.student_id,
                models.Student.class_id == data.class_id
            ).first()
            if not student:
                raise HTTPException(status_code=400, detail=f"Student ID {record.student_id} is not enrolled in class {data.class_id}")
                
            db_attendance = models.Attendance(
                student_id=record.student_id,
                class_id=data.class_id,
                subject_id=data.subject_id,
                date=data.date,
                period=data.period,
                status=record.status,
                remarks=record.remarks,
                marked_by=current_user.id
            )
            db.add(db_attendance)
            new_records.append(db_attendance)
            
        db.commit()
        return {"message": "Attendance marked successfully", "count": len(new_records)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit attendance: {str(e)}")

# ----------------- EDIT ATTENDANCE (INDIVIDUAL) -----------------
@router.put("/attendance/{attendance_id}", response_model=schemas.AttendanceOut)
def edit_attendance(
    attendance_id: str,
    data: schemas.AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    # Verify faculty assignment
    assignment = db.query(models.SubjectFacultyAssignment).filter(
        models.SubjectFacultyAssignment.faculty_id == current_user.id,
        models.SubjectFacultyAssignment.class_id == attendance.class_id,
        models.SubjectFacultyAssignment.subject_id == attendance.subject_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=403, detail="You are not authorized to edit attendance for this class/subject")

    old_status = attendance.status
    if old_status == data.status and attendance.remarks == data.remarks:
        return attendance  # No changes made

    # Record Audit Log
    db_audit = models.AttendanceAuditLog(
        attendance_id=attendance.id,
        old_status=old_status,
        new_status=data.status,
        changed_by=current_user.id,
        change_reason=data.change_reason or "Regular Update"
    )
    
    attendance.status = data.status
    if data.remarks is not None:
        attendance.remarks = data.remarks
        
    db.add(db_audit)
    db.commit()
    db.refresh(attendance)
    return attendance

# ----------------- RETRIEVE AUDIT LOGS FOR AN ATTENDANCE -----------------
@router.get("/attendance/{attendance_id}/audit-logs", response_model=List[schemas.AttendanceAuditLogOut])
def get_attendance_audit_logs(attendance_id: str, db: Session = Depends(get_db)):
    return db.query(models.AttendanceAuditLog).filter(
        models.AttendanceAuditLog.attendance_id == attendance_id
    ).order_by(models.AttendanceAuditLog.created_at.desc()).all()

# ----------------- TODAY'S SUBMITTED ATTENDANCE SESSIONS -----------------
@router.get("/attendance/today")
def get_today_submitted(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = date.today()
    records = db.query(models.Attendance).filter(
        models.Attendance.marked_by == current_user.id,
        models.Attendance.date == today
    ).all()

    sessions: dict = {}
    for r in records:
        key = f"{r.class_id}_{r.subject_id}_{r.period}"
        if key not in sessions:
            sessions[key] = {
                "class_id": r.class_id,
                "class_name": r.class_.name,
                "subject_id": r.subject_id,
                "subject_name": r.subject.name,
                "subject_code": r.subject.code,
                "period": r.period,
                "date": r.date,
                "total_students": 0,
                "present": 0,
                "absent": 0,
                "late": 0,
                "leave": 0,
                "records": []
            }
        s = sessions[key]
        s["total_students"] += 1
        if r.status == "Present": s["present"] += 1
        elif r.status == "Absent": s["absent"] += 1
        elif r.status == "Late": s["late"] += 1
        elif r.status == "Leave": s["leave"] += 1
        s["records"].append({
            "attendance_id": r.id,
            "student_id": r.student_id,
            "student_name": r.student.user.full_name,
            "roll_number": r.student.roll_number,
            "status": r.status,
            "remarks": r.remarks
        })

    return list(sessions.values())

# ----------------- STUDENT MARKS MANAGEMENT -----------------
@router.get("/classes/{class_id}/subjects/{subject_id}/marks")
def get_class_subject_marks(
    class_id: str,
    subject_id: str,
    db: Session = Depends(get_db)
):
    # Verify class exists
    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
        
    # Get all students in the class sorted by roll number
    students = db.query(models.Student).filter(
        models.Student.class_id == class_id
    ).order_by(models.Student.roll_number.asc()).all()
    
    # Get existing marks
    marks = db.query(models.StudentMark).filter(
        models.StudentMark.subject_id == subject_id,
        models.StudentMark.student_id.in_([s.id for s in students])
    ).all() if students else []
    
    marks_map = {m.student_id: m for m in marks}
    
    result = []
    for s in students:
        mark = marks_map.get(s.id)
        c1 = mark.get_cfa1 if mark else None
        c2 = mark.get_cfa2 if mark else None
        tot = mark.total if mark else None
        perc = mark.percentage if mark else None
        result.append({
            "student_id": s.id,
            "roll_number": s.roll_number,
            "full_name": s.user.full_name,
            "cfa1": c1,
            "cfa2": c2,
            "cfa": c1,
            "ese": c2,
            "total": tot,
            "percentage": perc
        })
        
    return result

@router.post("/marks/submit")
def submit_student_marks(
    payload: schemas.BatchMarksSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Upsert marks
    for record in payload.records:
        student_id = record.student_id
        cfa1 = record.cfa1 if record.cfa1 is not None else record.cfa
        cfa2 = record.cfa2 if record.cfa2 is not None else record.ese
        
        # Check if record exists
        mark = db.query(models.StudentMark).filter(
            models.StudentMark.student_id == student_id,
            models.StudentMark.subject_id == payload.subject_id
        ).first()
        
        # Convert empty strings to None
        if cfa1 == "": cfa1 = None
        if cfa2 == "": cfa2 = None
        
        if cfa1 is not None:
            cfa1 = int(cfa1)
        if cfa2 is not None:
            cfa2 = int(cfa2)
            
        if mark:
            mark.cfa1 = cfa1
            mark.cfa2 = cfa2
            mark.cfa = cfa1
            mark.ese = cfa2
        else:
            mark = models.StudentMark(
                student_id=student_id,
                subject_id=payload.subject_id,
                cfa1=cfa1,
                cfa2=cfa2,
                cfa=cfa1,
                ese=cfa2
            )
            db.add(mark)
            
    db.commit()
    return {"message": "Marks submitted successfully"}

@router.get("/announcements", response_model=List[schemas.AnnouncementOut])
def get_faculty_announcements(db: Session = Depends(get_db)):
    return db.query(models.Announcement).filter(
        or_(models.Announcement.target_role == "all", models.Announcement.target_role == "faculty")
    ).order_by(models.Announcement.created_at.desc()).all()

# ----------------- STAFF DIRECTORY -----------------
@router.get("/staff-directory", response_model=List[schemas.FacultyDetailOut])
def get_faculty_staff_directory(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    faculty_profile = db.query(models.Faculty).filter(models.Faculty.id == current_user.id).first()
    if faculty_profile and faculty_profile.department_id:
        return db.query(models.Faculty).filter(models.Faculty.department_id == faculty_profile.department_id).all()
    return db.query(models.Faculty).all()

@router.get("/staff-directory/{faculty_id}", response_model=schemas.FacultyProfileOut)
def get_faculty_staff_member_profile(
    faculty_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    faculty_member = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not faculty_member:
        raise HTTPException(status_code=404, detail="Faculty member not found")
    return faculty_member

