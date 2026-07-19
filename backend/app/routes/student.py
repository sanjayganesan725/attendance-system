from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database.session import get_db
from app.models import models
from app.schemas import schemas
from app.auth.auth_handler import RoleChecker, get_current_user

router = APIRouter(prefix="/student", tags=["Student Operations"], dependencies=[Depends(RoleChecker(["student"]))])

def late_weight_adjust(records):
    """Counts raw number of attended sessions (Present, Late, Half Day)."""
    count = 0
    for r in records:
        if r.status in ["Present", "Late", "Half Day"]:
            count += 1
    return count

# ----------------- PERSONAL PROFILE DETAILS -----------------
@router.get("/profile", response_model=schemas.StudentDetailOut)
def get_student_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student

# ----------------- DASHBOARD STATS -----------------
@router.get("/dashboard/stats")
def get_student_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    today = date.today()

    # Today's attendance
    today_records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id,
        models.Attendance.date == today
    ).all()

    # Overall stats
    all_records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id
    ).all()

    total = len(all_records)
    present = sum(1 for r in all_records if r.status in ["Present", "Late"])
    absent = sum(1 for r in all_records if r.status == "Absent")
    leave = sum(1 for r in all_records if r.status == "Leave")
    overall_percentage = round((present / total) * 100, 2) if total > 0 else 0.0

    # Monthly trend (last 6 months)
    trends = []
    for i in range(5, -1, -1):
        target_date = today.replace(day=1)
        for _ in range(i):
            target_date = (target_date.replace(day=1) - timedelta(days=1)).replace(day=1)
        month_start = target_date
        if target_date.month == 12:
            month_end = date(target_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(target_date.year, target_date.month + 1, 1) - timedelta(days=1)

        m_records = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.date >= month_start,
            models.Attendance.date <= month_end
        ).all()
        m_total = len(m_records)
        m_present = sum(1 for r in m_records if r.status in ["Present", "Late"])
        m_rate = round((m_present / m_total) * 100, 2) if m_total > 0 else 0.0
        trends.append({"name": target_date.strftime("%b"), "rate": m_rate, "present": m_present, "total": m_total})

    return {
        "student": {
            "id": student.id,
            "roll_number": student.roll_number,
            "registration_number": student.registration_number,
            "department": student.department.name,
            "class_name": student.class_.name,
            "semester": student.semester.name,
            "name": student.user.full_name,
            "email": student.user.email
        },
        "today_count": len(today_records),
        "today_present": sum(1 for r in today_records if r.status in ["Present", "Late"]),
        "today_absent": sum(1 for r in today_records if r.status == "Absent"),
        "total_records": total,
        "present": present,
        "absent": absent,
        "leave": leave,
        "overall_percentage": overall_percentage,
        "trends": trends
    }

# ----------------- TODAY'S ATTENDANCE STATUS -----------------
@router.get("/today-attendance")
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    today = date.today()
    
    # Get all subjects assigned to student's class
    assignments = db.query(models.SubjectFacultyAssignment).filter(
        models.SubjectFacultyAssignment.class_id == student.class_id
    ).all()
    subject_ids = list(set([a.subject_id for a in assignments]))
    subjects = db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
    
    # Get attendance marked for today
    today_records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id,
        models.Attendance.date == today
    ).all()
    
    # Build response map
    status_map = {r.subject_id: r for r in today_records}
    
    response = []
    for sub in subjects:
        record = status_map.get(sub.id)
        response.append({
            "subject_id": sub.id,
            "subject_name": sub.name,
            "subject_code": sub.code,
            "marked": record is not None,
            "status": record.status if record else "Not Marked",
            "remarks": record.remarks if record else None,
            "period": record.period if record else None,
            "time": record.created_at.strftime("%I:%M %p") if record else None
        })
        
    return response

