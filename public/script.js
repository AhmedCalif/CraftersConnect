
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
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    });
    if (result.isConfirmed) {
        try {
            console.log('Deleting post with ID:', postId);
            const response = await fetch(`/posts/${postId}`, {
                method: 'DELETE', 
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const data = await response.json(); 
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: data.message || 'Failed to delete the post, please try again later.'
                });
                throw new Error(data.message || 'Server responded with an error.');
            }

            const data = await response.json();
            console.log('Post deleted:', data);

            const postElement = document.getElementById(`post-${postId}`);
            if (postElement) {
                postElement.remove();
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: data.message || 'Post has been successfully deleted.'
                });
            } else {
                console.error('Failed to find the post element:', `post-${postId}`);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Failed to find the post element on the page.'
                });
            }
        } catch (error) {
            console.error('Error deleting the post:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'There was an issue deleting your post.'
            });
        }
    } else {
        console.log('Deletion cancelled by the user.');
        Swal.fire({
            icon: 'info',
            title: 'Cancelled',
            text: 'Go Back to the Post Page!',
            timer: 3000
        });
    }
}

async function toggleLike(id) {
    const heartIcon = document.querySelector(`#post-${id} .fa-heart`);
    if (heartIcon.classList.contains('liked')) {
        await unlikePost(id);
        heartIcon.classList.remove('liked');
    } else {
        await likePost(id);
        heartIcon.classList.add('liked');
    }
}

async function likePost(id) {
    try {
        const response = await fetch(`/posts/like/${id}`, { method: 'POST' });
        if (!response.ok) {
            if (response.status === 409) {
                alert("You have already liked this post.");
                return;
            } else {
                throw new Error('Network response was not ok');
            }
        }
        const data = await response.json();
        updateLikesCount(id, data.likes);
    } catch (error) {
        console.error('Error liking the post:', error);
    }
}

async function unlikePost(id) {
    try {
        const response = await fetch(`/posts/unlike/${id}`, { method: 'POST' });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        updateLikesCount(id, data.likes);
    } catch (error) {
        console.error('Error unliking the post:', error);
    }
}

function updateLikesCount(id, likes) {
    const likesCountElement = document.getElementById(`likes-count-${id}`);
    if (likesCountElement && typeof likes === 'number') {
        likesCountElement.innerText = likes;
    } else {
        console.error('Invalid likes count received:', likes);
    }
}
