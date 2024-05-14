document.addEventListener('DOMContentLoaded', function() {
    const initCarousel = (carouselId, prevBtnId, nextBtnId) => {
        const carousel = document.getElementById(carouselId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const carouselContent = carousel.querySelector('.carousel-content');
        const carouselItems = carousel.querySelectorAll('.carousel-item');
        let currentIndex = 0;

        function showItem(index) {
            carouselItems.forEach((item, i) => {
                item.style.display = i === index ? 'block' : 'none';
            });
        }

        prevBtn.addEventListener('click', function() {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : carouselItems.length - 1;
            showItem(currentIndex);
        });

        nextBtn.addEventListener('click', function() {
            currentIndex = (currentIndex < carouselItems.length - 1) ? currentIndex + 1 : 0;
            showItem(currentIndex);
        });

        if (carouselItems.length > 1) {
            showItem(currentIndex);
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
    };

    initCarousel('projectsCarousel', 'prevProjectsBtn', 'nextProjectsBtn');
    initCarousel('postsCarousel', 'prevPostsBtn', 'nextPostsBtn');
});