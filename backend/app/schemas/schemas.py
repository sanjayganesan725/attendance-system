from datetime import date, datetime
from typing import List, Optional, Union
from pydantic import BaseModel, EmailStr, Field

# ----------------- TOKEN SCHEMAS -----------------
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    email: str
    user_id: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

# ----------------- USER SCHEMAS -----------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture_url: Optional[str] = None

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str

class UserOut(UserBase):
    id: str
    profile_picture_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ----------------- DEPARTMENT SCHEMAS -----------------
class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class DepartmentOut(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- ACADEMIC YEAR SCHEMAS -----------------
class AcademicYearCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_active: Optional[bool] = True

class AcademicYearOut(BaseModel):
    id: str
    name: str
    start_date: date
    end_date: date
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- SEMESTER SCHEMAS -----------------
class SemesterCreate(BaseModel):
    name: str
    code: str
    academic_year_id: str

class SemesterOut(BaseModel):
    id: str
    name: str
    code: str
    academic_year_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- CLASS SCHEMAS -----------------
class ClassCreate(BaseModel):
    name: str
    department_id: str
    semester_id: str
    academic_year_id: str

class ClassOut(BaseModel):
    id: str
    name: str
    department_id: str
    semester_id: str
    academic_year_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ClassDetailOut(ClassOut):
    department: DepartmentOut
    semester: SemesterOut
    academic_year: AcademicYearOut

    class Config:
        from_attributes = True

# ----------------- SUBJECT SCHEMAS -----------------
class SubjectCreate(BaseModel):
    name: str
    code: str
    department_id: str
    credits: Optional[float] = 3.0

class SubjectOut(BaseModel):
    id: str
    name: str
    code: str
    department_id: str
    credits: float
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- STUDENT SCHEMAS -----------------
class StudentCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    roll_number: str
    registration_number: str
    department_id: str
    class_id: str
    academic_year_id: str
    semester_id: str

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    roll_number: Optional[str] = None
    registration_number: Optional[str] = None
    department_id: Optional[str] = None
    class_id: Optional[str] = None
    academic_year_id: Optional[str] = None
    semester_id: Optional[str] = None

class StudentOut(BaseModel):
    id: str
    roll_number: str
    registration_number: str
    department_id: str
    class_id: str
    academic_year_id: str
    semester_id: str
    user: UserOut

    class Config:
        from_attributes = True

class StudentDetailOut(BaseModel):
    id: str
    roll_number: str
    registration_number: str
    department: DepartmentOut
    class_: ClassOut = Field(..., alias="class_")
    academic_year: AcademicYearOut
    semester: SemesterOut
    user: UserOut

    class Config:
        from_attributes = True
        populate_by_name = True

# ----------------- FACULTY SCHEMAS -----------------
class FacultyCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    employee_id: str
    department_id: str
    designation: str
    specialization: Optional[str] = None

class FacultyUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    department_id: Optional[str] = None
    designation: Optional[str] = None
    specialization: Optional[str] = None

class FacultyOut(BaseModel):
    id: str
    employee_id: str
    department_id: str
    designation: str
    specialization: Optional[str] = None
    user: UserOut

    class Config:
        from_attributes = True

class FacultyDetailOut(BaseModel):
    id: str
    employee_id: str
    department: DepartmentOut
    designation: str
    specialization: Optional[str] = None
    user: UserOut

    class Config:
        from_attributes = True

class FacultyAssignmentOut(BaseModel):
    id: str
    subject: SubjectOut
    class_: ClassOut = Field(..., alias="class_")

    class Config:
        from_attributes = True
        populate_by_name = True

class FacultyProfileOut(BaseModel):
    id: str
    employee_id: str
    designation: str
    specialization: Optional[str] = None
    department: DepartmentOut
    user: UserOut
    subject_assignments: List[FacultyAssignmentOut]

    class Config:
        from_attributes = True


# ----------------- ASSIGNMENT SCHEMAS -----------------
class SubjectFacultyAssignmentCreate(BaseModel):
    faculty_id: str
    subject_id: str
    class_id: str

class SubjectFacultyAssignmentOut(BaseModel):
    id: str
    faculty_id: str
    subject_id: str
    class_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class SubjectFacultyAssignmentDetailOut(SubjectFacultyAssignmentOut):
    faculty: FacultyOut
    subject: SubjectOut
    class_: ClassOut = Field(..., alias="class_")

    class Config:
        from_attributes = True
        populate_by_name = True

# ----------------- ATTENDANCE SCHEMAS -----------------
class AttendanceCreate(BaseModel):
    student_id: str
    status: str  # Present, Absent, Late, Half Day, Leave
    remarks: Optional[str] = None

class AttendanceBulkCreate(BaseModel):
    class_id: str
    subject_id: str
    date: date
    period: int = Field(..., ge=1, le=6)
    records: List[AttendanceCreate]

class AttendanceUpdate(BaseModel):
    status: str
    remarks: Optional[str] = None
    change_reason: Optional[str] = None

class AttendanceOut(BaseModel):
    id: str
    student_id: str
    class_id: str
    subject_id: str
    date: date
    period: int
    status: str
    remarks: Optional[str] = None
    marked_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AttendanceDetailOut(AttendanceOut):
    student: StudentOut
    subject: SubjectOut
    class_: ClassOut = Field(..., alias="class_")

    class Config:
        from_attributes = True
        populate_by_name = True

# ----------------- AUDIT LOG SCHEMAS -----------------
class AttendanceAuditLogOut(BaseModel):
    id: str
    attendance_id: str
    old_status: str
    new_status: str
    changed_by: str
    change_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- ANNOUNCEMENT SCHEMAS -----------------
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_role: Optional[str] = "all"

class AnnouncementOut(BaseModel):
    id: str
    title: str
    content: str
    target_role: str
    created_by: str
    created_at: datetime
    author: UserOut

    class Config:
        from_attributes = True

# ----------------- HOLIDAY SCHEMAS -----------------
class HolidayCreate(BaseModel):
    name: str
    date: date
    description: Optional[str] = None

class HolidayOut(BaseModel):
    id: str
    name: str
    date: date
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- STUDENT MARK SCHEMAS -----------------
class StudentMarkBase(BaseModel):
    cfa: Optional[int] = None
    ese: Optional[int] = None

class StudentMarkCreate(StudentMarkBase):
    student_id: str
    subject_id: str

class StudentMarkUpdate(BaseModel):
    cfa: Optional[int] = None
    ese: Optional[int] = None

class StudentMarkOut(BaseModel):
    id: str
    student_id: str
    subject_id: str
    cfa: Optional[int] = None
    ese: Optional[int] = None
    total: Optional[int] = None
    subject: Optional[SubjectOut] = None

    class Config:
        from_attributes = True

class StudentMarkRecord(BaseModel):
    student_id: str
    cfa: Optional[Union[int, str]] = None
    ese: Optional[Union[int, str]] = None

class BatchMarksSubmit(BaseModel):
    class_id: str
    subject_id: str
    records: List[StudentMarkRecord]
