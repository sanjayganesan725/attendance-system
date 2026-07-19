from sqlalchemy.orm import Session
from app.models.models import AuditLog

def log_activity(
    db: Session,
    user_id: str,
    action: str,
    details: str = None,
    ip_address: str = None
):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        details=details,
        ip_address=ip_address
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log
