
// sidebar
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function(event) {
            event.preventDefault();
            const sidebar = document.querySelector('.sidebar');
            const container = document.querySelector('.container');
            const header = document.querySelector('.header');

            if (sidebar && container && header) {
                sidebar.classList.toggle('open');
                container.classList.toggle('open');
                header.classList.toggle('open');
            } else {
                console.error('One or more elements are missing!');
            }
        });
    } else {
        console.error('Menu toggle button not found!');
    }
});

// like Posts

async function likePost(postId) {
    try {
        console.log('postId:', postId);
        console.log('Liking post:', postId);
        const response = await fetch(`/posts/like/${postId}`, {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        const data = await response.json();
        const likesCountElement = document.getElementById(`likes-count-${postId}`);
        if (likesCountElement) {
            likesCountElement.innerText = data.likes;
        }
    } catch (error) {
        console.error('Error liking the post:', error);
        alert('Failed to like the post.');
    }
}

// delete post 
async function deletePost(postId) {
    try {
        console.log('postId:', postId);
        console.log('Deleting post:', postId);
        const response = await fetch(`/posts/delete/${postId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        const data = await response.json();
        console.log('Post deleted:', data);
        
        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
            postElement.remove(); 
        }
        alert(data.message || 'Post successfully deleted');
    } catch (error) {
        console.error('Error deleting the post:', error);
        alert('Failed to delete the post.'); 
    }
}


//  prevent creating multiple posts

