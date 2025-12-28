// CONFIGURACIÓN
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1YAqfZadMR5O6mABhl0QbhF8scbtIW9JJPfwdED4bzDQ/edit?gid=0#gid=0';

// CURSOS CON VIDEO REAL DENTRO DE LA WEB Y PORTADAS
let courses = [
    {
        id: 1,
        title: "React Avanzado 2024",
        description: "Curso completo de React con proyectos reales. Aprende Hooks, Context API, Redux, Testing y despliegue profesional.",
        category: "Programación",
        platform: "YouTube",
        videoId: "Ke90Tje7VS0",
        thumbnail: "https://img.youtube.com/vi/Ke90Tje7VS0/maxresdefault.jpg", // PORTADA DE YOUTUBE
        duration: "15 horas",
        level: "Avanzado",
        certificate: true,
        active: true
    },
    {
        id: 2,
        title: "JavaScript Moderno ES6+",
        description: "Domina JavaScript moderno con todas las características nuevas de ES6 en adelante.",
        category: "Programación", 
        platform: "YouTube",
        videoId: "2SetvwBV-SU",
        thumbnail: "https://img.youtube.com/vi/2SetvwBV-SU/maxresdefault.jpg", // PORTADA DE YOUTUBE
        duration: "10 horas",
        level: "Intermedio",
        certificate: true,
        active: true
    },
    {
        id: 3,
        title: "Node.js Backend Profesional",
        description: "Desarrollo backend con Node.js, Express, MongoDB y autenticación JWT.",
        category: "Backend",
        platform: "YouTube",
        videoId: "1hpc70_OoAg",
        thumbnail: "https://img.youtube.com/vi/1hpc70_OoAg/maxresdefault.jpg", // PORTADA DE YOUTUBE
        duration: "12 horas",
        level: "Intermedio",
        certificate: true,
        active: true
    }
];

let categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
let currentCategory = "todos";
let searchQuery = "";
let customLogoUrl = localStorage.getItem('customLogoUrl') || "";

// =============== INICIALIZACIÓN ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('Academia Élite - Iniciando...');
    
    // Menú móvil
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderCourses();
        });
    }

    // Configurar modal
    const modalClose = document.getElementById('modal-close');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const courseModal = document.getElementById('course-modal');
    
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    if (courseModal) {
        courseModal.addEventListener('click', (e) => {
            if (e.target === courseModal) closeModal();
        });
    }

    // Configurar Admin
    setupAdmin();
    
    // Mostrar cursos INMEDIATAMENTE
    updateCategories();
    renderFilters();
    renderCourses();
    updateCourseCount();
    updateHeroLogo();
});

// =============== RENDERIZAR CURSOS ===============
function updateCategories() {
    categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
    const uniqueCats = [...new Set(courses.map(c => c.category))];
    
    uniqueCats.forEach(cat => {
        categories.push({
            id: cat.toLowerCase().replace(/ /g, '-'),
            name: cat,
            displayName: cat
        });
    });
}

function renderFilters() {
    const filterButtons = document.getElementById('filter-buttons');
    if (!filterButtons) return;
    
    filterButtons.innerHTML = '';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `filter-btn ${currentCategory === category.id ? 'active' : ''}`;
        button.textContent = category.displayName;
        button.dataset.category = category.id;
        
        button.addEventListener('click', () => {
            currentCategory = category.id;
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            renderCourses();
        });
        
        filterButtons.appendChild(button);
    });
}

