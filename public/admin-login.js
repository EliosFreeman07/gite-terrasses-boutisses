document.getElementById('submitBtn').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        console.log('Status reçu:', response.status, 'URL:', response.url);
        return response.json();
    })
    .then(data => {
        if(data.success) {
            localStorage.setItem('adminToken', data.token);
            window.location.href = '/admin.html';
        } else {
            errorMessage.style.display = 'block';
            errorMessage.textContent = data.message;
        }
    })
});