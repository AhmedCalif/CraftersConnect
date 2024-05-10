document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-icon');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const submitButton = form.querySelector('button[type="submit"]'); 

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        submitButton.disabled = true; 

        const formData = new FormData(this);
        fetch('/profile/upload-avatar', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            document.querySelector('#profileAvatar').src = data.imageUrl + '?' + new Date().getTime();
            alert('Avatar uploaded successfully!');
        })
        .catch(error => {
            console.error('Error uploading avatar:', error);
            alert(error.message);
        })
        .finally(() => {
            submitButton.disabled = false; 
        });
    });
});