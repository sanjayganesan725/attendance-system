import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Date, ForeignKey, Table, Text, Integer, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # admin, faculty, student
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    profile_picture_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False, cascade="all, delete-orphan")
    marked_attendance = relationship("Attendance", back_populates="marker", foreign_keys="Attendance.marked_by")
    audit_logs = relationship("AuditLog", back_populates="user")
    announcements = relationship("Announcement", back_populates="author")
    audit_changes = relationship("AttendanceAuditLog", back_populates="changed_by_user")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)  # e.g., CSE, ECE
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    classes = relationship("Class", back_populates="department", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="department", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="department")
    faculty = relationship("Faculty", back_populates="department")

class AcademicYear(Base):
    __tablename__ = "academic_years"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False)  # e.g., 2025-2026
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    classes = relationship("Class", back_populates="academic_year", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="academic_year")

class Semester(Base):
    __tablename__ = "semesters"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), nullable=False)  # e.g., Semester 1
    code = Column(String(20), nullable=False)  # e.g., SEM1
    academic_year_id = Column(String(36), ForeignKey("academic_years.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    classes = relationship("Class", back_populates="semester")
    students = relationship("Student", back_populates="semester")

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), nullable=False)  # e.g., Section A
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    semester_id = Column(String(36), ForeignKey("semesters.id"), nullable=False)
    academic_year_id = Column(String(36), ForeignKey("academic_years.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    department = relationship("Department", back_populates="classes")
    semester = relationship("Semester", back_populates="classes")
    academic_year = relationship("AcademicYear", back_populates="classes")
    students = relationship("Student", back_populates="class_", cascade="all, delete-orphan")
    faculty_assignments = relationship("SubjectFacultyAssignment", back_populates="class_", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="class_", cascade="all, delete-orphan")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)  # e.g., CS101
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    credits = Column(Float, nullable=False, default=3.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    department = relationship("Department", back_populates="subjects")
    faculty_assignments = relationship("SubjectFacultyAssignment", back_populates="subject", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="subject", cascade="all, delete-orphan")

class Student(Base):
    __tablename__ = "students"
    
    id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    roll_number = Column(String(50), unique=True, nullable=False)
    registration_number = Column(String(50), unique=True, nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    academic_year_id = Column(String(36), ForeignKey("academic_years.id"), nullable=False)
    semester_id = Column(String(36), ForeignKey("semesters.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    class_ = relationship("Class", back_populates="students")
    academic_year = relationship("AcademicYear", back_populates="students")
    semester = relationship("Semester", back_populates="students")
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")

class Faculty(Base):
    __tablename__ = "faculty"
    
    id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    employee_id = Column(String(50), unique=True, nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    designation = Column(String(100), nullable=False)  # e.g., Assistant Professor
    specialization = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty")
    subject_assignments = relationship("SubjectFacultyAssignment", back_populates="faculty", cascade="all, delete-orphan")

class SubjectFacultyAssignment(Base):
    __tablename__ = "subject_faculty_assignments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    faculty_id = Column(String(36), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    faculty = relationship("Faculty", back_populates="subject_assignments")
    subject = relationship("Subject", back_populates="faculty_assignments")
    class_ = relationship("Class", back_populates="faculty_assignments")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)  # Present, Absent, Late, Half Day, Leave
    period = Column(Integer, nullable=False, default=1)
    remarks = Column(String(255), nullable=True)
    marked_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    class_ = relationship("Class", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")
    marker = relationship("User", back_populates="marked_attendance", foreign_keys=[marked_by])
    audit_logs = relationship("AttendanceAuditLog", back_populates="attendance", cascade="all, delete-orphan")

class AttendanceAuditLog(Base):
    __tablename__ = "attendance_audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    attendance_id = Column(String(36), ForeignKey("attendance.id", ondelete="CASCADE"), nullable=False)
    old_status = Column(String(20), nullable=False)
    new_status = Column(String(20), nullable=False)
    changed_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    change_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    attendance = relationship("Attendance", back_populates="audit_logs")
    changed_by_user = relationship("User", back_populates="audit_changes")

class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(150), nullable=False)
    content = Column(Text, nullable=False)
    target_role = Column(String(20), default="all")  # all, faculty, student
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    author = relationship("User", back_populates="announcements")

class Holiday(Base):
    __tablename__ = "holidays"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    date = Column(Date, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # LOGIN, LOGOUT, CREATE_STUDENT, etc.
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class StudentMark(Base):
    __tablename__ = "student_marks"
    __table_args__ = (UniqueConstraint('student_id', 'subject_id', name='_student_subject_uc'),)
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    cfa = Column(Integer, nullable=True)  # Continuous Formative Assessment
    ese = Column(Integer, nullable=True)  # End Semester Exam
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("Student")
    subject = relationship("Subject")

    @property
    def total(self):
        cfa_val = self.cfa if self.cfa is not None else 0
        ese_val = self.ese if self.ese is not None else 0
        if self.cfa is None and self.ese is None:
            return None
        return cfa_val + ese_val
