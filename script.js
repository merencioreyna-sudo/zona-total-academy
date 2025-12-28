// ============================================
// CONFIGURACIÓN
// ============================================

// 1. CONFIGURA ESTA URL con tu Google Sheets CSV
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJpv1h9XBYo7gJPLBx4U_1IiRkf0v-y2W2Z_o-O3V67aPSqAzvBdAomO7SPy-dVSYw3cyUwD3C0oVJ/pub?output=csv';

// 2. Datos de ejemplo (se muestran si Google Sheets falla)
const DEFAULT_COURSES = [
    {
        id: 1,
        title: "React JS - Desarrollo Web Moderno",
        description: "Aprende React desde cero hasta nivel avanzado con proyectos reales.",
        category: "Programación",
        platform: "Udemy",
        link: "#",
        certificate: true,
        active: true
    },
    {
        id: 2,
        title: "Marketing Digital Completo",
        description: "Estrategias de marketing digital, SEO y redes sociales.",
        category: "Marketing",
        platform: "Coursera",
        link: "#",
        certificate: true,
        active: true
    }
];

// Variables globales
let courses = [];
let categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
let currentCategory = "todos";
let searchQuery = "";
let customLogoUrl = localStorage.getItem('customLogoUrl') || "";

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Academia Élite...');
    
    // Inicializar componentes básicos
    initNavigation();
    initModal();
    initAdminPanel();
    
    // Configurar búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchQuery = e.target.value.toLowerCase();
            renderCourses();
        });
    }
    
    // Cargar cursos
    loadCourses();
    
    // Inicializar filtros después de cargar cursos
    setTimeout(initFilters, 500);
});

// ============================================
// CARGAR CURSOS DESDE GOOGLE SHEETS
// ============================================
async function loadCourses() {
    console.log('Cargando cursos...');
    
    // Mostrar loading
    showLoading(true);
    
    try {
        // Verificar si la URL está configurada
        if (!GOOGLE_SHEETS_CSV_URL || GOOGLE_SHEETS_CSV_URL.includes('TU_URL')) {
            throw new Error('Configura la URL de Google Sheets en el código');
        }
        
        // Intentar cargar desde Google Sheets
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText || csvText.trim() === '') {
            throw new Error('Google Sheets está vacío');
        }
        
        // Parsear CSV
        courses = parseCSV(csvText);
        
        if (courses.length === 0) {
            throw new Error('No se encontraron cursos en el CSV');
        }
        
        console.log(`✅ ${courses.length} cursos cargados desde Google Sheets`);
        
    } catch (error) {
        console.warn('Error con Google Sheets:', error.message);
        console.log('Usando datos de ejemplo...');
        courses = DEFAULT_COURSES;
        
        // Mostrar advertencia
        showWarning('Usando datos de ejemplo. Configura tu Google Sheets para ver tus cursos reales.');
    }
    
    // Actualizar UI
    updateUI();
    showLoading(false);
}

// Función para parsear CSV
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const coursesArray = [];
    
    // Saltar encabezados (primera línea)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = parseCSVLine(line);
        
        if (values.length >= 1 && values[0].trim() !== '') {
            const course = {
                id: i,
                title: values[0]?.trim() || 'Curso sin título',
                description: values[1]?.trim() || 'Descripción no disponible',
                category: values[2]?.trim() || 'General',
                platform: values[3]?.trim() || 'No especificada',
                link: values[4]?.trim() || '#',
                certificate: values[5] ? (values[5].toLowerCase() === 'true' || values[5] === 'TRUE') : false,
                active: values[6] ? !(values[6].toLowerCase() === 'false' || values[6] === 'FALSE') : true
            };
            
            coursesArray.push(course);
        }
    }
    
    return coursesArray;
}

// Parsear línea CSV (simple)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// ============================================
// INTERFAZ DE USUARIO
// ============================================
function updateUI() {
    updateCategoriesFromCourses();
    renderCourses();
    updateCourseCount();
}

function updateCategoriesFromCourses() {
    categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
    
    const uniqueCats = new Set();
    courses.forEach(course => {
        if (course.category && course.category.trim()) {
            uniqueCats.add(course.category.trim());
        }
    });
    
    uniqueCats.forEach(cat => {
        const id = cat.toLowerCase().replace(/\s+/g, '-');
        categories.push({
            id: id,
            name: cat,
            displayName: cat.charAt(0).toUpperCase() + cat.slice(1)
        });
    });
}