function renderCourses() {
    const coursesGrid = document.getElementById('courses-grid');
    if (!coursesGrid) return;
    
    // Filtrar cursos
    let filteredCourses = courses.filter(course => course.active !== false);
    
    if (currentCategory !== 'todos') {
        filteredCourses = filteredCourses.filter(course => {
            const catId = course.category.toLowerCase().replace(/ /g, '-');
            return catId === currentCategory;
        });
    }
    
    if (searchQuery) {
        filteredCourses = filteredCourses.filter(course => {
            const searchText = [
                course.title || '',
                course.description || '',
                course.category || '',
                course.platform || ''
            ].join(' ').toLowerCase();
            
            return searchText.includes(searchQuery);
        });
    }
    
    // Limpiar grid
    coursesGrid.innerHTML = '';
    
    // Si no hay cursos
    if (filteredCourses.length === 0) {
        coursesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px;">
                <i class="fas fa-book-open" style="font-size: 4rem; color: var(--primary-gold); margin-bottom: 20px; opacity: 0.7;"></i>
                <h3 style="color: var(--text-color); margin-bottom: 15px;">No se encontraron cursos</h3>
                <p style="color: var(--text-secondary); margin-bottom: 25px;">
                    ${searchQuery ? 'Prueba con otros términos de búsqueda.' : 'No hay cursos disponibles en esta categoría.'}
                </p>
                ${searchQuery ? 
                    '<button onclick="clearSearch()" class="btn btn-primary" style="margin: 10px;">Limpiar búsqueda</button>' : 
                    ''
                }
                <button onclick="location.reload()" class="btn btn-secondary" style="margin: 10px;">
                    <i class="fas fa-redo"></i> Recargar página
                </button>
            </div>
        `;
        return;
    }
    
    // Renderizar cada curso
    filteredCourses.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesGrid.appendChild(courseCard);
    });
}

function createCourseCard(course) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    
    // Determinar ícono según categoría
    let iconClass = 'fas fa-laptop-code';
    if (course.category.includes('Programación')) iconClass = 'fas fa-code';
    if (course.category.includes('Diseño')) iconClass = 'fas fa-palette';
    if (course.category.includes('Marketing')) iconClass = 'fas fa-bullhorn';
    
    courseCard.innerHTML = `
        <div class="course-image">
            <i class="${iconClass}"></i>
        </div>
        <div class="course-content">
            <div class="course-header">
                <h3 class="course-title">${course.title}</h3>
                ${course.certificate ? 
                    '<div class="certificate-badge"><i class="fas fa-certificate"></i> Certificado</div>' : 
                    ''
                }
            </div>
            <p class="course-description">${course.description}</p>
            <div class="course-meta">
                <span class="course-category">${course.category}</span>
                <span class="course-platform">${course.platform}</span>
                ${course.duration ? `<span class="course-duration"><i class="fas fa-clock"></i> ${course.duration}</span>` : ''}
                ${course.level ? `<span class="course-level"><i class="fas fa-chart-line"></i> ${course.level}</span>` : ''}
            </div>
            <div class="course-actions">
                <button class="btn btn-small btn-primary view-course-btn" data-id="${course.id}">
                    <i class="fas fa-play-circle"></i> Ver Curso
                </button>
                ${course.videoId ? 
                    `<a href="https://www.youtube.com/watch?v=${course.videoId}" target="_blank" class="btn btn-small btn-secondary">
                        <i class="fab fa-youtube"></i> YouTube
                    </a>` : 
                    ''
                }
            </div>
        </div>
    `;
    
    // Evento para abrir el modal con el video
    courseCard.querySelector('.view-course-btn').addEventListener('click', () => {
        openCourseModal(course);
    });
    
    return courseCard;
}

function updateCourseCount() {
    const totalCoursesElement = document.getElementById('total-courses');
    if (totalCoursesElement) {
        const activeCourses = courses.filter(course => course.active === true).length;
        totalCoursesElement.textContent = activeCourses;
    }
}

// =============== MODAL CON VIDEO DENTRO ===============
function openCourseModal(course) {
    const courseModal = document.getElementById('course-modal');
    const modalCourseTitle = document.getElementById('modal-course-title');
    const modalCourseContent = document.getElementById('modal-course-content');
    
    if (!courseModal || !modalCourseTitle || !modalCourseContent) return;
    
    modalCourseTitle.textContent = course.title;
    
    // CONSTRUIR MODAL CON VIDEO DENTRO
    let modalHTML = `
        <div class="course-details">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px;">
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Plataforma</div>
                    <div style="font-weight: 500; color: var(--text-color);">${course.platform}</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Categoría</div>
                    <div style="font-weight: 500; color: var(--text-color);">${course.category}</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Duración</div>
                    <div style="font-weight: 500; color: var(--text-color);">${course.duration || 'No especificada'}</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Nivel</div>
                    <div style="font-weight: 500; color: var(--text-color);">${course.level || 'Todos los niveles'}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h4 style="color: var(--text-color); margin-bottom: 15px;">Descripción</h4>
                <p style="color: var(--text-color); line-height: 1.6; white-space: pre-line;">${course.description}</p>
            </div>
    `;
    
    // AÑADIR VIDEO DENTRO DEL MODAL
    if (course.videoId) {
        modalHTML += `
            <div class="course-embed">
                <h4 style="color: var(--text-color); margin-bottom: 15px;">Video del Curso</h4>
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; background: #000; margin-bottom: 20px;">
                    <iframe 
                        src="https://www.youtube.com/embed/${course.videoId}?rel=0&showinfo=0" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        title="${course.title}">
                    </iframe>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9rem; text-align: center;">
                    Reproduciendo desde YouTube. El video se mostrará dentro de tu web.
                </p>
            </div>
        `;
    }
    
    modalHTML += `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--medium-gray);">
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    ${course.certificate ? 
                        `<div style="display: flex; align-items: center; gap: 8px; color: var(--primary-gold);">
                            <i class="fas fa-certificate"></i>
                            <span>Incluye certificado</span>
                        </div>` : 
                        ''
                    }
                    ${course.active ? 
                        `<div style="display: flex; align-items: center; gap: 8px; color: #4CAF50;">
                            <i class="fas fa-check-circle"></i>
                            <span>Curso activo</span>
                        </div>` : 
                        ''
                    }
                </div>
            </div>
        </div>
    `;
    
    modalCourseContent.innerHTML = modalHTML;
    courseModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const courseModal = document.getElementById('course-modal');
    if (courseModal) {
        courseModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// =============== ADMIN ===============
function setupAdmin() {
    // Botón Admin
    const adminAccessBtn = document.getElementById('admin-access-btn');
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('admin-overlay').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            if (username === 'admin' && password === 'admin123') {
                document.getElementById('admin-login').style.display = 'none';
                document.getElementById('admin-panel').style.display = 'block';
            } else {
                alert('Credenciales: admin / admin123');
            }
        });
    }
    
    // Botón mostrar credenciales
    const showCredsBtn = document.getElementById('show-creds-btn');
    if (showCredsBtn) {
        showCredsBtn.addEventListener('click', () => {
            const loginHint = document.getElementById('login-hint');
            if (loginHint) {
                loginHint.classList.toggle('active');
                showCredsBtn.textContent = loginHint.classList.contains('active') ? 
                    'Ocultar Credenciales' : 'Mostrar Credenciales';
            }
        });
    }
    
    // Cancelar login
    const cancelLoginBtn = document.getElementById('cancel-login-btn');
    if (cancelLoginBtn) {
        cancelLoginBtn.addEventListener('click', () => {
            document.getElementById('admin-overlay').style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            document.getElementById('admin-login').style.display = 'block';
            document.getElementById('admin-panel').style.display = 'none';
            document.getElementById('admin-username').value = '';
            document.getElementById('admin-password').value = '';
            const loginHint = document.getElementById('login-hint');
            if (loginHint) loginHint.classList.remove('active');
            const showCredsBtn = document.getElementById('show-creds-btn');
            if (showCredsBtn) showCredsBtn.textContent = 'Mostrar Credenciales';
        });
    }
    
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Actualizar botones
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Actualizar contenido
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Logo personalizado
    const saveLogoBtn = document.getElementById('save-logo-btn');
    const resetLogoBtn = document.getElementById('reset-logo-btn');
    const logoUrlInput = document.getElementById('logo-url');
    
    if (saveLogoBtn) {
        saveLogoBtn.addEventListener('click', () => {
            const url = logoUrlInput.value.trim();
            if (url) {
                customLogoUrl = url;
                localStorage.setItem('customLogoUrl', url);
                updateHeroLogo();
                alert('Logo guardado. Recarga la página para verlo en todas partes.');
            } else {
                alert('Ingresa una URL para el logo');
            }
        });
    }
    
    if (resetLogoBtn) {
        resetLogoBtn.addEventListener('click', () => {
            customLogoUrl = '';
            localStorage.removeItem('customLogoUrl');
            logoUrlInput.value = '';
            updateHeroLogo();
            alert('Logo restablecido al predeterminado');
        });
    }
    
    if (logoUrlInput) {
        logoUrlInput.value = customLogoUrl;
        logoUrlInput.addEventListener('input', () => {
            const img = document.getElementById('logo-preview-img');
            const text = document.getElementById('default-logo-text');
            const url = logoUrlInput.value.trim();
            
            if (img && text) {
                if (url) {
                    img.src = url;
                    img.classList.add('active');
                    text.style.display = 'none';
                } else {
                    img.classList.remove('active');
                    text.style.display = 'block';
                }
            }
        });
    }
}

function updateHeroLogo() {
    const heroLogoImg = document.getElementById('hero-logo-img');
    const heroLogoDefault = document.querySelector('.hero-logo-default');
    
    if (heroLogoImg && heroLogoDefault) {
        if (customLogoUrl) {
            heroLogoImg.src = customLogoUrl;
            heroLogoImg.classList.add('active');
            heroLogoDefault.style.display = 'none';
            
            heroLogoImg.onerror = function() {
                heroLogoImg.classList.remove('active');
                heroLogoDefault.style.display = 'flex';
            };
        } else {
            heroLogoImg.classList.remove('active');
            heroLogoDefault.style.display = 'flex';
        }
    }
}

// =============== FUNCIONES GLOBALES ===============
window.clearSearch = function() {
    searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    renderCourses();
};

window.openCourseModal = openCourseModal;
window.closeModal = closeModal;

// Inicializar logo
updateHeroLogo();
