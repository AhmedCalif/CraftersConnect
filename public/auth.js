document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to login');
        }
        return response.text();
    })
    .then(result => {
        if (result.startsWith('Error')) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: result
            });
        } else {
            window.location.href = '/home/dashboard'; 
        }
    })
    .catch(error => {
        Swal.fire({
            icon: 'error',
            title: 'Login Error',
            text: 'Please check your credentials and try again!'
        });
    });
});