function initFilters() {
    const filterButtons = document.getElementById('filter-buttons');
    if (!filterButtons) return;
    
    filterButtons.innerHTML = '';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `filter-btn ${category.id === currentCategory ? 'active' : ''}`;
        button.textContent = category.displayName;
        button.dataset.category = category.id;
        button.addEventListener('click', function() {
            currentCategory = this.dataset.category;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
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
            const catId = (course.category || '').toLowerCase().replace(/\s+/g, '-');
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
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--primary-gold); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">No se encontraron cursos</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                    ${searchQuery ? 'Prueba con otros términos de búsqueda.' : 'Agrega cursos en Google Sheets.'}
                </p>
                ${searchQuery ? 
                    '<button onclick="clearSearch()" class="btn btn-primary">Limpiar búsqueda</button>' : 
                    '<button onclick="loadCourses()" class="btn btn-primary"><i class="fas fa-sync-alt"></i> Recargar</button>'
                }
            </div>
        `;
        return;
    }
    
    // Renderizar cursos
    filteredCourses.forEach(course => {
        const categoryName = course.category || 'General';
        const category = categories.find(cat => cat.id === categoryName.toLowerCase().replace(/\s+/g, '-')) || {
            displayName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
        };
        
        const courseCard = createCourseCard(course, category);
        coursesGrid.appendChild(courseCard);
    });
}

function createCourseCard(course, category) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    
    courseCard.innerHTML = `
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
                <span class="course-category">${category.displayName}</span>
                <span class="course-platform">${course.platform}</span>
            </div>
            <div class="course-actions">
                <button class="btn btn-small btn-primary view-course-btn">
                    Ver Detalles
                </button>
                ${course.link && course.link !== '#' ? 
                    `<a href="${course.link}" target="_blank" class="btn btn-small btn-secondary">
                        Ir al Curso
                    </a>` : 
                    '<button class="btn btn-small btn-secondary" disabled>Sin enlace</button>'
                }
            </div>
        </div>
    `;
    
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

// ============================================
// ESTADOS DE UI
// ============================================
function showLoading(show) {
    const loadingElement = document.getElementById('loading-courses');
    const coursesGrid = document.getElementById('courses-grid');
    
    if (loadingElement) loadingElement.style.display = show ? 'block' : 'none';
    if (coursesGrid) coursesGrid.style.display = show ? 'none' : 'grid';
}

function showWarning(message) {
    const coursesGrid = document.getElementById('courses-grid');
    if (coursesGrid) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            grid-column: 1/-1;
            text-align: center;
            padding: 15px;
            background-color: rgba(212, 175, 55, 0.1);
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--primary-gold);
        `;
        warning.innerHTML = `
            <p style="color: var(--text-color); margin: 0;">
                <i class="fas fa-info-circle" style="color: var(--primary-gold); margin-right: 8px;"></i>
                ${message}
            </p>
        `;
        coursesGrid.prepend(warning);
    }
}

// ============================================
// NAVEGACIÓN
// ============================================
function initNavigation() {
    // Menú hamburguesa
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
}

