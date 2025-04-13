document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is examiner
    if (!document.cookie.includes('loggedIn=true') || !document.cookie.includes('userRole=examiner')) {
        window.location.href = 'auth.html';
        return;
    }
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        window.location.href = 'logout.php';
    });
    
    // Toggle exam form
    document.getElementById('addExamBtn').addEventListener('click', function() {
        document.getElementById('examForm').classList.toggle('hidden');
    });
    
    // Handle exam form submission
    document.getElementById('newExamForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const examData = {
            exam_name: document.getElementById('examTitle').value,
            institute_name: document.getElementById('instituteName').value,
            exam_date: document.getElementById('examDate').value,
            exam_time: document.getElementById('examTime').value,
            exam_venue: document.getElementById('examVenue').value,
            last_registration_day: document.getElementById('lastRegDate').value
        };
        
        createExam(examData);
    });
    
    // Load exams
    loadExams();
});

async function loadExams() {
    try {
        console.log("hello");
        const response = await fetch('api/exams.php');
        const data = await response.json();
        
        if (data.status === 'success') {
            const examsList = document.getElementById('examsList');
            examsList.innerHTML = '';
            
            if (data.data.length === 0) {
                examsList.innerHTML = '<div class="no-exams">No exams created yet</div>';
                return;
            }
            
            data.data.forEach(exam => {
                const examCard = document.createElement('div');
                examCard.className = 'exam-card';
                examCard.innerHTML = `
                    <h3>${exam.exam_name}</h3>
                    <div class="exam-meta">
                        <div><strong>Institute:</strong> ${exam.institute_name}</div>
                        <div><strong>Date:</strong> ${formatDate(exam.exam_date)}</div>
                        <div><strong>Time:</strong> ${formatTime(exam.exam_time)}</div>
                        <div><strong>Last Registration:</strong> ${formatDate(exam.last_registration_day)}</div>
                        <div><strong>Exam ID:</strong> ${exam.exam_id}</div>
                    </div>
                    <div class="exam-actions">
                        <button class="btn secondary mark-attendance" data-exam-id="${exam.exam_id}">
                            <i class="fas fa-user-check"></i> Mark Attendance
                        </button>
                        <button class="btn danger delete-exam" data-exam-id="${exam.exam_id}">
                            <i class="fas fa-trash"></i> Delete Exam
                        </button>
                    </div>
                `;
                examsList.appendChild(examCard);
            });
            
            // Add event listeners to buttons
            document.querySelectorAll('.mark-attendance').forEach(btn => {
                btn.addEventListener('click', function() {
                    const examId = this.getAttribute('data-exam-id');
                    window.location.href = `attendance.html?exam_id=${examId}`;
                });
            });
            
            document.querySelectorAll('.delete-exam').forEach(btn => {
                btn.addEventListener('click', function() {
                    const examId = this.getAttribute('data-exam-id');
                    if (confirm('Are you sure you want to delete this exam?')) {
                        deleteExam(examId);
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

async function createExam(examData) {
    try {
        const response = await fetch('api/exams.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(examData)
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Exam created successfully!');
            document.getElementById('newExamForm').reset();
            document.getElementById('examForm').classList.add('hidden');
            loadExams();
        } else {
            alert(data.message || 'Failed to create exam');
        }
    } catch (error) {
        console.error('Error creating exam:', error);
        alert('Failed to create exam. Please try again.');
    }
}

async function deleteExam(examId) {
    try {
        const response = await fetch(`api/exams.php?exam_id=${examId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Exam deleted successfully!');
            loadExams();
        } else {
            alert(data.message || 'Failed to delete exam');
        }
    } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Failed to delete exam. Please try again.');
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}