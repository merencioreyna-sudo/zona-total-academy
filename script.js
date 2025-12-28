// CONFIGURACIÓN SIMPLE
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJpv1h9XBYo7gJPLBx4U_1IiRkf0v-y2W2Z_o-O3V67aPSqAzvBdAomO7SPy-dVSYw3cyUwD3C0oVJ/pub?output=csv'; // Cambia esto por tu URL real

// Datos iniciales (siempre visibles)
let courses = [
    {
        id: 1,
        title: "React JS - Curso Ejemplo",
        description: "Este es un curso de ejemplo. Configura tu Google Sheets para ver tus cursos.",
        category: "Programación",
        platform: "Udemy",
        link: "#",
        certificate: true,
        active: true
    },
    {
        id: 2,
        title: "Marketing Digital",
        description: "Curso de marketing digital básico.",
        category: "Marketing",
        platform: "Coursera",
        link: "#",
        certificate: true,
        active: true
    }
];

let categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
let currentCategory = "todos";
let searchQuery = "";
let customLogoUrl = localStorage.getItem('customLogoUrl') || "";

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
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

    // Configurar búsqueda
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

    // Configurar admin
    setupAdmin();
    
    // Cargar y mostrar cursos
    updateCategories();
    renderFilters();
    renderCourses();
    updateCourseCount();
    
    // Intentar cargar de Google Sheets
    if (GOOGLE_SHEETS_CSV_URL && !GOOGLE_SHEETS_CSV_URL.includes('TU_URL')) {
        loadFromGoogleSheets();
    }
});

// ==================== GOOGLE SHEETS ====================
async function loadFromGoogleSheets() {
    try {
        console.log('Intentando cargar desde Google Sheets...');
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length > 1) {
            const newCourses = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values[0]) {
                    newCourses.push({
                        id: i,
                        title: values[0].trim(),
                        description: values[1] ? values[1].trim() : 'Sin descripción',
                        category: values[2] ? values[2].trim() : 'General',
                        platform: values[3] ? values[3].trim() : 'No especificada',
                        link: values[4] ? values[4].trim() : '#',
                        certificate: values[5] ? (values[5].toLowerCase() === 'true') : false,
                        active: values[6] ? (values[6].toLowerCase() !== 'false') : true
                    });
                }
            }
            
            if (newCourses.length > 0) {
                courses = newCourses;
                console.log('Cursos cargados desde Google Sheets:', courses.length);
                updateCategories();
                renderFilters();
                renderCourses();
                updateCourseCount();
            }
        }
    } catch (error) {
        console.log('Google Sheets no disponible, usando datos locales');
    }
}

// ==================== RENDERIZAR CURSOS ====================
function updateCategories() {
    const uniqueCats = new Set(courses.map(c => c.category));
    categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
    
    uniqueCats.forEach(cat => {
        categories.push({
            id: cat.toLowerCase().replace(/ /g, '-'),
            name: cat,
            displayName: cat
        });
    });
}

function renderFilters() {
    const container = document.getElementById('filter-buttons');
    if (!container) return;
    
    container.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${currentCategory === cat.id ? 'active' : ''}`;
        btn.textContent = cat.displayName;
        btn.onclick = () => {
            currentCategory = cat.id;
            renderFilters();
            renderCourses();
        };
        container.appendChild(btn);
    });
}

function renderCourses() {
    const grid = document.getElementById('courses-grid');
    if (!grid) return;
    
    let filtered = courses.filter(c => c.active !== false);
    
    if (currentCategory !== 'todos') {
        filtered = filtered.filter(c => 
            c.category.toLowerCase().replace(/ /g, '-') === currentCategory
        );
    }
    
    if (searchQuery) {
        filtered = filtered.filter(c => 
            c.title.toLowerCase().includes(searchQuery) ||
            c.description.toLowerCase().includes(searchQuery) ||
            c.category.toLowerCase().includes(searchQuery)
        );
    }
    
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px">
                <i class="fas fa-search" style="font-size:3rem;color:var(--primary-gold);margin-bottom:20px"></i>
                <h3>No se encontraron cursos</h3>
                <p style="color:var(--text-secondary)">Prueba con otros filtros</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-image">
                <i class="fas fa-laptop-code"></i>
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
                </div>
                <div class="course-actions">
                    <button class="btn btn-small btn-primary view-btn">Ver Detalles</button>
                    ${course.link !== '#' ? 
                        `<a href="${course.link}" target="_blank" class="btn btn-small btn-secondary">Ir al Curso</a>` : 
                        `<button class="btn btn-small btn-secondary" disabled>Sin enlace</button>`
                    }
                </div>
            </div>
        `;
        
        card.querySelector('.view-btn').addEventListener('click', () => openModal(course));
        grid.appendChild(card);
    });
    
    updateCourseCount();
}

function updateCourseCount() {
    const counter = document.getElementById('total-courses');
    if (counter) {
        counter.textContent = courses.filter(c => c.active !== false).length;
    }
}

