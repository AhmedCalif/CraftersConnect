// error messages for login 


async function userValidation (user, password) {
    try {
        const validateUser = await fetch('/auth/login', {
            query: user,
            query: password,
            method: 'POST'
        });
        if (!validateUser.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await validateUser.json();
        console.log(data)
        if (data.error) {
            alert(data.error);
        }
        return data;
    } catch (error) {
        console.error('Error validating user:', error);
    }
}
const form = document.querySelector('form');
const username = document.getElementById('username');
const password = document.getElementById('password');

form.addEventListener('submit', (event) => {
    if (username.value.length < 2) {
        event.preventDefault();
        alert('Username must be at least 2 characters long');
    } 
    if(password.value.length < 2) {
        event.preventDefault();
        alert('Password must be at least 2 characters long');
    }
    if(!username) {
        event.preventDefault();
        alert('Username is required');
    }
    if(!password) {
        event.preventDefault();
        alert('Password is required');
    }
}
);