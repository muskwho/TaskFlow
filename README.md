# TaskFlow — AI Productivity Copilot

TaskFlow is an AI-powered productivity application that helps users organize tasks, break complex work into smaller steps, create personalized daily plans, adapt schedules, and stay focused.

## Features

* **AI Task Breakdown** — Breaks complex tasks into smaller actionable steps.
* **AI Daily Plan** — Creates a personalized plan based on tasks, priorities, estimated time, and available time.
* **AI Rescheduling** — Helps reorganize pending tasks when plans change.
* **Productivity Insights** — Shows completion rate, pending workload, and high-priority tasks.
* **Focus Mode** — Provides a dedicated timer for concentrating on a selected task.
* **Task Management** — Create, complete, and delete tasks.
* **Authentication** — Secure user registration and login using JWT authentication.
* **PostgreSQL Persistence** — Stores user and task data in PostgreSQL.
* **Light/Dark Mode** — Supports a customizable interface theme.
* **Responsive UI** — Works across desktop and mobile screen sizes.

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Python
* FastAPI
* SQLAlchemy
* REST APIs

### Database

* PostgreSQL

### AI

* Ollama
* Llama 3.2

### Authentication

* JWT
* bcrypt / Passlib

## How It Works

TaskFlow combines task management with AI-powered planning.

1. Users create and manage their tasks.
2. Task information such as priority, estimated time, and deadlines is stored in PostgreSQL.
3. AI features process the task information through the backend.
4. Ollama runs the Llama 3.2 model locally for AI-powered task planning.
5. The generated plans and recommendations are returned to the React frontend.
6. Users can adjust their tasks and schedules based on the AI suggestions.

## Project Structure

```text
TaskFlow AI/
├── backend/
│   ├── ai_service.py
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── schemas.py
│   └── models/
│       ├── task.py
│       └── user.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Running Locally

### Prerequisites

Make sure you have:

* Python
* Node.js
* PostgreSQL
* Ollama
* Llama 3.2 model

### Backend

Open a terminal in the project folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
```

On Windows:

```bash
venv\Scripts\activate
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Configure your database connection and other environment variables in a `.env` file.

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The application can then be opened using the local URL provided by Vite.

## AI Model

TaskFlow uses **Llama 3.2 through Ollama** to provide local AI functionality for task breakdown, daily planning, and rescheduling.

Running the model locally keeps the AI workflow independent of external hosted AI APIs.

## Future Improvements

* Calendar integration
* Smarter deadline-aware scheduling
* Improved task prioritization
* More personalized productivity recommendations
* Long-term productivity trends
* Additional AI planning capabilities

## Project

**TaskFlow — AI Productivity Copilot**

Built as an AI productivity application combining task management, intelligent planning, and local AI.
