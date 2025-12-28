// CONFIGURACIÓN - PEGA EL ID DE TU GOOGLE SHEETS (NO LA URL COMPLETA)
const GOOGLE_SHEET_ID = '1YAqfZadMR5O6mABhl0QbhF8scbtIW9JJPfwdED4bzDQ'; // <-- SOLO EL ID

// Variables globales
let courses = [];
let categories = [
    { id: "todos", name: "Todos", displayName: "Todos" }
];
let currentCategory = "todos";
let searchQuery = "";

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
const loadingElement = document.getElementById('loading-courses');
const errorElement = document.getElementById('error-courses');
const retryLoadBtn = document.getElementById('retry-load-btn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFilters();
    initAdmin();
    initModal();
    
    // Cargar cursos desde Google Sheets
    loadCoursesFromGoogleSheets();
    
    // Configurar botón de reintentar
    if (retryLoadBtn) {
        retryLoadBtn.addEventListener('click', loadCoursesFromGoogleSheets);
    }
});

// Navigation
function initNavigation() {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
    
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

// FUNCIÓN PRINCIPAL CORREGIDA - CARGAR DESDE GOOGLE SHEETS
async function loadCoursesFromGoogleSheets() {
    try {
        // Mostrar cargando
        showLoading(true);
        hideError();
        
        // ID válido? (ejemplo: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms")
        if (!GOOGLE_SHEET_ID || GOOGLE_SHEET_ID.includes('TU_ID')) {
            throw new Error('Configura el ID de Google Sheets en el código');
        }
        
        // URL CORREGIDA - Esta SÍ funciona
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json`;
        
        console.log('Cargando desde:', sheetUrl);
        
        const response = await fetch(sheetUrl);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        
        // Parsear respuesta especial de Google Visualization API
        const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonText);
        
        // Verificar si hay datos
        if (!data.table || !data.table.rows) {
            throw new Error('No hay datos en la hoja');
        }
        
        // Convertir datos
        courses = parseGoogleSheetsData(data.table);
        
        console.log('Cursos cargados:', courses.length);
        
        // Actualizar UI
        updateCategoriesFromCourses();
        updateFilterButtons();
        renderCourses();
        updateCourseCount();
        
        // Ocultar loading
        showLoading(false);
        
    } catch (error) {
        console.error('Error al cargar Google Sheets:', error);
        showLoading(false);
        showError(`Error: ${error.message}<br>Verifica que el Google Sheet sea público.`);
    }
}

// Función para parsear datos de Google Sheets
function parseGoogleSheetsData(table) {
    const rows = table.rows;
    const cols = table.cols || [];
    
    // Crear cursos
    const coursesArray = rows.map((row, rowIndex) => {
        const course = { id: rowIndex + 1 };
        
        // Mapear cada celda
        if (row.c) {
            row.c.forEach((cell, cellIndex) => {
                if (cell && cell.v !== undefined && cell.v !== null) {
                    // Determinar nombre de columna
                    let colName = '';
                    
                    // Intentar determinar nombre basado en posición o contenido
                    if (rowIndex === 0) {
                        // Primera fila son encabezados
                        return;
                    }
                    
                    // Asignar nombres según posición (más robusto)
                    switch(cellIndex) {
                        case 0: colName = 'title'; break;
                        case 1: colName = 'description'; break;
                        case 2: colName = 'category'; break;
                        case 3: colName = 'platform'; break;
                        case 4: colName = 'link'; break;
                        case 5: colName = 'certificate'; break;
                        case 6: colName = 'active'; break;
                        default: colName = `col${cellIndex}`;
                    }
                    
                    course[colName] = cell.v;
                }
            });
        }
        
        return course;
    }).filter(course => course.title); // Filtrar filas vacías
    
    // Remover primera fila si son encabezados
    return coursesArray;
}

function updateCategoriesFromCourses() {
    // Obtener categorías únicas
    const uniqueCategories = [...new Set(courses.map(course => 
        course.category || 'General'
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
    if (!coursesGrid) return;
    
    coursesGrid.innerHTML = '';
    
    // Filtrar cursos
    let filteredCourses = courses.filter(course => 
        course.active !== false && 
        course.active !== 'false' && 
        course.active !== 'FALSE'
    );
    
    if (currentCategory !== 'todos') {
        filteredCourses = filteredCourses.filter(course => {
            const cat = (course.category || '').toLowerCase();
            return cat === currentCategory;
        });
    }
    
    if (searchQuery) {
        filteredCourses = filteredCourses.filter(course => {
            const title = (course.title || '').toLowerCase();
            const desc = (course.description || '').toLowerCase();
            const platform = (course.platform || '').toLowerCase();
            
            return title.includes(searchQuery) || 
                   desc.includes(searchQuery) || 
                   platform.includes(searchQuery);
        });
    }
    
    // Si no hay cursos
    if (filteredCourses.length === 0) {
        coursesGrid.innerHTML = `
            <div class="no-courses" style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--primary-gold); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">No se encontraron cursos</h3>
                <p style="color: var(--text-secondary);">Intenta con otra categoría o término de búsqueda</p>
                <button class="btn btn-primary" onclick="loadCoursesFromGoogleSheets()" style="margin-top: 20px;">
                    <i class="fas fa-sync-alt"></i> Actualizar
                </button>
            </div>
        `;
        return;
    }
    
    // Renderizar tarjetas
    filteredCourses.forEach(course => {
        const categoryName = course.category || 'General';
        const category = categories.find(cat => cat.id === categoryName.toLowerCase()) || 
                        { displayName: categoryName };
        
        const courseCard = createCourseCard(course, category);
        coursesGrid.appendChild(courseCard);
    });
}

function createCourseCard(course, category) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    
    const title = course.title || 'Curso sin título';
    const description = course.description || 'Descripción no disponible';
    const platform = course.platform || 'Plataforma no especificada';
    const link = course.link || '#';
    const hasCertificate = course.certificate === true || 
                          course.certificate === 'true' || 
                          course.certificate === 'TRUE' || 
                          course.certificate === 'Sí';
    
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
                ${link !== '#' ? 
                    `<a href="${link}" target="_blank" class="btn btn-small btn-secondary">
                        Ir al Curso
                    </a>` : 
                    `<button class="btn btn-small btn-secondary" disabled>
                        Sin enlace
                    </button>`
                }
            </div>
        </div>
    `;
    
    // Event listener
    courseCard.querySelector('.view-course-btn').addEventListener('click', () => {
        openCourseModal(course);
    });
    
    return courseCard;
}

function updateCourseCount() {
    if (totalCoursesElement) {
        const activeCourses = courses.filter(course => 
            course.active !== false && 
            course.active !== 'false' && 
            course.active !== 'FALSE'
        ).length;
        totalCoursesElement.textContent = activeCourses;
    }
}

function showLoading(show) {
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
    if (coursesGrid) {
        coursesGrid.style.display = show ? 'none' : 'grid';
    }
}

function showError(message) {
    if (errorElement) {
        errorElement.innerHTML = `
            <div style="text-align: center; padding: 40px; background-color: rgba(255, 107, 107, 0.1); border-radius: 8px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">Error al cargar los cursos</h3>
                <div style="color: var(--text-secondary); margin-bottom: 20px;">${message}</div>
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="loadCoursesFromGoogleSheets()">
                        <i class="fas fa-sync-alt"></i> Reintentar
                    </button>
                    <a href="https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit" target="_blank" class="btn btn-secondary" style="margin-left: 10px;">
                        <i class="fas fa-external-link-alt"></i> Ver Google Sheet
                    </a>
                </div>
                <div style="margin-top: 20px; font-size: 0.9rem; color: var(--text-secondary);">
                    <p><strong>Instrucciones:</strong></p>
                    <p>1. Asegúrate que el Google Sheet sea público</p>
                    <p>2. Verifica que el ID en el código sea correcto</p>
                    <p>3. La estructura debe tener al menos: Título, Descripción, Categoría</p>
                </div>
            </div>
        `;
        errorElement.style.display = 'block';
        coursesGrid.style.display = 'none';
    }
}

function hideError() {
    if (errorElement) {
        errorElement.style.display = 'none';
        coursesGrid.style.display = 'grid';
    }
}

// Modal Functions
function initModal() {
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (enrollBtn) {
        enrollBtn.addEventListener('click', () => {
            alert('¡Inscripción exitosa! Serás redirigido al curso.');
            closeModal();
        });
    }
    
    if (courseModal) {
        courseModal.addEventListener('click', (e) => {
            if (e.target === courseModal) {
                closeModal();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && courseModal.style.display === 'flex') {
            closeModal();
        }
    });
}

function openCourseModal(course) {
    const title = course.title || 'Curso sin título';
    const description = course.description || 'Descripción no disponible';
    const platform = course.platform || 'No especificada';
    const categoryName = course.category || 'General';
    const category = categories.find(cat => cat.id === categoryName.toLowerCase()) || 
                    { displayName: categoryName };
    const hasCertificate = course.certificate === true || 
                          course.certificate === 'true' || 
                          course.certificate === 'TRUE' || 
                          course.certificate === 'Sí';
    const link = course.link || '#';
    
    if (modalCourseTitle) modalCourseTitle.textContent = title;
    
    if (modalCourseContent) {
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
                        <p>Este curso incluye contenido actualizado, ejercicios prácticos, proyectos reales y soporte continuo para garantizar tu aprendizaje efectivo.</p>
                        ${hasCertificate ? 
                            '<p><i class="fas fa-certificate"></i> Al completar el curso recibirás un certificado digital verificable.</p>' : 
                            ''
                        }
                        ${link !== '#' ? 
                            `<p><strong>Enlace directo:</strong> <a href="${link}" target="_blank">${link}</a></p>` : 
                            ''
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    if (courseModal) {
        courseModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    if (courseModal) {
        courseModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Admin Functions
function initAdmin() {
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAdminPanel();
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            if (username === 'admin' && password === 'admin123') {
                loginSuccess();
            } else {
                alert('Credenciales: admin / admin123');
            }
        });
    }
    
    if (cancelLoginBtn) {
        cancelLoginBtn.addEventListener('click', closeAdminPanel);
    }
    
    if (showCredsBtn) {
        showCredsBtn.addEventListener('click', () => {
            if (loginHint) {
                loginHint.classList.toggle('active');
                showCredsBtn.textContent = loginHint.classList.contains('active') ? 
                    'Ocultar Credenciales' : 'Mostrar Credenciales';
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (adminLogin) adminLogin.style.display = 'block';
            if (adminPanel) adminPanel.style.display = 'none';
            
            const usernameInput = document.getElementById('admin-username');
            const passwordInput = document.getElementById('admin-password');
            
            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            
            if (loginHint) loginHint.classList.remove('active');
            if (showCredsBtn) showCredsBtn.textContent = 'Mostrar Credenciales';
        });
    }
    
    if (tabBtns.length > 0) {
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
}

function openAdminPanel() {
    if (adminOverlay) {
        adminOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAdminPanel() {
    if (adminOverlay) {
        adminOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function loginSuccess() {
    if (adminLogin) adminLogin.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    renderAdminCourses();
}

function renderAdminCourses() {
    if (!adminCoursesList) return;
    
    adminCoursesList.innerHTML = '';
    
    courses.forEach(course => {
        const title = course.title || 'Curso sin título';
        const categoryName = course.category || 'General';
        const category = categories.find(cat => cat.id === categoryName.toLowerCase()) || 
                        { displayName: categoryName };
        const platform = course.platform || 'No especificada';
        const link = course.link || '#';
        const hasCertificate = course.certificate === true || 
                              course.certificate === 'true' || 
                              course.certificate === 'TRUE';
        const isActive = course.active !== false && 
                        course.active !== 'false' && 
                        course.active !== 'FALSE';
        
        const courseItem = document.createElement('div');
        courseItem.className = 'admin-course-item';
        courseItem.innerHTML = `
            <div class="admin-course-header">
                <div class="admin-course-title">${title}</div>
                <div class="admin-course-actions">
                    <a href="https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit" target="_blank" class="action-btn edit">
                        <i class="fas fa-edit"></i> Editar en Sheets
                    </a>
                    <button class="action-btn refresh" onclick="loadCoursesFromGoogleSheets()">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                </div>
            </div>
            <div class="admin-course-details">
                <div><strong>Categoría:</strong> ${category.displayName}</div>
                <div><strong>Plataforma:</strong> ${platform}</div>
                <div><strong>Certificado:</strong> ${hasCertificate ? 'Sí' : 'No'}</div>
                <div><strong>Estado:</strong> ${isActive ? 'Activo' : 'Inactivo'}</div>
                <div><strong>Enlace:</strong> ${link !== '#' ? `<a href="${link}" target="_blank">Ver curso</a>` : 'No disponible'}</div>
            </div>
        `;
        adminCoursesList.appendChild(courseItem);
    });
}

// Botón de actualización en la página principal
function addRefreshButton() {
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-small btn-primary';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Cursos';
    refreshBtn.style.marginLeft = '20px';
    refreshBtn.style.marginTop = '10px';
    refreshBtn.addEventListener('click', loadCoursesFromGoogleSheets);
    
    const filters = document.querySelector('.filters');
    if (filters) {
        filters.appendChild(refreshBtn);
    }
}

// Inicializar botón de actualización
setTimeout(addRefreshButton, 1000);
