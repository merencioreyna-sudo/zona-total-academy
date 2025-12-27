// CONFIGURACIÓN SIMPLE - SOLO PEGA LA URL COMPLETA DE TU GOOGLE SHEETS
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJpv1h9XBYo7gJPLBx4U_1IiRkf0v-y2W2Z_o-O3V67aPSqAzvBdAomO7SPy-dVSYw3cyUwD3C0oVJ/pub?gid=0&single=true&output=csv';

// Variables globales
let courses = [];
let categories = [
    { id: "todos", name: "Todos", displayName: "Todos" }
];
let currentCategory = "todos";
let searchQuery = "";
let customLogoUrl = localStorage.getItem('customLogoUrl') || "";

// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const coursesGrid = document.getElementById('courses-grid');
const filterButtons = document.getElementById('filter-buttons');
const searchInput = document.getElementById('search-input');
const totalCoursesElement = document.getElementById('total-courses');
const adminAccessBtn = document.getElementById('admin-access-btn');
const adminOverlay = document.getElementById('admin-overlay');
const adminLogin = document.getElementById('admin-login');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const cancelLoginBtn = document.getElementById('cancel-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const showCredsBtn = document.getElementById('show-creds-btn');
const loginHint = document.getElementById('login-hint');
const courseModal = document.getElementById('course-modal');
const modalClose = document.getElementById('modal-close');
const closeModalBtn = document.getElementById('close-modal-btn');
const enrollBtn = document.getElementById('enroll-btn');
const modalCourseTitle = document.getElementById('modal-course-title');
const modalCourseContent = document.getElementById('modal-course-content');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const adminCoursesList = document.getElementById('admin-courses-list');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFilters();
    initAdmin();
    initModal();
    updateHeroLogo();
    
    // Cargar cursos desde Google Sheets
    loadCoursesFromGoogleSheets();
});

// Navigation
function initNavigation() {
    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Courses and Filters
function initFilters() {
    // Create filter buttons
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `filter-btn ${category.id === currentCategory ? 'active' : ''}`;
        button.textContent = category.displayName;
        button.dataset.category = category.id;
        button.addEventListener('click', () => {
            currentCategory = category.id;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderCourses();
        });
        filterButtons.appendChild(button);
    });
    
    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderCourses();
    });
}

// FUNCIÓN PRINCIPAL - CARGAR DATOS DESDE GOOGLE SHEETS
async function loadCoursesFromGoogleSheets() {
    try {
        console.log('Cargando datos desde:', GOOGLE_SHEETS_URL);
        
        const response = await fetch(GOOGLE_SHEETS_URL);
        const csvText = await response.text();
        
        // Parsear CSV
        const rows = csvText.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        
        courses = rows.slice(1).map((row, index) => {
            const values = row.split(',').map(v => v.trim());
            const course = { id: index + 1 };
            
            headers.forEach((header, i) => {
                if (values[i]) {
                    course[header] = values[i];
                }
            });
            
            return course;
        }).filter(course => course.titulo || course.title);
        
        console.log('Cursos cargados:', courses.length);
        
        // Actualizar categorías
        updateCategoriesFromCourses();
        
        // Actualizar filtros
        updateFilterButtons();
        
        // Renderizar cursos
        renderCourses();
        
        // Actualizar contador
        updateCourseCount();
        
    } catch (error) {
        console.error('Error al cargar Google Sheets:', error);
        alert('Error al cargar los cursos. Verifica la URL de Google Sheets.');
    }
}

function updateCategoriesFromCourses() {
    // Obtener categorías únicas de los cursos
    const uniqueCategories = [...new Set(courses.map(course => 
        course.categoria || course.category || 'General'
    ))];
    
    // Agregar nuevas categorías
    uniqueCategories.forEach(catName => {
        if (catName && !categories.find(cat => cat.id === catName.toLowerCase())) {
            const displayName = catName.charAt(0).toUpperCase() + catName.slice(1);
            categories.push({
                id: catName.toLowerCase(),
                name: catName,
                displayName: displayName
            });
        }
    });
}

function updateFilterButtons() {
    filterButtons.innerHTML = '';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `filter-btn ${category.id === currentCategory ? 'active' : ''}`;
        button.textContent = category.displayName;
        button.dataset.category = category.id;
        button.addEventListener('click', () => {
            currentCategory = category.id;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderCourses();
        });
        filterButtons.appendChild(button);
    });
}

