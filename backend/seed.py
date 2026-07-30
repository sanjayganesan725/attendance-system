from datetime import date, datetime, timedelta
import sys
import os
# Adjust path to import app modules correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal, engine, Base
from app.models import models
from app.core import security

def seed_db(drop_first=False):
    if drop_first:
        print("Recreating database tables...")
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding database data...")
        
        # 1. Admin User
        admin = models.User(
            email="admin@attendance.com",
            hashed_password=security.get_password_hash("123456"),
            role="admin",
            full_name="System Administrator",
            phone="1234567890",
            is_active=True
        )
        db.add(admin)
        
        # 2. Departments
        cse = models.Department(name="Computer Science Engineering", code="CSE", description="Department of Computer Science")
        ce = models.Department(name="Civil Engineering", code="CE", description="Department of Civil Engineering")
        db.add_all([cse, ce])
        db.flush()
        
        # 3. Academic Year
        ay = models.AcademicYear(
            name="2025-2026",
            start_date=date(2025, 8, 1),
            end_date=date(2026, 6, 30),
            is_active=True
        )
        db.add(ay)
        db.flush()
        
        # 4. Semester
        sem = models.Semester(
            name="Semester 1",
            code="SEM1",
            academic_year_id=ay.id
        )
        db.add(sem)
        db.flush()
        
        # 5. Class
        class_ce_3rd = models.Class(
            name="B.Tech Civil Eng 3rd Year",
            department_id=ce.id,
            semester_id=sem.id,
            academic_year_id=ay.id
        )
        class_ce_1st = models.Class(
            name="B.Tech Civil Eng 1st Year",
            department_id=ce.id,
            semester_id=sem.id,
            academic_year_id=ay.id
        )
        class_ce_2nd = models.Class(
            name="B.Tech Civil Eng 2nd Year",
            department_id=ce.id,
            semester_id=sem.id,
            academic_year_id=ay.id
        )
        class_ce_4th = models.Class(
            name="B.Tech Civil Eng 4th Year",
            department_id=ce.id,
            semester_id=sem.id,
            academic_year_id=ay.id
        )
        db.add_all([
            class_ce_3rd, class_ce_1st, class_ce_2nd, class_ce_4th
        ])
        db.flush()
        
        # 6. Subjects
        ds = models.Subject(name="Data Structures", code="CS101", department_id=cse.id, credits=3.0)
        db_sub = models.Subject(name="Database Systems", code="CS102", department_id=cse.id, credits=3.0)
        sm = models.Subject(name="Solid Mechanics", code="CE101", department_id=ce.id, credits=3.0)
        
        # B.Tech Civil Engineering 2nd Year (3rd Semester) subjects
        sub_m3 = models.Subject(name="Mathematics III", code="24MAUB2103", department_id=ce.id, credits=4.0)
        sub_sm_2nd = models.Subject(name="Solid Mechanics", code="24CEUC2108", department_id=ce.id, credits=3.0)
        sub_sg = models.Subject(name="Surveying and Geomatics", code="24CEUC2109", department_id=ce.id, credits=3.0)
        sub_fm = models.Subject(name="Fluid Mechanics", code="24CEUC2110", department_id=ce.id, credits=3.0)
        sub_oe1 = models.Subject(name="Open Elective -I", code="24CEUC2111", department_id=ce.id, credits=3.0)
        sub_iks = models.Subject(name="Indian Knowledge System", code="24CEUV2102", department_id=ce.id, credits=2.0)
        sub_ss = models.Subject(name="Shanthi sena", code="24SHSU0001", department_id=ce.id, credits=0.0)
        sub_sgl = models.Subject(name="Surveying and Geomatics laboratory", code="24CEUC2112", department_id=ce.id, credits=1.5)
        sub_sml = models.Subject(name="Solid Mechanics Laboratory", code="24CEUC2113", department_id=ce.id, credits=1.5)
        sub_ced = models.Subject(name="Computer Aided Civil Engineering Drawing", code="24CEUC2114", department_id=ce.id, credits=2.0)
        sub_vpp = models.Subject(name="Village Placement Programme (VPP)", code="24EXUE2101", department_id=ce.id, credits=0.0)

        # B.Tech Civil Engineering 3rd Year (5th Semester) subjects
        sub_sd1 = models.Subject(name="Structural Design - I (Design of Concrete Structures)", code="24CEUC3122", department_id=ce.id, credits=3.0)
        sub_ee = models.Subject(name="Environmental Engineering", code="24CEUC3123", department_id=ce.id, credits=3.0)
        sub_ieh = models.Subject(name="Irrigation Engineering and Hydraulic Structures", code="24CEUC3124", department_id=ce.id, credits=3.0)
        sub_te = models.Subject(name="Transportation Engineering", code="24CEUC3125", department_id=ce.id, credits=3.0)
        sub_sa1 = models.Subject(name="Structural Analysis-I", code="24CEUC3126", department_id=ce.id, credits=3.0)
        sub_oe3 = models.Subject(name="Open Elective -III", code="24CEUC3127", department_id=ce.id, credits=3.0)
        sub_cgi = models.Subject(name="Civil Engineering Societal and Global Impact", code="24CEUV3104", department_id=ce.id, credits=0.0)
        sub_tel = models.Subject(name="Transportation Engineering Laboratory", code="24CEUC3128", department_id=ce.id, credits=1.5)
        sub_eel = models.Subject(name="Environmental Engineering Laboratory", code="24CEUC3129", department_id=ce.id, credits=1.5)
        sub_ssd = models.Subject(name="Software Skill Development -II", code="24CEUS3106", department_id=ce.id, credits=1.0)

        # B.Tech Civil Engineering 4th Year (7th Semester) subjects
        sub_cem = models.Subject(name="Construction Engineering & Management", code="24CEUC4134", department_id=ce.id, credits=3.0)
        sub_ecv = models.Subject(name="Estimation, Costing & Valuation", code="24CEUC4135", department_id=ce.id, credits=3.0)
        sub_cct = models.Subject(name="Cost-effective construction Technologies", code="24CEUC4136", department_id=ce.id, credits=3.0)
        sub_pe3 = models.Subject(name="Professional Elective - III", code="24CEUC41E3", department_id=ce.id, credits=3.0)
        sub_pe4 = models.Subject(name="Professional Elective - IV", code="24CEUC41E4", department_id=ce.id, credits=3.0)
        sub_ppl = models.Subject(name="Professional Practice Law and Ethics", code="24CEUV4105", department_id=ce.id, credits=2.0)
        sub_dp = models.Subject(name="Design Project", code="24CEUC4138", department_id=ce.id, credits=1.5)
        
        db.add_all([
            ds, db_sub, sm,
            sub_m3, sub_sm_2nd, sub_sg, sub_fm, sub_oe1, sub_iks, sub_ss, sub_sgl, sub_sml, sub_ced, sub_vpp,
            sub_sd1, sub_ee, sub_ieh, sub_te, sub_sa1, sub_oe3, sub_cgi, sub_tel, sub_eel, sub_ssd,
            sub_cem, sub_ecv, sub_cct, sub_pe3, sub_pe4, sub_ppl, sub_dp
        ])
        db.flush()
        
        # (Dr. Alan Turing and Dr. Stephen Timoshenko have been removed)
        
        # 7b. Seed Rural Technology Staff Members (excluding Dr.K.Mahendran and Dr.S.Karnal Preeth)
        staff_data = [
            {
                "email": "b.sangeethavani@ruraluniv.ac.in",
                "name": "Dr. B. Sangeethavani M.E, PH.D",
                "designation": "Assistant Professor and DIRECTOR HEAD OF THE DEPARTMENT",
                "specialization": "Water Resource Engineering, Irrigation Engineering",
                "photo": None,
                "emp_id": "EMP_SANG",
                "password": "sangeetha123"
            },
            {
                "email": "r.t.balamurali@ruraluniv.ac.in",
                "name": "Dr.R.T.Balamurali M.E",
                "designation": "Assistant Professor",
                "specialization": "Structural Engineering, Concrete Technology",
                "photo": None,
                "emp_id": "EMP_BALA",
                "password": "balamurali123"
            },
            {
                "email": "sakthi85.env@gmail.com",
                "name": "Dr.S.Uma M.E., Ph.D",
                "designation": "Guest/Part-time Teacher",
                "specialization": "Environmental Engineering",
                "photo": "/uploads/uma.jpg",
                "emp_id": "EMP_UMA",
                "password": "uma123"
            },
            {
                "email": "jeseema.nisrin@gmail.com",
                "name": "Dr.J.Jeseema Nisrin M.E., Ph.D",
                "designation": "Guest/Part-time Teacher",
                "specialization": "Structural Engineering, Thermal Design of Structures",
                "photo": "/uploads/jeseema.jpg",
                "emp_id": "EMP_JES",
                "password": "jeseema123"
            },
            {
                "email": "infant015@gmail.com",
                "name": "Er.K.Infant Xavier M.E",
                "designation": "Teaching Assistant",
                "specialization": "Structural Engineering, Concrete Technology",
                "photo": "/uploads/infant.jpg",
                "emp_id": "EMP_INF",
                "password": "infant123"
            },
            {
                "email": "g.jegadhesh@ruraluniv.ac.in",
                "name": "Mr. G. Jegadhesh",
                "designation": "Assistant Professor",
                "specialization": "Fluid Mechanics, Environmental Engineering",
                "photo": None,
                "emp_id": "EMP_JEG",
                "password": "jegadhesh123"
            },
            {
                "email": "vinoth@ruraluniv.ac.in",
                "name": "Dr. Vinoth",
                "designation": "Assistant Professor",
                "specialization": "Mathematics",
                "photo": None,
                "emp_id": "EMP_VIN",
                "password": "vinoth123"
            },
            {
                "email": "rajarajan@ruraluniv.ac.in",
                "name": "Dr. Rajarajan",
                "designation": "Assistant Professor",
                "specialization": "Indian Knowledge System, Tamil",
                "photo": None,
                "emp_id": "EMP_RAJ",
                "password": "rajarajan123"
            },
            {
                "email": "lakshmi@ruraluniv.ac.in",
                "name": "Dr. Lakshmi",
                "designation": "Assistant Professor",
                "specialization": "Shanti sena",
                "photo": None,
                "emp_id": "EMP_LAK",
                "password": "lakshmi123"
            },
            {
                "email": "s.abinaya@ruraluniv.ac.in",
                "name": "Mrs. S. Abinaya",
                "designation": "Assistant Professor",
                "specialization": "Construction Management, Structural Engineering",
                "photo": None,
                "emp_id": "EMP_ABI",
                "password": "abinaya123"
            },
            {
                "email": "p.marimuthu@ruraluniv.ac.in",
                "name": "Er. P. Marimuthu",
                "designation": "Assistant Professor",
                "specialization": "Civil Engineering Societal Impact",
                "photo": None,
                "emp_id": "EMP_MAR",
                "password": "marimuthu123"
            },
            {
                "email": "chemistry@ruraluniv.ac.in",
                "name": "Chemistry Dept",
                "designation": "Department",
                "specialization": "Chemistry",
                "photo": None,
                "emp_id": "EMP_CHEM",
                "password": "chemistry123"
            },
            {
                "email": "n.bhuvaneswari@ruraluniv.ac.in",
                "name": "Mrs. N. Bhuvaneswari",
                "designation": "Clerk",
                "specialization": "Department Office & Administrative Support",
                "photo": None,
                "emp_id": "EMP_BHUV",
                "password": "bhuvaneswari123"
            },
            {
                "email": "muthukumar@ruraluniv.ac.in",
                "name": "Mr. Muthukumar",
                "designation": "Technical Assistant",
                "specialization": "Laboratory Maintenance & Technical Support",
                "photo": None,
                "emp_id": "EMP_MUTH",
                "password": "muthukumar123"
            },
            {
                "email": "mathivanan@ruraluniv.ac.in",
                "name": "Mr. Mathivanan",
                "designation": "Clerk",
                "specialization": "Department Office & Administrative Support",
                "photo": None,
                "emp_id": "EMP_MATH",
                "password": "mathivanan123"
            }
        ]
        
        staff_profiles = {}
        for idx, staff in enumerate(staff_data):
            user = models.User(
                email=staff["email"],
                hashed_password=security.get_password_hash("123456"),
                role="faculty",
                full_name=staff["name"],
                phone=f"98765432{idx+2}",
                profile_picture_url=staff["photo"],
                is_active=True
            )
            db.add(user)
            db.flush()
            
            profile = models.Faculty(
                id=user.id,
                employee_id=staff["emp_id"],
                department_id=ce.id,
                designation=staff["designation"],
                specialization=staff["specialization"]
            )
            db.add(profile)
            db.flush()
            staff_profiles[staff["emp_id"]] = profile
        
        sangeethavani_id = staff_profiles["EMP_SANG"].id
        balamurali_id = staff_profiles["EMP_BALA"].id
        uma_id = staff_profiles["EMP_UMA"].id
        jeseema_id = staff_profiles["EMP_JES"].id
        infant_id = staff_profiles["EMP_INF"].id
        jegadhesh_id = staff_profiles["EMP_JEG"].id
        vinoth_id = staff_profiles["EMP_VIN"].id
        rajarajan_id = staff_profiles["EMP_RAJ"].id
        lakshmi_id = staff_profiles["EMP_LAK"].id
        abinaya_id = staff_profiles["EMP_ABI"].id
        marimuthu_id = staff_profiles["EMP_MAR"].id
        chemistry_id = staff_profiles["EMP_CHEM"].id

        # 8. Assign Faculty to Classes & Subjects
        # 1st Year (kept simple placeholders)
        assign_ce_1st_ds = models.SubjectFacultyAssignment(faculty_id=sangeethavani_id, subject_id=ds.id, class_id=class_ce_1st.id)
        assign_ce_1st_sm = models.SubjectFacultyAssignment(faculty_id=infant_id, subject_id=sm.id, class_id=class_ce_1st.id)
        
        # 2nd Year (Semester III)
        assign_2nd_m3 = models.SubjectFacultyAssignment(faculty_id=vinoth_id, subject_id=sub_m3.id, class_id=class_ce_2nd.id)
        assign_2nd_sm = models.SubjectFacultyAssignment(faculty_id=infant_id, subject_id=sub_sm_2nd.id, class_id=class_ce_2nd.id)
        assign_2nd_sg = models.SubjectFacultyAssignment(faculty_id=uma_id, subject_id=sub_sg.id, class_id=class_ce_2nd.id)
        assign_2nd_fm = models.SubjectFacultyAssignment(faculty_id=jegadhesh_id, subject_id=sub_fm.id, class_id=class_ce_2nd.id)
        assign_2nd_oe1 = models.SubjectFacultyAssignment(faculty_id=jeseema_id, subject_id=sub_oe1.id, class_id=class_ce_2nd.id)
        assign_2nd_iks = models.SubjectFacultyAssignment(faculty_id=rajarajan_id, subject_id=sub_iks.id, class_id=class_ce_2nd.id)
        assign_2nd_ss = models.SubjectFacultyAssignment(faculty_id=lakshmi_id, subject_id=sub_ss.id, class_id=class_ce_2nd.id)
        assign_2nd_sgl = models.SubjectFacultyAssignment(faculty_id=uma_id, subject_id=sub_sgl.id, class_id=class_ce_2nd.id)
        assign_2nd_sml = models.SubjectFacultyAssignment(faculty_id=infant_id, subject_id=sub_sml.id, class_id=class_ce_2nd.id)
        assign_2nd_ced = models.SubjectFacultyAssignment(faculty_id=balamurali_id, subject_id=sub_ced.id, class_id=class_ce_2nd.id)
        assign_2nd_vpp = models.SubjectFacultyAssignment(faculty_id=infant_id, subject_id=sub_vpp.id, class_id=class_ce_2nd.id)

        # 3rd Year (Semester V)
        assign_3rd_sd1 = models.SubjectFacultyAssignment(faculty_id=balamurali_id, subject_id=sub_sd1.id, class_id=class_ce_3rd.id)
        assign_3rd_ee = models.SubjectFacultyAssignment(faculty_id=marimuthu_id, subject_id=sub_ee.id, class_id=class_ce_3rd.id)
        assign_3rd_ieh = models.SubjectFacultyAssignment(faculty_id=sangeethavani_id, subject_id=sub_ieh.id, class_id=class_ce_3rd.id)
        assign_3rd_te = models.SubjectFacultyAssignment(faculty_id=uma_id, subject_id=sub_te.id, class_id=class_ce_3rd.id)
        assign_3rd_sa1 = models.SubjectFacultyAssignment(faculty_id=jeseema_id, subject_id=sub_sa1.id, class_id=class_ce_3rd.id)
        assign_3rd_oe3 = models.SubjectFacultyAssignment(faculty_id=abinaya_id, subject_id=sub_oe3.id, class_id=class_ce_3rd.id)
        assign_3rd_cgi = models.SubjectFacultyAssignment(faculty_id=marimuthu_id, subject_id=sub_cgi.id, class_id=class_ce_3rd.id)
        assign_3rd_tel = models.SubjectFacultyAssignment(faculty_id=balamurali_id, subject_id=sub_tel.id, class_id=class_ce_3rd.id)
        assign_3rd_eel = models.SubjectFacultyAssignment(faculty_id=chemistry_id, subject_id=sub_eel.id, class_id=class_ce_3rd.id)
        assign_3rd_ssd = models.SubjectFacultyAssignment(faculty_id=infant_id, subject_id=sub_ssd.id, class_id=class_ce_3rd.id)

        # 4th Year (Semester VII)
        assign_4th_cem = models.SubjectFacultyAssignment(faculty_id=abinaya_id, subject_id=sub_cem.id, class_id=class_ce_4th.id)
        assign_4th_ecv = models.SubjectFacultyAssignment(faculty_id=balamurali_id, subject_id=sub_ecv.id, class_id=class_ce_4th.id)
        assign_4th_cct = models.SubjectFacultyAssignment(faculty_id=balamurali_id, subject_id=sub_cct.id, class_id=class_ce_4th.id)
        assign_4th_pe3 = models.SubjectFacultyAssignment(faculty_id=sangeethavani_id, subject_id=sub_pe3.id, class_id=class_ce_4th.id)
        assign_4th_pe4 = models.SubjectFacultyAssignment(faculty_id=uma_id, subject_id=sub_pe4.id, class_id=class_ce_4th.id)
        assign_4th_ppl = models.SubjectFacultyAssignment(faculty_id=sangeethavani_id, subject_id=sub_ppl.id, class_id=class_ce_4th.id)
        assign_4th_dp = models.SubjectFacultyAssignment(faculty_id=balamurali_id, subject_id=sub_dp.id, class_id=class_ce_4th.id)
        
        db.add_all([
            assign_ce_1st_ds, assign_ce_1st_sm,
            assign_2nd_m3, assign_2nd_sm, assign_2nd_sg, assign_2nd_fm, assign_2nd_oe1, assign_2nd_iks, assign_2nd_ss, assign_2nd_sgl, assign_2nd_sml, assign_2nd_ced, assign_2nd_vpp,
            assign_3rd_sd1, assign_3rd_ee, assign_3rd_ieh, assign_3rd_te, assign_3rd_sa1, assign_3rd_oe3, assign_3rd_cgi, assign_3rd_tel, assign_3rd_eel, assign_3rd_ssd,
            assign_4th_cem, assign_4th_ecv, assign_4th_cct, assign_4th_pe3, assign_4th_pe4, assign_4th_ppl, assign_4th_dp
        ])
        
        # (Default student users Grace Hopper, Ada Lovelace, and John Doe have been removed)

        # Seed new B.Tech Civil Eng 3rd Year students
        ce_students_data = [
            ("24209001", "SANJAY G S"),
            ("24209004", "YOGADARSHANI K"),
            ("24209006", "NANDHA K"),
            ("24209007", "THILAGAVATHI M"),
            ("24209008", "VIJAYVIKAASH V K"),
            ("24209009", "TAMILARASU A"),
            ("24209011", "KAVIN K"),
            ("24209012", "SHIVADHARSHANA K"),
            ("24209013", "CHANDHRU G"),
            ("24209014", "DHAKSHAYANI S"),
            ("24209015", "BHARATHI R"),
            ("24209018", "SRIMATHI R"),
            ("24209019", "MOHITHA S"),
            ("24209020", "AMBEDKAR RAO R"),
            ("24209022", "HARINI B"),
            ("24209023", "VIYASHARMA S"),
            ("24209024", "GOKULAVASANTH P"),
            ("24209025", "RAMALEKSHMLU"),
            ("24209026", "VIMALESH B"),
            ("24209028", "HARISH A"),
            ("24209029", "VARSHA C"),
            ("24209030", "PRAVEEN U"),
            ("24209032", "NARENDRAN L S"),
            ("24209033", "KARIYA PERUMAL R"),
            ("25210001", "BHUBESH K R"),
            ("25210002", "BALAJI G")
        ]
        
        ce_student_profiles = []
        for idx, (roll_no, name) in enumerate(ce_students_data, start=1):
            email = f"s{roll_no}@attendance.com"
            pic_url = None
            if roll_no == "24209024":
                pic_url = "/uploads/gokul.jpg"
            elif roll_no == "25210002":
                pic_url = "/uploads/balaji.jpg"
            elif roll_no == "24209028":
                pic_url = "/uploads/harish.jpg"
                
            user = models.User(
                email=email,
                hashed_password=security.get_password_hash("123456"),
                role="student",
                full_name=name,
                phone=f"555{2000000 + idx}",
                profile_picture_url=pic_url,
                is_active=True
            )
            db.add(user)
            db.flush()
            
            profile = models.Student(
                id=user.id,
                roll_number=roll_no,
                registration_number=f"REG-{roll_no}",
                department_id=ce.id,
                class_id=class_ce_3rd.id,
                academic_year_id=ay.id,
                semester_id=sem.id
            )
            db.add(profile)
            ce_student_profiles.append(profile)
        db.flush()

        # Seed new B.Tech Civil Engineering 2nd Year students from user request
        ce_students_2nd_data = [
            ("25209002", "SUMESH SRINIVAS N"),
            ("25209003", "SRINIKETHANK"),
            ("25209007", "KISHORE KUMAR C"),
            ("25209008", "MITHUL ANKITH II S"),
            ("25209009", "AMSUNDER S"),
            ("25209011", "KRISTIM G"),
            ("25209014", "RAJAKUMAR G"),
            ("25209015", "TUSITTA M"),
            ("25209016", "SHARMILI S"),
            ("25209017", "POOMALA SRIR"),
            ("25209018", "VINITH M"),
            ("25209019", "GURUPRASATH P"),
            ("25209020", "LINGADHARINI K"),
            ("25209021", "BALAJI PRAKASH M"),
            ("25209022", "HARISH V"),
            ("25209023", "HRIPINDIA SHIRJE R"),
            ("25209024", "HARISHMA K S"),
            ("25209025", "ANANYA S"),
            ("25209027", "ELAPINISHA C"),
            ("25209028", "DHARANI SRI K"),
            ("25209029", "MOHAN PRAKASH M"),
            ("25209030", "VIKRAM S"),
            ("25209031", "BEHARATHRAJA S"),
            ("25209033", "GOWTHAM P"),
            ("25209034", "MAHESH J J"),
            ("25209035", "ANTONY SUJAN H")
        ]
        
        ce_2nd_student_profiles = []
        for idx, (roll_no, name) in enumerate(ce_students_2nd_data, start=1):
            if roll_no == "25209002":
                email = "student@attendance.com"
            else:
                email = f"s{roll_no}@attendance.com"
            password_hash = security.get_password_hash("123456")
                
            user = models.User(
                email=email,
                hashed_password=password_hash,
                role="student",
                full_name=name,
                phone=f"555{3000000 + idx}",
                is_active=True
            )
            db.add(user)
            db.flush()
            
            profile = models.Student(
                id=user.id,
                roll_number=roll_no,
                registration_number=f"REG-{roll_no}",
                department_id=ce.id,
                class_id=class_ce_2nd.id,
                academic_year_id=ay.id,
                semester_id=sem.id
            )
            db.add(profile)
            ce_2nd_student_profiles.append(profile)
        db.flush()

        # Seed new B.Tech Civil Engineering 4th Year students from user request
        ce_students_4th_data = [
            ("23209001", "M. Karthika"),
            ("23209004", "P. R. Gopika"),
            ("23209006", "M. Vaishali"),
            ("23209007", "R. Bhuvansankar"),
            ("23209008", "K. Saravana Priya"),
            ("23209009", "C. P. Deepakselva"),
            ("23209011", "K. Vishnuvarthini"),
            ("23209012", "C. Kamalesh"),
            ("23209013", "A. Abinaya"),
            ("23209015", "S. Julbhihar Ahamad"),
            ("23209017", "S. Vishwaguru"),
            ("23209018", "S. Abishek"),
            ("23209019", "K. Durga Sri"),
            ("23209020", "R. Ragavi"),
            ("23209022", "K. Bharanitharan"),
            ("23209023", "M. Vithyapathi"),
            ("23209024", "J. Jeyasuriyan"),
            ("23209026", "G. Nithishwaran"),
            ("23209028", "Harini"),
            ("23209029", "M. Soundara Rajan"),
            ("23209030", "Chiranjeevi"),
            ("23209031", "Nimaleshwar"),
            ("23209032", "Vel Ishwarya"),
            ("23209033", "A. S. Nithilan"),
            ("23209034", "G. Hari Rama Krishnan"),
            ("23209035", "A. Akshaya"),
            ("23209036", "S. Surya"),
            ("23209037", "M. Kishorkumar"),
            ("23209038", "S. Kaviya")
        ]
        
        ce_4th_student_profiles = []
        for idx, (roll_no, name) in enumerate(ce_students_4th_data, start=1):
            email = f"s{roll_no}@attendance.com"
            user = models.User(
                email=email,
                hashed_password=security.get_password_hash(roll_no),
                role="student",
                full_name=name,
                phone=f"555{4000000 + idx}",
                is_active=True
            )
            db.add(user)
            db.flush()
            
            profile = models.Student(
                id=user.id,
                roll_number=roll_no,
                registration_number=f"REG-{roll_no}",
                department_id=ce.id,
                class_id=class_ce_4th.id,
                academic_year_id=ay.id,
                semester_id=sem.id
            )
            db.add(profile)
            ce_4th_student_profiles.append(profile)
        db.flush()

        # Seed official 1st Year B.Tech Civil Engineering students (Batch: 2026-2030)
        ce_students_1st_data = [
            ("26209001", "RAHUL KARTHICK C"),
            ("26209002", "SANGEETHA T"),
            ("26209003", "JAYAVEERAPRAKASAR S"),
            ("26209004", "KALAISELVAN K"),
            ("26209005", "RAJAGAUTHAM P M"),
            ("26209006", "SOOSAIRAJ A"),
            ("26209007", "MOHAMED AZARUDEEN J"),
            ("26209008", "JAYABHARATHI R"),
            ("26209009", "KARLIE KENZIE L G"),
            ("26209010", "SENTHAMIL SELVAN S"),
            ("26209011", "SURYA S"),
            ("26209012", "HARINI T"),
            ("26209013", "ESRON J"),
            ("26209014", "SUSI M"),
            ("26209015", "JAI KRISH S"),
            ("26209016", "JASVANTHIKA M S"),
            ("26209017", "KARTHIKASHRI G"),
            ("26209018", "DEVAMITHA S"),
            ("26209019", "VANISHA S"),
            ("26209020", "MUTHU KUMAR M"),
            ("26209021", "ARAVIND NATARAJAN P"),
            ("26209023", "MEHDI C S"),
            ("26209024", "ARSHARA A S"),
            ("26209025", "THENMUHIL M"),
            ("26209027", "VARSHA M"),
            ("26209028", "MUKUNDAN R V"),
            ("26209029", "PREM T"),
            ("26209030", "POOJA SHREE I"),
            ("26209031", "SAMEEHA FATHIMA A"),
            ("26209032", "RITHISHRAMU R")
        ]
        
        ce_1st_student_profiles = []
        for idx, (roll_no, name) in enumerate(ce_students_1st_data, start=1):
            email = f"s{roll_no}@attendance.com"
            user = models.User(
                email=email,
                hashed_password=security.get_password_hash("123456"),
                role="student",
                full_name=name,
                phone=f"555{1000000 + idx}",
                is_active=True
            )
            db.add(user)
            db.flush()
            
            profile = models.Student(
                id=user.id,
                roll_number=roll_no,
                registration_number=f"REG-{roll_no}",
                department_id=ce.id,
                class_id=class_ce_1st.id,
                academic_year_id=ay.id,
                semester_id=sem.id
            )
            db.add(profile)
            ce_1st_student_profiles.append(profile)
        db.flush()
        
        # (Historical attendance records have been cleared so all students start with zero attendance)
            
        # 11. Announcements
        ann1 = models.Announcement(
            title="End Semester Exams Schedule",
            content="The End Semester Examinations for Semester 1 will commence from December 1st, 2026. Please collect your admit cards.",
            target_role="all",
            created_by=admin.id
        )
        ann2 = models.Announcement(
            title="Faculty Meeting regarding Curriculum",
            content="There will be a faculty review meeting this Friday at 3:00 PM in Conference Room A to discuss next semester's electives.",
            target_role="faculty",
            created_by=admin.id
        )
        db.add_all([ann1, ann2])
        
        # 12. Holidays & Weekends (from today to end of next academic year: June 30, 2027)
        start_date = date(2026, 7, 10)
        end_date = date(2027, 6, 30)
        
        gov_holidays = {
            date(2026, 8, 15): "Independence Day",
            date(2026, 9, 4): "Krishna Janmashtami",
            date(2026, 9, 15): "Milad-un-Nabi",
            date(2026, 10, 2): "Mahatma Gandhi Jayanti",
            date(2026, 10, 22): "Vijayadashami / Dussehra",
            date(2026, 11, 8): "Deepavali (Diwali)",
            date(2026, 11, 24): "Guru Nanak Jayanti",
            date(2026, 12, 25): "Christmas Day",
            date(2027, 1, 1): "New Year's Day",
            date(2027, 1, 14): "Pongal (Tamil Harvest Festival)",
            date(2027, 1, 15): "Mattu Pongal",
            date(2027, 1, 26): "Republic Day",
            date(2027, 3, 8): "Maha Shivratri",
            date(2027, 3, 26): "Good Friday",
            date(2027, 4, 14): "Tamil New Year (Puthandu)",
            date(2027, 5, 1): "May Day",
        }
        
        current_day = start_date
        holiday_objs = []
        added_dates = set()
        
        for h_date, h_name in gov_holidays.items():
            if h_date not in added_dates:
                holiday_objs.append(models.Holiday(
                    name=h_name,
                    date=h_date,
                    description="Government Public Holiday"
                ))
                added_dates.add(h_date)
                
        while current_day <= end_date:
            if current_day.weekday() == 5:
                if current_day not in added_dates:
                    holiday_objs.append(models.Holiday(
                        name="Saturday Weekly Off",
                        date=current_day,
                        description="Weekend Holiday"
                    ))
                    added_dates.add(current_day)
            elif current_day.weekday() == 6:
                if current_day not in added_dates:
                    holiday_objs.append(models.Holiday(
                        name="Sunday Weekly Off",
                        date=current_day,
                        description="Weekend Holiday"
                    ))
                    added_dates.add(current_day)
            current_day += timedelta(days=1)
            
        db.add_all(holiday_objs)
        db.flush()
        
        # 13. Seed student marks
        import random
        all_students = db.query(models.Student).all()
        for stud in all_students:
            # Get subjects assigned to student's class
            assignments = db.query(models.SubjectFacultyAssignment).filter(
                models.SubjectFacultyAssignment.class_id == stud.class_id
            ).all()
            sub_ids = list(set([a.subject_id for a in assignments]))
            for sub_id in sub_ids:
                cfa1_mark = random.randint(32, 48)
                cfa2_mark = random.randint(30, 49)
                mark = models.StudentMark(
                    student_id=stud.id,
                    subject_id=sub_id,
                    cfa1=cfa1_mark,
                    cfa2=cfa2_mark,
                    cfa=cfa1_mark,
                    ese=cfa2_mark
                )
                db.add(mark)
                
        db.commit()
        print("Database seeded successfully!")
        print("\n=== SEEDED STAFF CREDENTIALS ===")
        print("1. Dr. B. Sangeethavani  : b.sangeethavani@ruraluniv.ac.in | sangeetha123")
        print("2. Dr. R. T. Balamurali  : r.t.balamurali@ruraluniv.ac.in | balamurali123")
        print("3. Dr. S. Uma            : sakthi85.env@gmail.com | uma123")
        print("4. Dr. J. Jeseema Nisrin : jeseema.nisrin@gmail.com | jeseema123")
        print("5. Er. K. Infant Xavier  : infant015@gmail.com | infant123")
        print("6. Mr. G. Jegadhesh      : g.jegadhesh@ruraluniv.ac.in | jegadhesh123")
        print("7. Dr. Vinoth            : vinoth@ruraluniv.ac.in | vinoth123")
        print("8. Dr. Rajarajan         : rajarajan@ruraluniv.ac.in | rajarajan123")
        print("9. Dr. Lakshmi           : lakshmi@ruraluniv.ac.in | lakshmi123")
        print("10. Mrs. S. Abinaya      : s.abinaya@ruraluniv.ac.in | abinaya123")
        print("11. Er. P. Marimuthu     : p.marimuthu@ruraluniv.ac.in | marimuthu123")
        print("12. Chemistry Dept       : chemistry@ruraluniv.ac.in | chemistry123")
        print("13. Mrs. N. Bhuvaneswari : n.bhuvaneswari@ruraluniv.ac.in | bhuvaneswari123")
        print("14. Mr. Muthukumar       : muthukumar@ruraluniv.ac.in | muthukumar123")
        print("15. Mr. Mathivanan       : mathivanan@ruraluniv.ac.in | mathivanan123")
        print("===============================\n")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

def auto_seed_if_empty():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_exists = db.query(models.User).filter(models.User.email == "admin@attendance.com").first()
        if not admin_exists:
            print("Database is empty. Automatically seeding initial accounts & data...")
            seed_db(drop_first=False)
        else:
            print("Database already initialized.")
    except Exception as e:
        print(f"Auto-seed check: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db(drop_first=True)

