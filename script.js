// JavaScript for AgroValue animations

// window.addEventListener('scroll', () => {
//     const navbar = document.querySelector('nav');
//     if (window.scrollY > 0) {
//         navbar.style.opacity = '0.9'; // Less opacity
//     } else {
//         navbar.style.opacity = '1'; // Full opacity
//     }
// });


// Example: Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add vine growth animation logic here

// Fix for vine animation logic
window.addEventListener("scroll", () => {
    const path = document.querySelector(".vine-path");
    if (!path) return; // Ensure the path exists

    const scroll = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const progress = scroll / maxScroll;

    // Update strokeDashoffset based on scroll progress
    const totalLength = path.getTotalLength();
    path.style.strokeDasharray = totalLength;
    path.style.strokeDashoffset = totalLength * (1 - progress);
});

// Updated Intersection Observer logic to fix disappearing elements
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const target = entry.target;
            const animationClass = target.getAttribute('data-animate');
            if (animationClass) {
                target.classList.add(animationClass);
                target.style.opacity = '1'; // Ensure visibility after animation

                // Remove the animation class after it ends to allow re-triggering
                target.addEventListener('animationend', () => {
                    target.classList.remove(animationClass);
                }, { once: true });
            }
        }
    });
}, {
    threshold: 0.2 // Trigger when 20% of the element is visible
});

// Observe all elements with the data-animate attribute
document.querySelectorAll('[data-animate]').forEach((el) => {
    el.style.opacity = '0'; // Hide elements initially
    observer.observe(el);
});

// Fix Hamburger menu toggle logic
const hamburgerButton = document.querySelector('[data-collapse-toggle]');
const navbarMenu = document.getElementById('navbar-default');

hamburgerButton.addEventListener('click', () => {
    const isExpanded = hamburgerButton.getAttribute('aria-expanded') === 'true';
    hamburgerButton.setAttribute('aria-expanded', !isExpanded);
    navbarMenu.classList.toggle('hidden');
});
