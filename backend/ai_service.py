import ollama


def break_down_task(task):
    prompt = f"""
You are a productivity assistant.

Break the following task into 3 to 7 small, practical, actionable subtasks.

Task:
{task}

Return only the subtasks as a numbered list.
Do not add explanations.
"""

    response = ollama.chat(
        model="llama3.2",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response["message"]["content"]

def create_daily_plan(tasks, available_hours):
    available_minutes = int(available_hours * 60)

    task_list = []

    # Convert task text into individual tasks
    for task in tasks.split(";"):
        task = task.strip()

        if not task:
            continue

        parts = task.split(" - ")

        if len(parts) >= 3:
            task_name = parts[0].strip()
            estimated_minutes = int(
                parts[1].replace("minutes", "").strip()
            )
            priority = parts[2].replace("priority", "").strip().lower()

            task_list.append({
                "name": task_name,
                "minutes": estimated_minutes,
                "priority": priority
            })

    # Priority order
    priority_order = {
        "high": 1,
        "medium": 2,
        "low": 3
    }

    # Sort tasks by priority
    task_list.sort(
        key=lambda task: priority_order.get(
            task["priority"], 4
        )
    )

    selected_tasks = []
    unscheduled_tasks = []

    total_minutes = 0

    # Select only tasks that fit
    for task in task_list:

        if total_minutes + task["minutes"] <= available_minutes:
            selected_tasks.append(task)
            total_minutes += task["minutes"]
        else:
            unscheduled_tasks.append(task)

    # Ask AI for reasons only
    selected_task_text = "\n".join(
        f"- {task['name']} ({task['minutes']} minutes, "
        f"{task['priority']} priority)"
        for task in selected_tasks
    )

    ai_reasons = {}

    if selected_tasks:

        prompt = f"""
You are a productivity assistant.

Give one short reason for each selected task.

Selected tasks:
{selected_task_text}

Return EXACTLY this format:

Task Name: reason

Example:
Complete AI Project: High priority and requires focused work.

Rules:
- Use the exact task name provided.
- Give only one short reason.
- Do not add new tasks.
- Do not remove tasks.
- Do not change task names.
- Do not change estimated times.
- Do not change priorities.
- Do not create a schedule.
"""

    response = ollama.chat(
        model="llama3.2",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    reason_text = response["message"]["content"]

    # Convert AI response into a dictionary
    for line in reason_text.splitlines():

        if ":" in line:
            task_name, reason = line.split(":", 1)

            ai_reasons[task_name.strip()] = reason.strip()

    # Build final plan
    plan = "Today's Plan:\n"

    for index, task in enumerate(selected_tasks, start=1):

        # Use a simple default reason.
        reason = ai_reasons.get(
            task["name"],
            f"{task['priority']} priority"
        )
        plan += (
            f"{index}. {task['name']} - "
            f"{task['minutes']} minutes - "
            f"{reason}\n"
        )

    plan += f"\nTotal planned time: {total_minutes} minutes\n"
    plan += f"Available time: {available_minutes} minutes\n"

    plan += "\nUnscheduled Tasks:\n"

    if unscheduled_tasks:

        for task in unscheduled_tasks:
            plan += (
                f"- {task['name']} - "
                f"Not enough available time\n"
            )

    else:
        plan += "- None\n"

    return plan

def reschedule_tasks(tasks, available_hours):
    available_minutes = int(available_hours * 60)

    task_list = []

    # Convert task text into individual tasks
    for task in tasks.split(";"):
        task = task.strip()

        if not task:
            continue

        parts = task.split(" - ")

        if len(parts) >= 3:
            task_name = parts[0].strip()

            estimated_minutes = int(
                parts[1].replace("minutes", "").strip()
            )

            priority = parts[2].replace("priority", "").strip().lower()

            task_list.append({
                "name": task_name,
                "minutes": estimated_minutes,
                "priority": priority
            })

    # Priority order
    priority_order = {
        "high": 1,
        "medium": 2,
        "low": 3
    }

    # Sort by priority
    task_list.sort(
        key=lambda task: priority_order.get(
            task["priority"], 4
        )
    )

    selected_tasks = []
    unscheduled_tasks = []

    total_minutes = 0

    # Select only tasks that fit
    for task in task_list:

        if total_minutes + task["minutes"] <= available_minutes:
            selected_tasks.append(task)
            total_minutes += task["minutes"]
        else:
            unscheduled_tasks.append(task)

    # Build revised plan
    plan = "Revised Plan:\n"

    for index, task in enumerate(selected_tasks, start=1):

        plan += (
            f"{index}. {task['name']} - "
            f"{task['minutes']} minutes - "
            f"{task['priority']} priority\n"
        )

    plan += f"\nTotal planned time: {total_minutes} minutes\n"
    plan += f"Available time: {available_minutes} minutes\n"

    plan += "\nUnscheduled Tasks:\n"

    if unscheduled_tasks:

        for task in unscheduled_tasks:
            plan += (
                f"- {task['name']} - "
                f"Not enough available time\n"
            )

    else:
        plan += "- None\n"

    return plan