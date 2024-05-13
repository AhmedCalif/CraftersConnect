// Sidebar toggle
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

// Like posts
async function likePost(id) {
    try {
        console.log('Liking post:', id);
        const response = await fetch(`/posts/like/${id}`, { method: 'POST' });
        if (!response.ok) {
            if (response.status === 409) {
                alert("You have already liked this post.");
            } else {
                throw new Error('Network response was not ok');
            }
        }
        const data = await response.json();
        const likesCountElement = document.getElementById(`likes-count-${id}`);
        if (likesCountElement && typeof data.likes === 'number') {
            likesCountElement.innerText = data.likes;
        } else {
            console.error('Invalid likes count received:', data.likes);
        }
    } catch (error) {
        console.error('Error liking the post:', error);
    }
}

// Update post count decrement
function updatePostCount() {
    const countElement = document.getElementById('post-count');
    if (countElement) {
        let currentCount = parseInt(countElement.textContent, 10);
        if (currentCount > 0) {
            countElement.textContent = currentCount - 1; 
        }
    }
}

// Delete post
async function deletePost(postId) {
    try {
        console.log('Deleting post with ID:', postId);
        const response = await fetch(`/posts/${postId}`, {
            method: 'DELETE', 
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const data = await response.json(); 
            alert(data.message || 'Failed to delete the post, please try again later.');
            throw new Error(data.message || 'Server responded with an error.');
        }
        const data = await response.json();
        console.log('Post deleted:', data);

        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
            postElement.remove();
        } else {
            console.error('Failed to find the post element:', `post-${postId}`);
        }
        alert(data.message);
    } catch (error) {
        console.error('Error deleting the post:', error);
    }
}