// ============================================
// MODAL DE CURSOS
// ============================================
function initModal() {
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
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openCourseModal(course) {
    const courseModal = document.getElementById('course-modal');
    const modalCourseTitle = document.getElementById('modal-course-title');
    const modalCourseContent = document.getElementById('modal-course-content');
    
    if (!courseModal || !modalCourseTitle || !modalCourseContent) return;
    
    modalCourseTitle.textContent = course.title;
    modalCourseContent.innerHTML = `
        <div class="course-details">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Plataforma</div>
                    <div style="font-weight: 500; color: var(--text-color);">${course.platform}</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Categoría</div>
                    <div style="font-weight: 500; color: var(--text-color);">${course.category}</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Certificado</div>
                    <div style="font-weight: 500; color: ${course.certificate ? 'var(--primary-gold)' : 'var(--text-secondary)'}">
                        ${course.certificate ? '✅ Incluido' : '❌ No incluido'}
                    </div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Estado</div>
                    <div style="font-weight: 500; color: ${course.active ? '#4CAF50' : '#f44336'}">
                        ${course.active ? '🟢 Activo' : '🔴 Inactivo'}
                    </div>
                </div>
            </div>
            
            <div class="course-embed">
                <div class="text-content">
                    <h4 style="color: var(--text-color); margin-bottom: 15px;">Descripción Completa</h4>
                    <p style="color: var(--text-color); line-height: 1.7;">${course.description}</p>
                    
                    ${course.link && course.link !== '#' ? 
                        `<div style="margin-top: 25px;">
                            <a href="${course.link}" target="_blank" class="btn btn-primary">
                                <i class="fas fa-external-link-alt"></i> Acceder al curso
                            </a>
                        </div>` : 
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
    const courseModal = document.getElementById('course-modal');
    if (courseModal) {
        courseModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ============================================
// PANEL DE ADMINISTRACIÓN (FUNCIONAL)
// ============================================
function initAdminPanel() {
    // Botón de acceso al admin
    const adminAccessBtn = document.getElementById('admin-access-btn');
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAdminLogin();
        });
    }
    
    // Formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            // Credenciales simples
            if (username === 'admin' && password === 'admin123') {
                showAdminPanel();
            } else {
                alert('Credenciales incorrectas. Usa: admin / admin123');
            }
        });
    }
    
    // Botón para mostrar credenciales
    const showCredsBtn = document.getElementById('show-creds-btn');
    if (showCredsBtn) {
        showCredsBtn.addEventListener('click', function() {
            const loginHint = document.getElementById('login-hint');
            if (loginHint) {
                loginHint.classList.toggle('active');
                this.textContent = loginHint.classList.contains('active') ? 
                    'Ocultar Credenciales' : 'Mostrar Credenciales';
            }
        });
    }
    
    // Botón cancelar login
    const cancelLoginBtn = document.getElementById('cancel-login-btn');
    if (cancelLoginBtn) {
        cancelLoginBtn.addEventListener('click', closeAdminPanel);
    }
    
    // Botón logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
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
    
    // Tabs del admin
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Actualizar botones activos
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar contenido activo
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const activeTab = document.getElementById(tabId);
            if (activeTab) activeTab.classList.add('active');
            
            // Cargar datos específicos del tab
            if (tabId === 'courses-tab') {
                loadAdminCourses();
            } else if (tabId === 'branding-tab') {
                loadBrandingSettings();
            }
        });
    });
    
    // Configuración de branding
    const saveLogoBtn = document.getElementById('save-logo-btn');
    if (saveLogoBtn) {
        saveLogoBtn.addEventListener('click', saveCustomLogo);
    }
    
    const resetLogoBtn = document.getElementById('reset-logo-btn');
    if (resetLogoBtn) {
        resetLogoBtn.addEventListener('click', resetCustomLogo);
    }
    
    const logoUrlInput = document.getElementById('logo-url');
    if (logoUrlInput) {
        logoUrlInput.addEventListener('input', updateLogoPreview);
        // Cargar logo guardado
        if (customLogoUrl) {
            logoUrlInput.value = customLogoUrl;
            updateLogoPreview();
        }
    }
    
    // Cerrar admin con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const adminOverlay = document.getElementById('admin-overlay');
            if (adminOverlay && adminOverlay.style.display === 'flex') {
                closeAdminPanel();
            }
        }
    });
}

function openAdminLogin() {
    const adminOverlay = document.getElementById('admin-overlay');
    if (adminOverlay) {
        adminOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function showAdminPanel() {
    const adminLogin = document.getElementById('admin-login');
    const adminPanel = document.getElementById('admin-panel');
    
    if (adminLogin) adminLogin.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    
    // Cargar datos iniciales
    loadAdminCourses();
    loadBrandingSettings();
}

function closeAdminPanel() {
    const adminOverlay = document.getElementById('admin-overlay');
    if (adminOverlay) {
        adminOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function loadAdminCourses() {
    const adminCoursesList = document.getElementById('admin-courses-list');
    if (!adminCoursesList) return;
    
    adminCoursesList.innerHTML = '';
    
    courses.forEach(course => {
        const courseItem = document.createElement('div');
        courseItem.className = 'admin-course-item';
        
        courseItem.innerHTML = `
            <div class="admin-course-header">
                <div class="admin-course-title">${course.title}</div>
                <div class="admin-course-actions">
                    <button class="action-btn edit" onclick="editCourseInSheets(${course.id})">
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
                <div><strong>Enlace:</strong> ${course.link && course.link !== '#' ? 
                    `<a href="${course.link}" target="_blank">Ver curso</a>` : 
                    'No disponible'}</div>
            </div>
        `;
        
        adminCoursesList.appendChild(courseItem);
    });
}

function loadBrandingSettings() {
    updateLogoPreview();
}

function updateLogoPreview() {
    const logoUrlInput = document.getElementById('logo-url');
    const logoPreviewImg = document.getElementById('logo-preview-img');
    const defaultLogoText = document.getElementById('default-logo-text');
    
    if (!logoUrlInput || !logoPreviewImg || !defaultLogoText) return;
    
    const url = logoUrlInput.value.trim();
    
    if (url) {
        logoPreviewImg.src = url;
        logoPreviewImg.classList.add('active');
        defaultLogoText.style.display = 'none';
        
        // Manejar error de carga
        logoPreviewImg.onerror = function() {
            logoPreviewImg.classList.remove('active');
            defaultLogoText.style.display = 'block';
            defaultLogoText.textContent = 'Error al cargar la imagen';
        };
    } else {
        logoPreviewImg.classList.remove('active');
        defaultLogoText.style.display = 'block';
        defaultLogoText.textContent = 'Logo predeterminado';
    }
}

function saveCustomLogo() {
    const logoUrlInput = document.getElementById('logo-url');
    if (!logoUrlInput) return;
    
    const url = logoUrlInput.value.trim();
    
    if (url) {
        try {
            // Validar URL
            new URL(url);
            
            customLogoUrl = url;
            localStorage.setItem('customLogoUrl', url);
            
            // Actualizar logo en el hero
            updateHeroLogo();
            
            alert('Logo guardado exitosamente. Recarga la página para verlo en todas partes.');
            
        } catch (error) {
            alert('Por favor ingresa una URL válida (ej: https://tusitio.com/logo.png)');
        }
    } else {
        alert('Por favor ingresa una URL para el logo');
    }
}

function resetCustomLogo() {
    customLogoUrl = '';
    localStorage.removeItem('customLogoUrl');
    
    const logoUrlInput = document.getElementById('logo-url');
    if (logoUrlInput) logoUrlInput.value = '';
    
    updateLogoPreview();
    updateHeroLogo();
    
    alert('Logo restablecido al predeterminado');
}

function updateHeroLogo() {
    const heroLogoImg = document.getElementById('hero-logo-img');
    const heroLogoDefault = document.querySelector('.hero-logo-default');
    
    if (!heroLogoImg || !heroLogoDefault) return;
    
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

// Funciones auxiliares del admin
function editCourseInSheets(courseId) {
    alert('Para editar cursos, abre tu Google Sheets directamente.\nLos cambios se reflejarán al recargar la página.');
    
    // Intentar abrir Google Sheets si hay URL configurada
    if (GOOGLE_SHEETS_CSV_URL && !GOOGLE_SHEETS_CSV_URL.includes('TU_URL')) {
        const editUrl = GOOGLE_SHEETS_CSV_URL.replace('/pub?', '/edit?');
        window.open(editUrl, '_blank');
    }
}

function deleteCourse(courseId) {
    if (confirm('¿Estás seguro de eliminar este curso?\nNota: Debes eliminarlo manualmente en Google Sheets.')) {
        alert('Para eliminar cursos, edítalos directamente en Google Sheets.\nMarca la columna "Activo" como FALSE para ocultarlo.');
    }
}

// ============================================
// FUNCIONES GLOBALES
// ============================================
window.clearSearch = function() {
    searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    renderCourses();
};

window.loadCourses = loadCourses;
window.openCourseModal = openCourseModal;
window.closeModal = closeModal;
window.openAdminLogin = openAdminLogin;
window.closeAdminPanel = closeAdminPanel;
window.editCourseInSheets = editCourseInSheets;
window.deleteCourse = deleteCourse;
window.saveCustomLogo = saveCustomLogo;
window.resetCustomLogo = resetCustomLogo;

// Inicializar logo del hero
updateHeroLogo();
