
import io
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import models
from app.auth.auth_handler import get_current_user
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

@router.get("/export")
def export_attendance_report(
    format: str = Query(..., regex="^(csv|excel|pdf)$"),
    class_id: Optional[str] = Query(None),
    subject_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify authorization
    # Admins and Faculty can export reports; Students can only export their own reports
    if current_user.role == "student" and student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Students can only download their own reports")

    # Build query
    query = db.query(models.Attendance)
    if class_id:
        query = query.filter(models.Attendance.class_id == class_id)
    if subject_id:
        query = query.filter(models.Attendance.subject_id == subject_id)
    if student_id:
        query = query.filter(models.Attendance.student_id == student_id)
    if start_date:
        query = query.filter(models.Attendance.date >= start_date)
    if end_date:
        query = query.filter(models.Attendance.date <= end_date)
        
    records = query.order_by(models.Attendance.date.asc()).all()
    
    if not records:
        raise HTTPException(status_code=404, detail="No attendance records found matching filters")
        
    # Process into flat list of dicts for export
    data = []
    for r in records:
        data.append({
            "Date": r.date.strftime("%Y-%m-%d"),
            "Period": r.period,
            "Student Name": r.student.user.full_name,
            "Roll Number": r.student.roll_number,
            "Registration No": r.student.registration_number,
            "Class": r.class_.name,
            "Subject": f"{r.subject.name} ({r.subject.code})",
            "Status": r.status,
            "Remarks": r.remarks or "",
            "Marked By": r.marker.full_name
        })
        
    df = pd.DataFrame(data)

    if format == "csv":
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=attendance_report.csv"
        return response
        
    elif format == "excel":
        stream = io.BytesIO()
        with pd.ExcelWriter(stream, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Attendance Report", index=False)
        stream.seek(0)
        response = StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response.headers["Content-Disposition"] = "attachment; filename=attendance_report.xlsx"
        return response
        
    elif format == "pdf":
        stream = io.BytesIO()
        doc = SimpleDocTemplate(stream, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            name='TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#111827"),
            spaceAfter=12
        )
        meta_style = ParagraphStyle(
            name='MetaStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#4B5563"),
            spaceAfter=15
        )
        
        story.append(Paragraph("Attendance Management System Report", title_style))
        story.append(Paragraph(f"Generated on: {date.today().strftime('%Y-%m-%d')} | Records Found: {len(records)}", meta_style))
        story.append(Spacer(1, 10))
        
        # Prepare table
        headers = ["Date", "Period", "Student Name", "Roll No", "Class", "Subject", "Status"]
        table_data = [headers]
        for item in data:
            table_data.append([
                item["Date"],
                str(item["Period"]),
                item["Student Name"][:20],  # Truncate to fit table
                item["Roll Number"][:10],
                item["Class"][:15],
                item["Subject"][:20],
                item["Status"]
            ])
            
        col_widths = [55, 35, 95, 60, 75, 115, 65]
        t = Table(table_data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#111827")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 9),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('TOPPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E5E7EB")),
            ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,1), (-1,-1), 8),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F9FAFB")]),
            ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor("#374151")),
            ('BOTTOMPADDING', (0,1), (-1,-1), 4),
            ('TOPPADDING', (0,1), (-1,-1), 4),
        ]))
        
        story.append(t)
        doc.build(story)
        stream.seek(0)
        
        response = StreamingResponse(stream, media_type="application/pdf")
        response.headers["Content-Disposition"] = "attachment; filename=attendance_report.pdf"
        return response
