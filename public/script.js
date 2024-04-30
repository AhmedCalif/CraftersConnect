document.getElementById('menu-toggle').addEventListener('click', function(event) {
    event.preventDefault();  
    const sidebar = document.querySelector('.sidebar');
    const container = document.querySelector('.container');
    const header = document.querySelector('.header');
    sidebar.classList.toggle('open');
    container.classList.toggle('open');
    header.classList.toggle('open');
});
