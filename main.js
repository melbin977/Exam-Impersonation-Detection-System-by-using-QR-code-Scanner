document.addEventListener('DOMContentLoaded', function() {
    // Check login status and update UI
    const cookies = document.cookie.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.split('=').map(c => c.trim());
        cookies[name] = value;
        return cookies;
    }, {});
    
    const authLink = document.getElementById('authLink');
    
    if (cookies.loggedIn === 'true') {
        if (cookies.userRole === 'examiner') {
            authLink.textContent = 'Examiner Dashboard';
            authLink.href = 'examiner.html';
        } else if (cookies.userRole === 'student') {
            authLink.textContent = 'Student Dashboard';
            authLink.href = 'student.html';
        }
    } else {
        authLink.textContent = 'Login/Signup';
        authLink.href = 'auth.html';
    }
});