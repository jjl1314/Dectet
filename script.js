// Musicians Data
const musiciansData = [
    { 
        name: "Isaiah Shin", 
        instrument: "Viola", 
        imageLink: "images/IMG_5968.jpg", 
        role: "Founder",
        bio: "Hi there! My name is Isaiah Shin. Outside of orchestra, I play football and compete in triathlons. I am also the head play-by-play announcer for the Hinsdale Central Basketball Team. Additionally, I go on yearly mission trips to El Salvador and play on the school’s varsity 7v7 football program in the spring."
    },
    { 
        name: "Jason Liu", 
        instrument: "Cello", 
        imageLink: "images/IMG_5587.PNG", 
        role: "Founder",
        bio: "Hey, I’m Jason! When I’m not playing music with my friends, you’ll find me in a studio singing or at my desk building my next website. To me, music is sound, code is logic, and somewhere in between feels like home."
    },
    { 
        name: "Anthony Barakat", 
        instrument: "Cello", 
        imageLink: "images/IMG_5582.JPG",
        bio: "Hello, my name is Anthony! Outside of orchestra I play tennis and love doing things outdoors like camping. I also enjoy public speaking through clubs like Debate and Model UN."
    },
    { 
        name: "Lorenzo Dasilva", 
        instrument: "Cello", 
        imageLink: "images/IMG1.jpg",
        bio: "I’m part of the Hinsdale Community rowing team and enjoy playing soccer."
    },
    { 
        name: "Advaith Balakrishnan", 
        instrument: "Cello", 
        imageLink: "images/IMG_5580.JPG",
        bio: "I’m Advaith Balakrishnan, a current junior at Hinsdale Central High School. I have played cello since 5th grade. Outside of orchestra, I enjoy playing piano and singing Indian classical music. Additionally I am a part of my school’s track and field team and I am a starter on the Hinsdale Central Boys Varsity Soccer team."
    },
    { 
        name: "Vincent Lan", 
        instrument: "Violin", 
        imageLink: "images/IMG_5578.JPG",
        bio: "I am a young violinist, violist, and composer. I have received numerous accolades since he began learning to play at the age of 4. These include placing first in the Granquist Music Competition and IMA State Contest multiple times. I have also been a member of the Chicago Youth Symphony Orchestras, and am the concertmaster of Hinsdale Central High School's Philharmonic Orchestra."
    },
    { 
        name: "Steven Zhao", 
        instrument: "Violin", 
        imageLink: "images/IMG_5579.JPG",
        bio: "Hello, my name is Steven Zhao and I play the violin. Outside of orchestra, I participate in Robotics, Scholastic Bowl, Model UN, and Math Team. I also enjoy playing video games and hanging out with friends."
    },
    { 
        name: "Max Zheng", 
        instrument: "Violin", 
        imageLink: "images/IMG_5584.PNG",
        bio: "Hello, I’m Max, a junior at Hinsdale Central. I have been playing violin for almost 3 years, and piano for 11. I am super passionate about music. I love listening to and playing classical music, and I love playing music with friends. My favorite composers are Rachmaninoff, Stravinsky, and Shostakovich. Along with music, I am also passionate about mathematics."
    },
    { 
        name: "Brandon Kim", 
        instrument: "Violin", 
        imageLink: "images/IMG_5604.JPG",
        bio: "I’m Brandon Kim, a junior at Hinsdale Central High School. I started playing the violin when I was eleven years old, and have fallen in love ever since, and have represented the school in ILMEA District and All-State Orchestras. When I am not playing the violin, I enjoy running on our school’s varsity track team, and cooking different types of foods with my mother."
    },
    { 
        name: "Oliver Clary", 
        instrument: "Bass", 
        imageLink: "images/IMG_5576.JPG",
        bio: "As a student at Hinsdale Central, I participate in Football in the fall and Shotput in the spring. Outside of sports I like playing cards and fishing."
    }
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
// Render Musicians with clickable cards
// Render Musicians with clickable cards and data attributes
function renderMusicians() {
    const grid = document.getElementById('membersGrid');
    if (!grid) return;

    grid.innerHTML = musiciansData.map((musician, index) => {
        const hasRole = musician.role && (musician.role === "Founder" || musician.role === "Co-Founder");

        const icon = musician.imageLink
            ? `<img src="${musician.imageLink}" alt="${musician.name}" loading="lazy">`
            : `<div class="member-photo-icon">🎻</div>`;

        return `
            <div class="member-card" data-member-index="${index}" ${hasRole ? `data-role="${musician.role}"` : ''}>
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
            
            // DON'T change padding, only transform
            header.style.boxShadow = '0 4px 30px rgba(220, 20, 60, 0.2)';
        } else {
            // At top of page
            header.style.transform = 'translateY(0)';
            // DON'T change padding
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

// YouTube Thumbnail Loader - UPDATED VERSION
function setupYouTubeThumbnails() {
    const videoThumbnails = document.querySelectorAll('.video-thumbnail');

    videoThumbnails.forEach(thumbnail => {
        const youtubeId = thumbnail.getAttribute('data-youtube-id');
        
        console.log('YouTube ID:', youtubeId); // Debug log
        
        if (youtubeId && youtubeId.trim() !== '') {
            // Clean the YouTube ID (remove any URL parameters)
            const cleanId = youtubeId.split('&')[0]; // Remove &t=15s etc.
            
            // Use hqdefault for reliability
            const thumbnailUrl = `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
            
            console.log('Thumbnail URL:', thumbnailUrl); // Debug log
            
            // Set the background image
            thumbnail.style.backgroundImage = `url('${thumbnailUrl}')`;
            
            // Add a fallback in case the image fails to load
            thumbnail.style.backgroundColor = 'var(--dark-gray)';
            thumbnail.style.backgroundSize = 'cover';
            thumbnail.style.backgroundPosition = 'center';
            thumbnail.style.backgroundRepeat = 'no-repeat';
        } else {
            // Use gradient fallback
            thumbnail.style.backgroundImage = 'linear-gradient(135deg, var(--medium-gray), var(--dark-gray))';
        }
    });
}

