document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-icon');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        if (sidebar.classList.contains('open')) {
            mainContent.style.marginLeft = '250px';
        } else {
            mainContent.style.marginLeft = '0';
        }
    });
});
