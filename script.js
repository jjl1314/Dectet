// Musicians Data
const musiciansData = [
    { name: "Isaiah Shin", instrument: "Viola", imageLink: "images/IMG_5968.jpg", role: "Founder" },
    { name: "Jason Liu", instrument: "Cello", imageLink: "images/IMG_5587.PNG", role: "Co-Founder" },
    { name: "Anthony Barakat", instrument: "Cello", imageLink: "images/IMG_5582.JPG" },
    { name: "Lorenzo Dasilva", instrument: "Cello", imageLink: "images/IMG1.jpg" },
    { name: "Advaith Balakrishnan", instrument: "Cello", imageLink: "images/IMG_5580.JPG" },
    { name: "Vincent Lan", instrument: "Violin", imageLink: "images/IMG_5578.JPG" },
    { name: "Steven Zhao", instrument: "Violin", imageLink: "images/IMG_5579.JPG" },
    { name: "Max Zheng", instrument: "Violin", imageLink: "images/IMG_5584.PNG" },
    { name: "Brandon Kim", instrument: "Violin", imageLink: "images/IMG_5604.JPG" },
    { name: "Oliver Clary", instrument: "Bass", imageLink: "images/IMG_5576.JPG" }
];

// Schedule Data
const scheduleData = [
    {
        date: "December 2, 2025",
        title: "Timeless Treasures",
        location: "The Birches",
        time: "6:00 PM",
        description: "Classical favorites and holiday arrangements!"
    },
    // {
    //     date: "",
    //     title: "",
    //     location: "",
    //     time: "",
    //     description: ""
    // }
];

// Render Musicians
// Render Musicians - Updated version
function renderMusicians() {
    const grid = document.getElementById('membersGrid');
    if (!grid) return;

    grid.innerHTML = musiciansData.map(musician => {
        const hasRole = musician.role && (musician.role === "Founder" || musician.role === "Co-Founder");

        const icon = musician.imageLink
            ? `<img src="${musician.imageLink}" alt="${musician.name}">`
            : `<div class="member-photo-icon">🎻</div>`;

        return `
            <div class="member-card" ${hasRole ? `data-role="${musician.role}"` : ''}>
                <div class="member-photo">
                    ${icon}
                    ${hasRole ? `<span class="role-badge">${musician.role}</span>` : ''}
                </div>
                <div class="member-info">
                    <h3>${musician.name}</h3>
                    <p>${musician.instrument}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Render Schedule
function renderSchedule() {
    const grid = document.getElementById('scheduleGrid');
    if (!grid) return;

    grid.innerHTML = scheduleData.map(event => `
        <div class="event-card">
            <div class="event-date-container">
                <span class="event-date">${event.date}</span>
            </div>
            <div class="event-content">
                <h3>${event.title}</h3>
                <div class="event-details">
                    <div class="event-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.location}</span>
                    </div>
                    <div class="event-time">
                        <i class="fas fa-clock"></i>
                        <span>${event.time}</span>
                    </div>
                </div>
                <p class="event-description">${event.description}</p>
            </div>
        </div>
    `).join('');
}

// Mobile Navigation Toggle
function setupMobileNav() {
    const header = document.querySelector('header');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelectorAll('nav ul li a');

    if (!menuToggle) return;

    menuToggle.addEventListener('click', () => {
        header.classList.toggle('nav-open');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            header.classList.remove('nav-open');
        });
    });
}

// Active Navigation on Scroll
function setupActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav ul li a');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });
}

// Smooth Scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = document.querySelector('header').offsetHeight;
                const targetPosition = target.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll Animations with Intersection Observer
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.dataset.aos) {
                    entry.target.classList.add('aos-animate');
                }
            }
        });
    }, observerOptions);

    // Observe founder message
    const founderMessage = document.querySelector('.founder-message');
    if (founderMessage) {
        observer.observe(founderMessage);
    }

    // Observe member cards
    document.querySelectorAll('.member-card').forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.05}s`;
        observer.observe(card);
    });

    // Observe event cards
    document.querySelectorAll('.event-card').forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });

    // Observe mission cards
    document.querySelectorAll('.mission-card').forEach(card => {
        observer.observe(card);
    });

    // Observe video cards
    document.querySelectorAll('.video-card').forEach(card => {
        observer.observe(card);
    });
}


// Header Scroll Effect - Hide on scroll down, show on scroll up
function setupHeaderScroll() {
    const header = document.querySelector('header');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeader() {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 100) {
            // Scrolling down - hide header
            if (currentScrollY > lastScrollY) {
                header.style.transform = 'translateY(-100%)';
            }
            // Scrolling up - show header
            else {
                header.style.transform = 'translateY(0)';
            }

            header.style.padding = '0.8rem 0';
            header.style.boxShadow = '0 4px 30px rgba(220, 20, 60, 0.2)';
            header.style.transition = 'transform 0.3s ease, padding 0.3s ease, box-shadow 0.3s ease';
        } else {
            // At top of page - always show
            header.style.transform = 'translateY(0)';
            header.style.padding = '1.2rem 0';
            header.style.boxShadow = '0 4px 30px rgba(220, 20, 60, 0.1)';
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);
}

// YouTube Thumbnail Loader
function setupYouTubeThumbnails() {
    const videoThumbnails = document.querySelectorAll('.video-thumbnail');

    videoThumbnails.forEach(thumbnail => {
        const youtubeId = thumbnail.getAttribute('data-youtube-id');

        if (youtubeId && youtubeId !== 'YOUR_VIDEO_ID_1' && youtubeId !== 'YOUR_VIDEO_ID_2' && youtubeId !== 'YOUR_VIDEO_ID_3') {
            // Use maxresdefault for highest quality, fallback to hqdefault
            const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

            // Create image element to check if maxresdefault exists
            const img = new Image();
            img.onload = function () {
                if (img.width > 120) { // maxresdefault exists
                    thumbnail.style.backgroundImage = `url(${thumbnailUrl})`;
                } else { // Fallback to hqdefault
                    thumbnail.style.backgroundImage = `url(https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg)`;
                }
            };
            img.onerror = function () {
                // Fallback to hqdefault if maxresdefault doesn't exist
                thumbnail.style.backgroundImage = `url(https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg)`;
            };
            img.src = thumbnailUrl;
        } else {
            // Use placeholder if no YouTube ID is set
            thumbnail.style.backgroundImage = `linear-gradient(135deg, var(--medium-gray), var(--dark-gray))`;
        }
    });
}

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
    renderMusicians();
    renderSchedule();
    setupMobileNav();
    setupActiveNav();
    setupSmoothScrolling();
    setupScrollAnimations();
    setupContactForm();
    setupHeaderScroll();
    setupYouTubeThumbnails();

    console.log('Devils Dectet website initialized successfully!');
});