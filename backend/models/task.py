from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    priority = Column(String, nullable=False)
    deadline = Column(DateTime, nullable=True)

    estimated_minutes = Column(Integer, nullable=True)

    status = Column(String, default="pending", nullable=False)

    created_at = Column(DateTime, nullable=False)