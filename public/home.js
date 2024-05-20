document.addEventListener('DOMContentLoaded', function() {
    const initCarousel = (carouselId) => {
        const carousel = document.getElementById(carouselId);
        const prevBtn = carousel.querySelector('.carousel-control-prev');
        const nextBtn = carousel.querySelector('.carousel-control-next');

        
        const carouselItems = carousel.querySelectorAll('.carousel-item');
        let currentIndex = 0;

        function showItem(index) {
            carouselItems.forEach((item, i) => {
                item.classList.remove('active');
                if (i === index) {
                    item.classList.add('active');
                }
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

    initCarousel('projectsCarousel');
    initCarousel('newProjectsCarousel');
});
