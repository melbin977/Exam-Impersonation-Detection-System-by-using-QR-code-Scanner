document.addEventListener('DOMContentLoaded', function() {
    // Get exam ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('exam_id');
    
    if (!examId) {
        alert('Invalid exam ID');
        window.location.href = 'examiner.html';
        return;
    }

    let scanner = null;
    const videoElement = document.getElementById('scanner');
    const startButton = document.getElementById('startScanner');
    const studentsList = document.getElementById('studentsList');
    
    // Load exam details
    loadExamDetails(examId);
    
    // Set up scanner
    startButton.addEventListener('click', function() {
        if (scanner) {
            scanner.stop();
            scanner = null;
            startButton.innerHTML = '<i class="fas fa-play"></i> Start Scanner';
            return;
        }
        
        Instascan.Camera.getCameras().then(function (cameras) {
            if (cameras.length > 0) {
                let cameraNames = cameras.map((cam, i) => `${i}: ${cam.name}`).join('\n');
                let selected = prompt(`Choose camera index:\n${cameraNames}`, "0");
                let camera = cameras[parseInt(selected)];
        
                scanner = new Instascan.Scanner({ video: videoElement, mirror: false });
                scanner.addListener('scan', function (content) {
                    processQRCode(content, examId);
                });
                scanner.start(camera);
                startButton.innerHTML = '<i class="fas fa-stop"></i> Stop Scanner';
            } else {
                alert('No cameras found');
            }
        });
    });
});

async function loadExamDetails(examId) {
    try {
        const response = await fetch(`api/exams.php?exam_id=${examId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const exam = data.data[0];
            document.getElementById('examTitle').textContent = exam.exam_name;
            
            const examMeta = document.getElementById('examMeta');
            examMeta.innerHTML = `
                <div><strong>Institute:</strong> ${exam.institute_name}</div>
                <div><strong>Date:</strong> ${formatDate(exam.exam_date)}</div>
                <div><strong>Time:</strong> ${formatTime(exam.exam_time)}</div>
                <div><strong>Venue:</strong> ${exam.exam_venue || 'To be announced'}</div>
            `;
            
            // Load already marked attendance
            loadAttendanceList(examId);
        }
    } catch (error) {
        console.error('Error loading exam details:', error);
    }
}

async function processQRCode(qrData, examId) {
    try {
        // Parse QR data (assuming pipe-delimited format)
        const parts = qrData.split('|').map(part => decodeURIComponent(part));
        if (parts.length < 6) throw new Error('Invalid QR code format');
        
        const ticketId = parts[0];
        const studentId = parts[1];
        const qrExamId = parts[2];
        const studentName = parts[3];
        const examName = parts[4];
        const examDate = parts[5];

        console.log(JSON.stringify({
            ticketId: ticketId,
            studentId: studentId,
            qrExamId: qrExamId,
            studentName: studentName
        }))
        
        // Verify exam ID matches
        if (qrExamId !== examId) {
            alert('This ticket is for a different exam!');
            return;
        }
        
        // Verify registration
        const response = await fetch(`api/verify_attendance.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                exam_id: examId,
                student_id: studentId,
                ticket_id: ticketId
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Add to attendance list
            addStudentToAttendanceList({
                student_id: studentId,
                name: studentName,
                aadhar_number: data.aadhar_number,
                timestamp: new Date().toISOString()
            });
            
            // Play success sound
            playSound('success');
        } else {
            alert(data.message || 'Attendance verification failed');
            playSound('error');
        }
    } catch (error) {
        console.error('Error processing QR code:', error);
        alert('Invalid QR code: ' + error.message);
        playSound('error');
    }
}

function addStudentToAttendanceList(student) {
    const studentsList = document.getElementById('studentsList');
    
    // Remove empty state if present
    const emptyState = studentsList.querySelector('.empty-state');
    if (emptyState) {
        studentsList.removeChild(emptyState);
    }
    
    // Create student card
    const studentCard = document.createElement('div');
    studentCard.className = 'student-card';
    studentCard.innerHTML = `
        <div class="student-info">
            <div class="student-name">${student.name}</div>
            <div class="student-meta">Aadhar: ${student.aadhar_number}</div>
        </div>
        <div class="student-time">${formatTime(student.timestamp)}</div>
    `;
    
    // Add to top of list
    studentsList.insertBefore(studentCard, studentsList.firstChild);
}

async function loadAttendanceList(examId) {
    try {
        const response = await fetch(`api/get_attendance.php?exam_id=${examId}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.attendance.length > 0) {
            const studentsList = document.getElementById('studentsList');
            studentsList.innerHTML = '';
            
            data.attendance.forEach(student => {
                addStudentToAttendanceList(student);
            });
        }
    } catch (error) {
        console.error('Error loading attendance list:', error);
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function playSound(type) {
    const audio = new Audio();
    audio.src = type === 'success' ? 
        'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3' :
        'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3';
    audio.play();
}