# ----------------- SUBJECT WISE PERCENTAGE OVERVIEW -----------------
@router.get("/subject-wise-percentage")
def get_subject_wise_percentage(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Get all subjects assigned to student's class
    assignments = db.query(models.SubjectFacultyAssignment).filter(
        models.SubjectFacultyAssignment.class_id == student.class_id
    ).all()
    subject_ids = list(set([a.subject_id for a in assignments]))
    subjects = db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
    
    result = []
    for sub in subjects:
        # Total conduct classes (total attendance marked for class and subject)
        # To avoid duplicating count per student, we query distinct dates marked for class/subject
        total_conducted = db.query(models.Attendance.date).filter(
            models.Attendance.class_id == student.class_id,
            models.Attendance.subject_id == sub.id
        ).distinct().count()
        
        # Student specific records
        student_records = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.subject_id == sub.id
        ).all()
        
        present = sum(1 for r in student_records if r.status == "Present")
        late = sum(1 for r in student_records if r.status == "Late")
        absent = sum(1 for r in student_records if r.status == "Absent")
        half_day = sum(1 for r in student_records if r.status == "Half Day")
        leave = sum(1 for r in student_records if r.status == "Leave")
        
        # Calculation: Present count includes full present + late + half present (0.5)
        # Leaves are excused, so they reduce total conducted for that student (e.g. conducted - leaves)
        attended_weight = present + late + (0.5 * half_day)
        net_conducted = total_conducted - leave
        
        percentage = 100.0
        if net_conducted > 0:
            percentage = round((attended_weight / net_conducted) * 100, 2)
            
        attended_count = late_weight_adjust(student_records)

        result.append({
            "subject_id": sub.id,
            "subject_name": sub.name,
            "subject_code": sub.code,
            "total_conducted": total_conducted,
            "attended": attended_count,
            "present": present,
            "late": late,
            "absent": absent,
            "half_day": half_day,
            "leave": leave,
            "percentage": min(percentage, 100.0)
        })
        
    return result

# ----------------- ATTENDANCE HISTORY (LIST) -----------------
@router.get("/attendance/history", response_model=List[schemas.AttendanceDetailOut])
def get_student_history(
    subject_id: Optional[str] = Query(None),
    status_val: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Attendance).filter(models.Attendance.student_id == current_user.id)
    if subject_id:
        query = query.filter(models.Attendance.subject_id == subject_id)
    if status_val:
        query = query.filter(models.Attendance.status == status_val)
        
    return query.order_by(models.Attendance.date.desc()).all()

# ----------------- SEMESTER MARKS -----------------
@router.get("/marks", response_model=List[schemas.StudentMarkOut])
def get_student_marks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    # Get all subjects assigned to student's class
    assignments = db.query(models.SubjectFacultyAssignment).filter(
        models.SubjectFacultyAssignment.class_id == student.class_id
    ).all()
    
    subject_ids = list(set([a.subject_id for a in assignments]))
    subjects = db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
    
    # Get student's marks
    marks = db.query(models.StudentMark).filter(models.StudentMark.student_id == student.id).all()
    marks_map = {m.subject_id: m for m in marks}
    
    result = []
    for sub in subjects:
        mark = marks_map.get(sub.id)
        result.append({
            "id": mark.id if mark else f"temp-{sub.id}",
            "student_id": student.id,
            "subject_id": sub.id,
            "cfa": mark.cfa if mark else None,
            "ese": mark.ese if mark else None,
            "total": mark.total if mark else None,
            "subject": sub
        })
    return result

# ----------------- STAFF DIRECTORY -----------------
@router.get("/staff-directory", response_model=List[schemas.FacultyDetailOut])
def get_staff_directory(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    # Get all faculty members in the student's department
    faculty = db.query(models.Faculty).filter(
        models.Faculty.department_id == student.department_id
    ).all()
    
    return faculty

@router.get("/staff-directory/{faculty_id}", response_model=schemas.FacultyProfileOut)
def get_staff_member_profile(
    faculty_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    # Get faculty member in the student's department
    faculty_member = db.query(models.Faculty).filter(
        models.Faculty.id == faculty_id,
        models.Faculty.department_id == student.department_id
    ).first()
    
    if not faculty_member:
        raise HTTPException(status_code=404, detail="Faculty member not found in your department")
        
    return faculty_member

@router.get("/announcements", response_model=List[schemas.AnnouncementOut])
def get_student_announcements(db: Session = Depends(get_db)):
    return db.query(models.Announcement).filter(
        or_(models.Announcement.target_role == "all", models.Announcement.target_role == "student")
    ).order_by(models.Announcement.created_at.desc()).all()

