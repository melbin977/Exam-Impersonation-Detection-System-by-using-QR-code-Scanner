document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in and is student
    if (!document.cookie.includes('loggedIn=true') || !document.cookie.includes('userRole=student')) {
        window.location.href = 'auth.html';
        return;
    }

    // Get user ID from cookies
    const cookies = document.cookie.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.split('=').map(c => c.trim());
        cookies[name] = value;
        return cookies;
    }, {});

    const userId = cookies.userId;
    let currentExamId = null;
    let currentAadhar = null;

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function () {
        window.location.href = 'logout.php';
    });

    // OTP Modal elements
    const otpModal = document.getElementById('otpModal');
    const closeModal = document.querySelector('.close');
    const otpForm = document.getElementById('otpForm');
    const resendOtpBtn = document.getElementById('resendOtp');

    closeModal.addEventListener('click', () => {
        otpModal.classList.add('hidden');
    });

    // Load exams immediately on page load
    loadExams();

    // Function to load exams from database
    // Modify the loadExams function
    async function loadExams() {
        try {
            const response = await fetch('api/exams.php');
            const data = await response.json();

            if (data.status === 'success') {
                // Update exam dropdown
                const examSelect = document.getElementById('examSelect');
                examSelect.innerHTML = '<option value="">-- Select Exam --</option>';

                // Separate available and registered exams
                const availableExams = [];
                const registeredExams = [];

                data.data.forEach(exam => {
                    if (exam.is_registered) {
                        registeredExams.push(exam);
                    } else {
                        availableExams.push(exam);
                    }
                });

                // Populate available exams dropdown
                availableExams.forEach(exam => {
                    const option = document.createElement('option');
                    option.value = exam.exam_id;
                    option.textContent = `${exam.exam_name} (${formatDate(exam.exam_date)})`;
                    examSelect.appendChild(option);
                });

                // Display registered exams
                displayRegisteredExams(registeredExams);

            } else {
                console.error('Failed to load exams:', data.message);
            }
        } catch (error) {
            console.error('Error loading exams:', error);
        }
    }

    // New function to display registered exams
    function displayRegisteredExams(exams) {
        const container = document.getElementById('registeredExamsList');
        container.innerHTML = '';
        
        if (exams.length === 0) {
            container.innerHTML = '<div class="no-exams">No registered exams found</div>';
            return;
        }
        
        exams.forEach(exam => {
            const card = document.createElement('div');
            card.className = 'registered-exam-card';
            
            card.innerHTML = `
                <h3>${exam.exam_name}</h3>
                <div class="exam-meta">
                    <div class="exam-meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${formatDate(exam.exam_date)}</span>
                    </div>
                    <div class="exam-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${formatTime(exam.exam_time)}</span>
                    </div>
                    <div class="exam-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${exam.exam_venue || 'To be announced'}</span>
                    </div>
                </div>
                <div class="exam-actions">
                    <button class="view-ticket-btn" data-ticket-id="${exam.ticket_id}">
                        <i class="fas fa-ticket-alt"></i>
                        View Hall Ticket
                    </button>
                </div>
            `;
            
            container.appendChild(card);
        });
        
        // Add event listeners to view ticket buttons
        document.querySelectorAll('.view-ticket-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const ticketId = this.getAttribute('data-ticket-id');
                window.open(`confirmation.html?ticket_id=${ticketId}`, '_blank');
            });
        });
    }

    // Add these date formatting helpers if not already present
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

    // Handle exam selection
    document.getElementById('examSelect').addEventListener('change', async function () {
        const examId = this.value;
        const examDetails = document.getElementById('examDetails');

        if (!examId) {
            examDetails.classList.add('hidden');
            return;
        }

        try {
            const response = await fetch('api/exams.php');
            const data = await response.json();

            if (data.status === 'success') {
                const exam = data.data.find(e => e.exam_id == examId);
                if (exam) {
                    document.getElementById('examTitle').textContent = exam.exam_name;
                    document.getElementById('instituteName').textContent = exam.institute_name || 'Not specified';
                    document.getElementById('examDate').textContent = exam.exam_date;
                    document.getElementById('examTime').textContent = exam.exam_time;
                    document.getElementById('lastRegDate').textContent = exam.last_registration_day;

                    // Update form with exam ID
                    document.getElementById('aadharForm').dataset.examId = examId;

                    // Show details
                    examDetails.classList.remove('hidden');
                }
            } else {
                console.error('Failed to load exam details:', data.message);
            }
        } catch (error) {
            console.error('Error loading exam details:', error);
        }
    });

    // Handle Aadhar form submission
    document.getElementById('aadharForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        currentExamId = this.dataset.examId;
        currentAadhar = document.getElementById('aadharNumber').value;

        if (!currentExamId) {
            alert('Please select an exam first');
            return;
        }

        if (!/^\d{12}$/.test(currentAadhar)) {
            alert('Please enter a valid 12-digit Aadhar number');
            return;
        }

        // Show OTP modal and send OTP
        otpModal.classList.remove('hidden');

        try {
            await sendOtp(userId);
            alert('OTP sent to your registered email!');
        } catch (error) {
            console.error('Error sending OTP:', error);
            alert('Failed to send OTP. Please try again.');
        }
    });

    // OTP form submission
    otpForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const otp = document.getElementById('otpInput').value;

        if (!otp || !/^\d{6}$/.test(otp)) {
            alert('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            await verifyOtp(userId, otp);
            await completeRegistration(userId, currentExamId, currentAadhar);

            otpModal.classList.add('hidden');
            document.getElementById('otpInput').value = '';

            alert('Registration successful!');
            document.getElementById('aadharForm').reset();
            loadExams(); // Refresh exam list
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Registration failed');
        }
    });

    // Resend OTP
    resendOtpBtn.addEventListener('click', async function () {
        try {
            await sendOtp(userId);
            alert('New OTP sent successfully!');
        } catch (error) {
            console.error('Error resending OTP:', error);
            alert('Failed to resend OTP. Please try again.');
        }
    });

    // Helper function to send OTP
    async function sendOtp(userId) {
        try {
            const response = await fetch('api/send_otp.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId
                })
            });

            // First check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned unexpected response');
            }

            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to send OTP');
            }

            return data;
        } catch (error) {
            console.error('Error in sendOtp:', error);
            throw error; // Re-throw for calling function to handle
        }
    }

    // Helper function to verify OTP
    async function verifyOtp(userId, otp) {
        const response = await fetch('api/verify_otp.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                otp: otp
            })
        });

        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'OTP verification failed');
        }
    }

    // Helper function to complete registration
    // Modify the completeRegistration function
    async function completeRegistration(userId, examId, aadharNumber) {
        const response = await fetch('api/registration.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                exam_id: examId,
                aadhar_number: aadharNumber
            })
        });

        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Registration failed');
        }

        // Redirect to confirmation page
        window.location.href = `confirmation.html?ticket_id=${data.ticket_id}`;
    }
});