// Gallery Lightbox
function setupGalleryLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const photo = this.querySelector('.gallery-photo');
            const backgroundImage = window.getComputedStyle(photo).backgroundImage;
            const imageUrl = backgroundImage.slice(5, -2); // Extract URL from CSS
            
            // Create lightbox
            const lightbox = document.createElement('div');
            lightbox.className = 'lightbox';
            lightbox.innerHTML = `
                <div class="lightbox-content">
                    <img src="${imageUrl}" alt="Gallery Photo">
                    <button class="lightbox-close">&times;</button>
                </div>
            `;
            
            document.body.appendChild(lightbox);
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            
            // Close lightbox
            const closeBtn = lightbox.querySelector('.lightbox-close');
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(lightbox);
                document.body.style.overflow = '';
            });
            
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    document.body.removeChild(lightbox);
                    document.body.style.overflow = '';
                }
            });
        });
    });
}
// Member Biography Modal - Updated with image handling
function setupMemberBiographies() {
    const memberCards = document.querySelectorAll('.member-card');
    
    // Create modal HTML structure
    const modalHTML = `
        <div class="bio-modal">
            <div class="bio-modal-overlay"></div>
            <div class="bio-modal-content">
                <button class="bio-modal-close">&times;</button>
                <div class="bio-modal-body">
                    <div class="bio-image-container" id="bio-image-container">
                        <img id="bio-modal-image" src="" alt="">
                    </div>
                    <div class="bio-text-container">
                        <h2 id="bio-modal-name"></h2>
                        <p class="bio-instrument" id="bio-modal-instrument"></p>
                        <p class="bio-role" id="bio-modal-role"></p>
                        <div class="bio-description">
                            <p id="bio-modal-bio"></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.querySelector('.bio-modal');
    const imageContainer = document.getElementById('bio-image-container');
    const modalImage = document.getElementById('bio-modal-image');
    const modalName = document.getElementById('bio-modal-name');
    const modalInstrument = document.getElementById('bio-modal-instrument');
    const modalRole = document.getElementById('bio-modal-role');
    const modalBio = document.getElementById('bio-modal-bio');
    const closeBtn = document.querySelector('.bio-modal-close');
    
    // Function to load image with error handling
    function loadMemberImage(imageSrc, memberName) {
        return new Promise((resolve, reject) => {
            if (!imageSrc) {
                imageContainer.classList.remove('has-image');
                resolve(false);
                return;
            }
            
            const img = new Image();
            img.onload = () => {
                modalImage.src = imageSrc;
                modalImage.alt = memberName;
                imageContainer.classList.add('has-image');
                resolve(true);
            };
            img.onerror = () => {
                console.log(`Failed to load image: ${imageSrc}`);
                imageContainer.classList.remove('has-image');
                modalImage.src = '';
                modalImage.alt = '';
                resolve(false);
            };
            img.src = imageSrc;
        });
    }
    
    // Add click event to each member card
    memberCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', async function() {
            const memberIndex = this.getAttribute('data-member-index');
            const member = musiciansData[memberIndex];
            
            // Show loading state
            modalImage.src = '';
            imageContainer.classList.remove('has-image');
            modalName.textContent = 'Loading...';
            modalInstrument.textContent = '';
            modalRole.textContent = '';
            modalBio.textContent = '';
            
            // Show modal immediately
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            try {
                // Load image
                const imageLoaded = await loadMemberImage(member.imageLink, member.name);
                
                // Fill modal with member data
                modalName.textContent = member.name;
                modalInstrument.textContent = member.instrument;
                modalRole.textContent = member.role ? member.role : '';
                modalBio.textContent = member.bio || 'Biography coming soon...';
                
                // If no image loaded, ensure proper styling
                if (!imageLoaded && member.imageLink) {
                    console.warn(`Could not load image for ${member.name}: ${member.imageLink}`);
                }
            } catch (error) {
                console.error('Error loading member data:', error);
                modalName.textContent = member.name;
                modalInstrument.textContent = member.instrument;
                modalBio.textContent = 'Error loading biography. Please try again.';
            }
        });
    });
    
    // Close modal when clicking X
    closeBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside content
    modal.addEventListener('click', function(e) {
        if (e.target === this || e.target.classList.contains('bio-modal-overlay')) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    function closeModal() {
        modal.classList.remove('active');
        // Wait for animation to complete before resetting
        setTimeout(() => {
            document.body.style.overflow = '';
            // Reset modal content
            modalImage.src = '';
            imageContainer.classList.remove('has-image');
        }, 300);
    }
}
// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
    renderMusicians();
    renderSchedule();
    setupMobileNav();
    setupActiveNav();
    setupSmoothScrolling();
    setupScrollAnimations();
    setupHeaderScroll();
    setupYouTubeThumbnails();
    setupGalleryLightbox();
    setupMemberBiographies();
    
    console.log('Devils Dectet website initialized successfully!');
});