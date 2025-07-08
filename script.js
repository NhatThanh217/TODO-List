document.addEventListener('DOMContentLoaded', () => {
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskDueDateInput = document.getElementById('taskDueDate');
    const taskPrioritySelect = document.getElementById('taskPriority');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const priorityFilterSelect = document.getElementById('priorityFilter');
    const currentDateTimeDisplay = document.getElementById('currentDateTime'); // NEW: Get the display element

    // Modal elements
    const editTaskModal = document.getElementById('editTaskModal');
    const closeButton = editTaskModal.querySelector('.close-button');
    const editTaskId = document.getElementById('editTaskId');
    const editTaskTitleInput = document.getElementById('editTaskTitle');
    const editTaskDescriptionInput = document.getElementById('editTaskDescription');
    const editTaskDueDateInput = document.getElementById('editTaskDueDate');
    const editTaskPrioritySelect = document.getElementById('editTaskPriority');
    const saveEditBtn = document.getElementById('saveEditBtn');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentCompletionFilter = 'all';
    let currentPriorityFilter = 'all-priorities';

    // NEW: Function to update current date and time display
    const updateDateTime = () => {
        const now = new Date();
        const optionsDate = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const optionsTime = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true // For AM/PM format
        };

        const dateString = now.toLocaleDateString(undefined, optionsDate);
        const timeString = now.toLocaleTimeString(undefined, optionsTime);

        currentDateTimeDisplay.textContent = `${dateString}, ${timeString}`;
    };

    // Initial call to display date and time
    updateDateTime();
    // Update every second
    setInterval(updateDateTime, 1000);


    // Function to save tasks to localStorage
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // Helper to format date for display (remains the same)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Function to render tasks (remains the same)
    const renderTasks = () => {
        taskList.innerHTML = ''; // Clear current list

        let filteredTasks = tasks.filter(task => {
            const matchesCompletion = (currentCompletionFilter === 'all') ||
                                      (currentCompletionFilter === 'pending' && !task.completed) ||
                                      (currentCompletionFilter === 'completed' && task.completed);

            const matchesPriority = (currentPriorityFilter === 'all-priorities') ||
                                    (task.priority === currentPriorityFilter);

            return matchesCompletion && matchesPriority;
        });

        // Sort tasks (e.g., by due date, then priority, then completion)
        filteredTasks.sort((a, b) => {
            // Completed tasks go to the bottom
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;

            // Sort by due date (tasks with no due date go last)
            if (a.dueDate && b.dueDate) {
                const dateA = new Date(a.dueDate);
                const dateB = new Date(b.dueDate);
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA - dateB;
                }
            } else if (a.dueDate && !b.dueDate) {
                return -1;
            } else if (!a.dueDate && b.dueDate) {
                return 1;
            }

            // Then by priority (High > Medium > Low)
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;

            // Finally, by title if all else is equal
            return a.title.localeCompare(b.title);
        });


        if (filteredTasks.length === 0 && currentCompletionFilter === 'all' && currentPriorityFilter === 'all-priorities') {
            const noTasksMessage = document.createElement('li');
            noTasksMessage.className = 'no-tasks-message';
            noTasksMessage.innerHTML = '<i class="fas fa-clipboard-check"></i> No tasks yet! Add one above.';
            taskList.appendChild(noTasksMessage);
            return;
        } else if (filteredTasks.length === 0) {
            const noFilteredTasksMessage = document.createElement('li');
            noFilteredTasksMessage.className = 'no-tasks-message';
            noFilteredTasksMessage.innerHTML = `<i class="fas fa-info-circle"></i> No tasks matching the current filters.`;
            taskList.appendChild(noFilteredTasksMessage);
            return;
        }

        filteredTasks.forEach(task => {
            const listItem = document.createElement('li');
            listItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            listItem.setAttribute('data-id', task.id);

            const dueDateHtml = task.dueDate
                ? `<span class="task-due-date"><i class="far fa-calendar-alt"></i> ${formatDate(task.dueDate)}</span>`
                : '';

            const descriptionHtml = task.description
                ? `<p class="task-description">${task.description}</p>`
                : '';

            listItem.innerHTML = `
                <div class="task-content">
                    <div class="task-checkbox">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="task-details-wrapper">
                        <h3 class="task-title">${task.title}</h3>
                        ${descriptionHtml}
                        <div class="task-meta">
                            ${dueDateHtml}
                            <span class="priority-indicator ${task.priority}">${task.priority}</span>
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            taskList.appendChild(listItem);
        });
    };

    // Function to add a new task (remains the same)
    const addTask = () => {
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const dueDate = taskDueDateInput.value;
        const priority = taskPrioritySelect.value;

        if (title !== '') {
            const newTask = {
                id: Date.now(),
                title: title,
                description: description,
                dueDate: dueDate,
                priority: priority,
                completed: false
            };
            tasks.push(newTask);
            saveTasks();
            taskTitleInput.value = '';
            taskDescriptionInput.value = '';
            taskDueDateInput.value = '';
            taskPrioritySelect.value = 'medium';
            renderTasks();
        } else {
            alert('Please enter a task title!');
        }
    };

    // Function to toggle task completion (remains the same)
    const toggleTaskCompletion = (id) => {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
        }
    };

    // Function to delete a task (remains the same)
    const deleteTask = (id) => {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        }
    };

    // Function to open the edit modal (remains the same)
    const openEditModal = (id) => {
        const taskToEdit = tasks.find(task => task.id === id);
        if (taskToEdit) {
            editTaskId.value = taskToEdit.id;
            editTaskTitleInput.value = taskToEdit.title;
            editTaskDescriptionInput.value = taskToEdit.description;
            editTaskDueDateInput.value = taskToEdit.dueDate;
            editTaskPrioritySelect.value = taskToEdit.priority;
            editTaskModal.style.display = 'block';
        }
    };

    // Function to save edited task (remains the same)
    const saveEditedTask = () => {
        const id = parseInt(editTaskId.value);
        const taskIndex = tasks.findIndex(task => task.id === id);

        if (taskIndex > -1) {
            tasks[taskIndex].title = editTaskTitleInput.value.trim();
            tasks[taskIndex].description = editTaskDescriptionInput.value.trim();
            tasks[taskIndex].dueDate = editTaskDueDateInput.value;
            tasks[taskIndex].priority = editTaskPrioritySelect.value;

            if (tasks[taskIndex].title === '') {
                alert('Task title cannot be empty!');
                return;
            }

            saveTasks();
            renderTasks();
            editTaskModal.style.display = 'none';
        }
    };

    // Event delegation for tasks (toggling completion, editing, and deleting) (remains the same)
    taskList.addEventListener('click', (event) => {
        const clickedElement = event.target;
        const taskItem = clickedElement.closest('.task-item');

        if (!taskItem) return;

        const taskId = parseInt(taskItem.dataset.id);

        if (clickedElement.closest('.delete-btn')) {
            deleteTask(taskId);
        } else if (clickedElement.closest('.edit-btn')) {
            openEditModal(taskId);
        } else if (clickedElement.closest('.task-content')) {
            toggleTaskCompletion(taskId);
        }
    });


    // Event listeners for filter buttons (completion status) (remains the same)
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCompletionFilter = button.dataset.filter;
            renderTasks();
        });
    });

    // Event listener for priority filter select (remains the same)
    priorityFilterSelect.addEventListener('change', (event) => {
        currentPriorityFilter = event.target.value;
        renderTasks();
    });

    // Event listener for Add Task button (remains the same)
    addTaskBtn.addEventListener('click', addTask);

    // Event listener for Enter key in task title input field (remains the same)
    taskTitleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Modal close button (remains the same)
    closeButton.addEventListener('click', () => {
        editTaskModal.style.display = 'none';
    });

    // Close modal if user clicks outside of it (remains the same)
    window.addEventListener('click', (event) => {
        if (event.target === editTaskModal) {
            editTaskModal.style.display = 'none';
        }
    });

    // Save edited task button (remains the same)
    saveEditBtn.addEventListener('click', saveEditedTask);

    // Initial render of tasks when the page loads (remains the same)
    renderTasks();
});