document.addEventListener('DOMContentLoaded', function() {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const signupRole = document.getElementById('signupRole');
    const aadharGroup = document.getElementById('aadharGroup');
    
    // Tab switching
    loginTab.addEventListener('click', function() {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    });
    
    signupTab.addEventListener('click', function() {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });
    
    // Show Aadhar field only for students
    signupRole.addEventListener('change', function() {
        if (signupRole.value === 'student') {
            aadharGroup.style.display = 'block';
        } else {
            aadharGroup.style.display = 'none';
        }
    });
    
    // Login form submission
    document.getElementById('loginFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;
        
        fetch('api/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email: email,
                password: password,
                role: role
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                if (data.role === 'examiner') {
                    window.location.href = 'examiner.html';
                } else if (data.role === 'student') {
                    window.location.href = 'student.html';
                }
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });
    
    // Signup form submission
    document.getElementById('signupFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const role = document.getElementById('signupRole').value;
        const phone = document.getElementById('signupPhone')?.value || '';
        const aadhar = document.getElementById('signupAadhar')?.value || '';
        
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        fetch('api/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'signup',
                name: name,
                email: email,
                password: password,
                role: role,
                phone: phone
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                if (data.role === 'examiner') {
                    window.location.href = 'examiner.html';
                } else if (data.role === 'student') {
                    window.location.href = 'student.html';
                }
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });
});