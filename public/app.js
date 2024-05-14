document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-icon');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const avatarImage = document.getElementById('profileAvatar');
    const fileInput = document.getElementById('avatarInput');

    avatarImage.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            let reader = new FileReader();
            reader.onload = function(e) {
                avatarImage.src = e.target.result; 
            };
            reader.readAsDataURL(this.files[0]); 
        }
    });

    // Handling the form submission
    const form = document.getElementById('avatarForm');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the form from submitting traditionally
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
            }

            const formData = new FormData(this);
            fetch('/profile/upload-avatar', {
                method: 'POST',
                body: formData,
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.imageUrl) {
                    console.log('Avatar uploaded:', data);
                    document.querySelector('#profileAvatar').src = data.imageUrl + '?' + new Date().getTime();
                    alert('Avatar uploaded successfully!');
                } else {
                    throw new Error('Image URL not provided in response.');
                }
            })
            .catch(error => {
                console.error('Error uploading avatar:', error);
                alert(error.message);
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            });
        });
    }
});




// profile toggle
document.addEventListener('DOMContentLoaded', function() {
    const toggles = document.querySelectorAll('.accordion-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            document.querySelectorAll('.panel').forEach(panel => {
                if (panel !== this.nextElementSibling) {
                    panel.style.display = 'none'; 
                    panel.previousElementSibling.classList.remove('active');
                }
            });
            let panel = this.nextElementSibling;
            if (panel.style.display === "block") {
                panel.style.display = "none";
                this.classList.remove('active'); 
            } else {
                panel.style.display = "block";
                this.classList.add('active'); 
            }
        });
    });
});