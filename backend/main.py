from fastapi import FastAPI, Depends, Body, HTTPException
from auth import hash_password, verify_password, create_access_token
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from database import engine, Base, SessionLocal 
from models import User, Task
from schemas import TaskCreate, TaskUpdate

from ai_service import break_down_task, create_daily_plan, reschedule_tasks

from fastapi.security import OAuth2PasswordBearer
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt, JWTError
from auth import SECRET_KEY, ALGORITHM

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        user = db.query(User).filter(
            User.id == int(user_id)
        ).first()

        if user is None:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        return user

    except (JWTError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

@app.post("/register")
def register(
    name: str = Body(...),
    email: str = Body(...),
    password: str = Body(...),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    password_hash = hash_password(password)

    new_user = User(
        name=name,
        email=email,
        password_hash=password_hash
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "name": new_user.name,
        "email": new_user.email
    }

@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "sub": str(user.id)
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name
    }

@app.get("/")

def home():
    return {
        "message": "AI Productivity Copilot API is running!",
        "database": "Connected"
    }

@app.post("/users")
def create_user(
    name: str,
    email: str,
    password_hash: str,
    db: Session = Depends(get_db)
):
    new_user = User(
        name=name,
        email=email,
        password_hash=password_hash
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/tasks")
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_task = Task(
        user_id=current_user.id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        deadline=task.deadline,
        estimated_minutes=task.estimated_minutes,
        status="pending",
        created_at=datetime.now()
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task

@app.get("/tasks")
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id
    ).all()

    return tasks

@app.get("/tasks/{task_id}")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task

@app.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()

    if task is None:
        return {"message": "Task not found"}

    if task_update.title is not None:
        task.title = task_update.title

    if task_update.description is not None:
        task.description = task_update.description

    if task_update.priority is not None:
        task.priority = task_update.priority

    if task_update.deadline is not None:
        task.deadline = task_update.deadline

    if task_update.estimated_minutes is not None:
        task.estimated_minutes = task_update.estimated_minutes

    if task_update.status is not None:
        task.status = task_update.status

    db.commit()
    db.refresh(task)

    return task

@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }

@app.put("/tasks/{task_id}/complete")
def complete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    task.status = "completed"

    db.commit()
    db.refresh(task)

    return task

@app.post("/ai/breakdown")
def ai_breakdown(
    task: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    result = break_down_task(task)

    return {
        "task": task,
        "breakdown": result
    }

@app.post("/ai/daily-plan")
def ai_daily_plan(
    tasks: str = Body(...),
    available_hours: float = Body(...),
    current_user: User = Depends(get_current_user)
):
    result = create_daily_plan(
        tasks,
        available_hours
    )

    return {
        "tasks": tasks,
        "available_hours": available_hours,
        "plan": result
    }

@app.post("/ai/reschedule")
def ai_reschedule(
    tasks: str = Body(...),
    available_hours: float = Body(...),
    current_user: User = Depends(get_current_user)
):
    result = reschedule_tasks(
        tasks,
        available_hours
    )

    return {
        "tasks": tasks,
        "available_hours": available_hours,
        "plan": result
    }

@app.get("/productivity/insights")
def productivity_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id
    ).all()

    total_tasks = len(tasks)

    completed_tasks = sum(
        1 for task in tasks
        if task.status == "completed"
    )

    pending_tasks = total_tasks - completed_tasks

    completion_rate = (
        round((completed_tasks / total_tasks) * 100)
        if total_tasks > 0
        else 0
    )

    pending_minutes = sum(
        task.estimated_minutes or 0
        for task in tasks
        if task.status != "completed"
    )

    high_priority_pending = sum(
        1 for task in tasks
        if task.status != "completed"
        and task.priority.lower() == "high"
    )

    medium_priority_pending = sum(
        1 for task in tasks
        if task.status != "completed"
        and task.priority.lower() == "medium"
    )

    low_priority_pending = sum(
        1 for task in tasks
        if task.status != "completed"
        and task.priority.lower() == "low"
    )

    if total_tasks == 0:
        insight = "Start by adding your first task to begin tracking your productivity."

    elif completion_rate == 100:
        insight = "Excellent! You've completed all your tasks."

    elif high_priority_pending > 0:
        insight = (
            f"You have {high_priority_pending} high-priority "
            "task(s) pending. Consider focusing on them first."
        )

    elif completion_rate >= 70:
        insight = (
            "Great progress! You're completing most of your planned work."
        )

    elif completion_rate >= 40:
        insight = (
            "You're making steady progress. Focus on completing "
            "your remaining tasks."
        )

    else:
        insight = (
            "You have several tasks remaining. Try breaking larger "
            "tasks into smaller actionable steps."
        )

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "completion_rate": completion_rate,
        "pending_minutes": pending_minutes,
        "high_priority_pending": high_priority_pending,
        "medium_priority_pending": medium_priority_pending,
        "low_priority_pending": low_priority_pending,
        "insight": insight
    }