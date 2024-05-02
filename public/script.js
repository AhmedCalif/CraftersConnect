document.getElementById('menu-toggle').addEventListener('click', function(event) {
    event.preventDefault();  
    const sidebar = document.querySelector('.sidebar');
    const container = document.querySelector('.container');
    const header = document.querySelector('.header');
    sidebar.classList.toggle('open');
    container.classList.toggle('open');
    header.classList.toggle('open');
});


function likePost(index) {
    fetch(`/like/${index}`, { method: 'POST' })
        .then(response => response.text())
        .then(data => {
            document.getElementById(`likes-count-${index}`).innerText = data.match(/\d+$/)[0];
        })
        .catch(error => console.error('Error liking the post:', error));
}