// ==================== MODAL ====================
function openModal(course) {
    const modal = document.getElementById('course-modal');
    const title = document.getElementById('modal-course-title');
    const content = document.getElementById('modal-course-content');
    
    if (modal && title && content) {
        title.textContent = course.title;
        content.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px">
                <div><strong>Plataforma:</strong> ${course.platform}</div>
                <div><strong>Categoría:</strong> ${course.category}</div>
                <div><strong>Certificado:</strong> ${course.certificate ? 'Sí' : 'No'}</div>
                <div><strong>Estado:</strong> ${course.active ? 'Activo' : 'Inactivo'}</div>
            </div>
            <div class="course-embed">
                <div class="text-content">
                    <h4>Descripción Completa</h4>
                    <p>${course.description}</p>
                    ${course.link !== '#' ? 
                        `<p><a href="${course.link}" target="_blank" class="btn btn-primary">Acceder al curso</a></p>` : 
                        ''
                    }
                </div>
            </div>
        `;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('course-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ==================== ADMIN ====================
function setupAdmin() {
    // Botón Admin
    const adminBtn = document.getElementById('admin-access-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAdmin();
        });
    }
    
    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('admin-username').value;
            const pass = document.getElementById('admin-password').value;
            
            if (user === 'admin' && pass === 'admin123') {
                document.getElementById('admin-login').style.display = 'none';
                document.getElementById('admin-panel').style.display = 'block';
                loadAdminCourses();
            } else {
                alert('Credenciales: admin / admin123');
            }
        });
    }
    
    // Botón mostrar credenciales
    const showCredsBtn = document.getElementById('show-creds-btn');
    if (showCredsBtn) {
        showCredsBtn.addEventListener('click', () => {
            const hint = document.getElementById('login-hint');
            hint.classList.toggle('active');
            showCredsBtn.textContent = hint.classList.contains('active') ? 
                'Ocultar Credenciales' : 'Mostrar Credenciales';
        });
    }
    
    // Cancelar login
    const cancelBtn = document.getElementById('cancel-login-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeAdmin);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            document.getElementById('admin-login').style.display = 'block';
            document.getElementById('admin-panel').style.display = 'none';
            document.getElementById('admin-username').value = '';
            document.getElementById('admin-password').value = '';
            document.getElementById('login-hint').classList.remove('active');
            document.getElementById('show-creds-btn').textContent = 'Mostrar Credenciales';
        });
    }
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.dataset.tab;
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'courses-tab') loadAdminCourses();
            if (tabId === 'branding-tab') loadBranding();
        });
    });
    
    // Logo
    const saveLogoBtn = document.getElementById('save-logo-btn');
    const resetLogoBtn = document.getElementById('reset-logo-btn');
    const logoUrlInput = document.getElementById('logo-url');
    
    if (saveLogoBtn) saveLogoBtn.addEventListener('click', saveLogo);
    if (resetLogoBtn) resetLogoBtn.addEventListener('click', resetLogo);
    if (logoUrlInput) {
        logoUrlInput.value = customLogoUrl;
        logoUrlInput.addEventListener('input', updateLogoPreview);
        updateLogoPreview();
    }
}

function openAdmin() {
    document.getElementById('admin-overlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAdmin() {
    document.getElementById('admin-overlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function loadAdminCourses() {
    const container = document.getElementById('admin-courses-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    courses.forEach(course => {
        const item = document.createElement('div');
        item.className = 'admin-course-item';
        item.innerHTML = `
            <div class="admin-course-header">
                <div class="admin-course-title">${course.title}</div>
                <div class="admin-course-actions">
                    <button class="action-btn edit" onclick="editCourse(${course.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="action-btn delete" onclick="deleteCourse(${course.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
            <div class="admin-course-details">
                <div><strong>Categoría:</strong> ${course.category}</div>
                <div><strong>Plataforma:</strong> ${course.platform}</div>
                <div><strong>Certificado:</strong> ${course.certificate ? 'Sí' : 'No'}</div>
                <div><strong>Estado:</strong> ${course.active ? 'Activo' : 'Inactivo'}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function loadBranding() {
    updateLogoPreview();
}

function updateLogoPreview() {
    const img = document.getElementById('logo-preview-img');
    const text = document.getElementById('default-logo-text');
    const url = document.getElementById('logo-url').value;
    
    if (img && text) {
        if (url) {
            img.src = url;
            img.classList.add('active');
            text.style.display = 'none';
            
            img.onerror = function() {
                img.classList.remove('active');
                text.style.display = 'block';
                text.textContent = 'Error al cargar';
            };
        } else {
            img.classList.remove('active');
            text.style.display = 'block';
            text.textContent = 'Logo predeterminado';
        }
    }
}

function saveLogo() {
    const url = document.getElementById('logo-url').value.trim();
    
    if (url) {
        try {
            new URL(url); // Validar URL
            customLogoUrl = url;
            localStorage.setItem('customLogoUrl', url);
            updateHeroLogo();
            alert('Logo guardado');
        } catch {
            alert('URL inválida');
        }
    } else {
        alert('Ingresa una URL');
    }
}

function resetLogo() {
    customLogoUrl = '';
    localStorage.removeItem('customLogoUrl');
    document.getElementById('logo-url').value = '';
    updateLogoPreview();
    updateHeroLogo();
    alert('Logo restablecido');
}

function updateHeroLogo() {
    const img = document.getElementById('hero-logo-img');
    const defaultLogo = document.querySelector('.hero-logo-default');
    
    if (img && defaultLogo) {
        if (customLogoUrl) {
            img.src = customLogoUrl;
            img.classList.add('active');
            defaultLogo.style.display = 'none';
            
            img.onerror = function() {
                img.classList.remove('active');
                defaultLogo.style.display = 'flex';
            };
        } else {
            img.classList.remove('active');
            defaultLogo.style.display = 'flex';
        }
    }
}

// Funciones globales
window.editCourse = function(id) {
    alert('Para editar, modifica tu Google Sheets directamente.\nLos cambios se verán al recargar.');
};

window.deleteCourse = function(id) {
    if (confirm('¿Eliminar curso?\nNota: Debes borrarlo en Google Sheets.')) {
        alert('Elimínalo en Google Sheets y recarga la página.');
    }
};

window.closeModal = closeModal;
window.openModal = openModal;

// Inicializar logo
updateHeroLogo();
