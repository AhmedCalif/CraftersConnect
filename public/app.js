
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