function renderCourses() {
    coursesGrid.innerHTML = '';
    
    // Filtrar cursos
    let filteredCourses = courses.filter(course => 
        course.activo !== 'FALSE' && course.active !== 'FALSE'
    );
    
    if (currentCategory !== 'todos') {
        filteredCourses = filteredCourses.filter(course => {
            const cat = (course.categoria || course.category || '').toLowerCase();
            return cat === currentCategory;
        });
    }
    
    if (searchQuery) {
        filteredCourses = filteredCourses.filter(course => {
            const title = (course.titulo || course.title || '').toLowerCase();
            const desc = (course.descripcion || course.description || '').toLowerCase();
            const platform = (course.plataforma || course.platform || '').toLowerCase();
            
            return title.includes(searchQuery) || 
                   desc.includes(searchQuery) || 
                   platform.includes(searchQuery);
        });
    }
    
    // Renderizar tarjetas
    filteredCourses.forEach(course => {
        const categoryName = course.categoria || course.category || 'General';
        const category = categories.find(cat => cat.id === categoryName.toLowerCase()) || 
                        { displayName: categoryName };
        
        const courseCard = createCourseCard(course, category);
        coursesGrid.appendChild(courseCard);
    });
    
    // Si no hay cursos
    if (filteredCourses.length === 0) {
        coursesGrid.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--primary-gold); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">No se encontraron cursos</h3>
                <p style="color: var(--text-secondary);">Intenta con otra categoría o término de búsqueda</p>
            </div>
        `;
    }
}

function createCourseCard(course, category) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    
    const title = course.titulo || course.title || 'Curso sin título';
    const description = course.descripcion || course.description || 'Descripción no disponible';
    const platform = course.plataforma || course.platform || 'Plataforma no especificada';
    const link = course.enlace || course.link || '#';
    const hasCertificate = (course.certificado === 'TRUE' || course.certificate === 'TRUE');
    
    courseCard.innerHTML = `
        <div class="course-image">
            <i class="fas fa-laptop-code"></i>
        </div>
        <div class="course-content">
            <div class="course-header">
                <h3 class="course-title">${title}</h3>
                ${hasCertificate ? 
                    '<div class="certificate-badge"><i class="fas fa-certificate"></i> Certificado</div>' : 
                    ''
                }
            </div>
            <p class="course-description">${description}</p>
            <div class="course-meta">
                <span class="course-category">${category.displayName}</span>
                <span class="course-platform">${platform}</span>
            </div>
            <div class="course-actions">
                <button class="btn btn-small btn-primary view-course-btn">
                    Ver Detalles
                </button>
                <a href="${link}" target="_blank" class="btn btn-small btn-secondary">
                    Ir al Curso
                </a>
            </div>
        </div>
    `;
    
    // Event listener para ver detalles
    courseCard.querySelector('.view-course-btn').addEventListener('click', () => {
        openCourseModal(course);
    });
    
    return courseCard;
}

function updateCourseCount() {
    if (totalCoursesElement) {
        const activeCourses = courses.filter(course => 
            course.activo !== 'FALSE' && course.active !== 'FALSE'
        ).length;
        totalCoursesElement.textContent = activeCourses;
    }
}

// Modal Functions
function initModal() {
    modalClose.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    enrollBtn.addEventListener('click', () => {
        alert('¡Inscripción exitosa!');
        closeModal();
    });
    
    courseModal.addEventListener('click', (e) => {
        if (e.target === courseModal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && courseModal.style.display === 'flex') {
            closeModal();
        }
    });
}

function openCourseModal(course) {
    const title = course.titulo || course.title || 'Curso sin título';
    const description = course.descripcion || course.description || 'Descripción no disponible';
    const platform = course.plataforma || course.platform || 'No especificada';
    const categoryName = course.categoria || course.category || 'General';
    const category = categories.find(cat => cat.id === categoryName.toLowerCase()) || 
                    { displayName: categoryName };
    const hasCertificate = (course.certificado === 'TRUE' || course.certificate === 'TRUE');
    
    modalCourseTitle.textContent = title;
    modalCourseContent.innerHTML = `
        <div class="course-details">
            <div class="detail-row">
                <div class="detail-item">
                    <strong>Plataforma:</strong> ${platform}
                </div>
                <div class="detail-item">
                    <strong>Categoría:</strong> ${category.displayName}
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-item">
                    <strong>Certificado:</strong> ${hasCertificate ? 'Sí incluido' : 'No incluido'}
                </div>
                <div class="detail-item">
                    <strong>Acceso:</strong> 24/7 desde cualquier dispositivo
                </div>
            </div>
            
            <div class="course-embed">
                <div class="text-content">
                    <h4>Descripción Completa</h4>
                    <p>${description}</p>
                    <p>Este curso incluye contenido actualizado, ejercicios prácticos, proyectos reales y soporte continuo.</p>
                    ${hasCertificate ? 
                        '<p><i class="fas fa-certificate"></i> Incluye certificado digital verificable.</p>' : 
                        ''
                    }
                </div>
            </div>
        </div>
    `;
    
    courseModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    courseModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Admin Functions (solo para ver)
function initAdmin() {
    adminAccessBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAdminPanel();
    });
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        
        if (username === 'admin' && password === 'admin123') {
            loginSuccess();
        } else {
            alert('Credenciales incorrectas. Usa admin / admin123');
        }
    });
    
    cancelLoginBtn.addEventListener('click', closeAdminPanel);
    
    showCredsBtn.addEventListener('click', () => {
        loginHint.classList.toggle('active');
        showCredsBtn.textContent = loginHint.classList.contains('active') ? 
            'Ocultar Credenciales' : 'Mostrar Credenciales';
    });
    
    logoutBtn.addEventListener('click', () => {
        adminLogin.style.display = 'block';
        adminPanel.style.display = 'none';
        document.getElementById('admin-username').value = '';
        document.getElementById('admin-password').value = '';
        loginHint.classList.remove('active');
        showCredsBtn.textContent = 'Mostrar Credenciales';
    });
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            if (tabId === 'courses-tab') {
                renderAdminCourses();
            }
        });
    });
}

function openAdminPanel() {
    adminOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAdminPanel() {
    adminOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function loginSuccess() {
    adminLogin.style.display = 'none';
    adminPanel.style.display = 'block';
    renderAdminCourses();
}

function renderAdminCourses() {
    adminCoursesList.innerHTML = '';
    
    courses.forEach(course => {
        const title = course.titulo || course.title || 'Curso sin título';
        const categoryName = course.categoria || course.category || 'General';
        const category = categories.find(cat => cat.id === categoryName.toLowerCase()) || 
                        { displayName: categoryName };
        const platform = course.plataforma || course.platform || 'No especificada';
        const link = course.enlace || course.link || '#';
        const hasCertificate = (course.certificado === 'TRUE' || course.certificate === 'TRUE');
        const isActive = (course.activo !== 'FALSE' && course.active !== 'FALSE');
        
        const courseItem = document.createElement('div');
        courseItem.className = 'admin-course-item';
        courseItem.innerHTML = `
            <div class="admin-course-header">
                <div class="admin-course-title">${title}</div>
                <div class="admin-course-actions">
                    <a href="${GOOGLE_SHEETS_URL.replace('/pub?', '/edit?')}" target="_blank" class="action-btn edit">
                        Editar en Sheets
                    </a>
                </div>
            </div>
            <div class="admin-course-details">
                <div><strong>Categoría:</strong> ${category.displayName}</div>
                <div><strong>Plataforma:</strong> ${platform}</div>
                <div><strong>Certificado:</strong> ${hasCertificate ? 'Sí' : 'No'}</div>
                <div><strong>Estado:</strong> ${isActive ? 'Activo' : 'Inactivo'}</div>
                <div><strong>Enlace:</strong> <a href="${link}" target="_blank">Ver curso</a></div>
            </div>
        `;
        adminCoursesList.appendChild(courseItem);
    });
}

function updateHeroLogo() {
    const heroLogoImg = document.getElementById('hero-logo-img');
    if (!heroLogoImg) return;
    
    if (customLogoUrl) {
        heroLogoImg.src = customLogoUrl;
        heroLogoImg.classList.add('active');
        document.querySelector('.hero-logo-default').style.display = 'none';
        
        heroLogoImg.onerror = function() {
            heroLogoImg.classList.remove('active');
            document.querySelector('.hero-logo-default').style.display = 'flex';
        };
    } else {
        heroLogoImg.classList.remove('active');
        document.querySelector('.hero-logo-default').style.display = 'flex';
    }
}

// Botón de actualización
document.addEventListener('DOMContentLoaded', function() {
    // Agregar botón de actualización
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-small';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
    refreshBtn.style.marginLeft = '10px';
    refreshBtn.style.marginTop = '10px';
    refreshBtn.addEventListener('click', loadCoursesFromGoogleSheets);
    
    const sectionHeader = document.querySelector('.section-header');
    if (sectionHeader) {
        sectionHeader.appendChild(refreshBtn);
    }
});
