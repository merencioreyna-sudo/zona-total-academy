// Configuración de Google Sheets API
const GOOGLE_SHEET_ID = '1YAqfZadMR5O6mABhl0QbhF8scbtIW9JJPfwdED4bzDQ'; // <-- REEMPLAZA CON TU ID
const API_KEY = 'TU_API_KEY_AQUI'; // <-- OPCIONAL: Para más seguridad
const SHEET_NAME = 'Cursos'; // Nombre de la hoja

// URL base para la API de Google Sheets
const SHEETS_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${SHEET_NAME}`;

// Variables globales
let courses = [];
let categories = [
    { id: "todos", name: "Todos", displayName: "Todos" }
];
let currentCategory = "todos";
let searchQuery = "";
let customLogoUrl = localStorage.getItem('customLogoUrl') || "";

// DOM Elements (los mismos que antes)
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
const addCourseForm = document.getElementById('add-course-form');
const newCourseCategory = document.getElementById('new-course-category');
const logoUrlInput = document.getElementById('logo-url');
const logoPreviewImg = document.getElementById('logo-preview-img');
const defaultLogoText = document.getElementById('default-logo-text');
const saveLogoBtn = document.getElementById('save-logo-btn');
const resetLogoBtn = document.getElementById('reset-logo-btn');
const heroLogoImg = document.getElementById('hero-logo-img');
const loadingCourses = document.getElementById('loading-courses');
const errorCourses = document.getElementById('error-courses');
const errorMessage = document.getElementById('error-message');
const retryLoadBtn = document.getElementById('retry-load-btn');
const formStatus = document.getElementById('form-status');

// Cache settings
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFilters();
    initAdmin();
    initModal();
    updateLogoPreview();
    updateHeroLogo();
    
    // Cargar cursos desde Google Sheets
    loadCoursesFromGoogleSheets();
    
    // Setup retry button
    if (retryLoadBtn) {
        retryLoadBtn.addEventListener('click', loadCoursesFromGoogleSheets);
    }
});

// Navigation (igual que antes)
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
    
    // Smooth scrolling for anchor links
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
    
    // Set active nav link based on scroll position
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
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

// Función principal para cargar desde Google Sheets
async function loadCoursesFromGoogleSheets() {
    try {
        // Mostrar estado de carga
        showLoading(true);
        hideError();
        
        // Construir URL con parámetros
        let url = `${SHEETS_API_URL}?valueRenderOption=FORMATTED_VALUE`;
        
        // Añadir API key si está configurada
        if (API_KEY && API_KEY !== 'TU_API_KEY_AQUI') {
            url += `&key=${API_KEY}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.values && data.values.length > 0) {
            // Convertir datos de Google Sheets a nuestro formato
            courses = parseSheetData(data.values);
            
            // Actualizar categorías
            updateCategoriesFromCourses();
            
            // Actualizar filtros
            updateFilterButtons();
            
            // Renderizar cursos
            renderCourses();
            
            // Actualizar contador
            updateCourseCount();
            
            // Guardar en caché
            saveToCache();
            
        } else {
            throw new Error('No se encontraron datos en la hoja');
        }
        
    } catch (error) {
        console.error('Error al cargar cursos:', error);
        
        // Intentar cargar del caché
        const cached = loadFromCache();
        if (cached) {
            courses = cached;
            updateCategoriesFromCourses();
            updateFilterButtons();
            renderCourses();
            updateCourseCount();
            showError('Usando datos cacheados. ' + error.message);
        } else {
            showError(`No se pudieron cargar los cursos: ${error.message}. Verifica que la hoja sea pública.`);
        }
    } finally {
        showLoading(false);
    }
}

// Parsear datos de Google Sheets
function parseSheetData(sheetData) {
    const headers = sheetData[0];
    const rows = sheetData.slice(1);
    
    return rows.map((row, index) => {
        const course = {
            id: index + 1
        };
        
        // Mapear columnas según estructura esperada
        headers.forEach((header, i) => {
            const key = header.toLowerCase().trim();
            let value = row[i] || '';
            
            // Convertir valores booleanos
            if (key === 'certificado' || key === 'certificate') {
                value = value.toString().toUpperCase() === 'TRUE' || value === true || value === 'Sí';
            }
            
            if (key === 'activo' || key === 'active') {
                value = value.toString().toUpperCase() === 'TRUE' || value === true || value === 'Sí';
            }
            
            course[key] = value;
        });
        
        // Asegurar campos requeridos
        if (!course.title && row[0]) course.title = row[0];
        if (!course.description && row[1]) course.description = row[1];
        if (!course.category && row[2]) course.category = row[2];
        if (!course.platform && row[3]) course.platform = row[3];
        if (!course.link && row[4]) course.link = row[4];
        
        return course;
    }).filter(course => course.title); // Filtrar filas vacías
}

function updateCategoriesFromCourses() {
    // Obtener categorías únicas de los cursos
    const uniqueCategories = [...new Set(courses.map(course => course.category))];
    
    // Agregar nuevas categorías a la lista
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
    
    // Ordenar categorías alfabéticamente (excepto "todos")
    categories.sort((a, b) => {
        if (a.id === 'todos') return -1;
        if (b.id === 'todos') return 1;
        return a.displayName.localeCompare(b.displayName);
    });
}

function updateFilterButtons() {
    // Limpiar botones existentes
    filterButtons.innerHTML = '';
    
    // Crear nuevos botones
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
    
    // Filter courses based on category and search
    let filteredCourses = courses.filter(course => 
        course.active === true || course.active === 'TRUE' || course.active === 'Sí' || course.active === undefined
    );
    
    if (currentCategory !== 'todos') {
        filteredCourses = filteredCourses.filter(course => 
            course.category && course.category.toLowerCase() === currentCategory
        );
    }
    
    if (searchQuery) {
        filteredCourses = filteredCourses.filter(course => 
            (course.title && course.title.toLowerCase().includes(searchQuery)) ||
            (course.description && course.description.toLowerCase().includes(searchQuery)) ||
            (course.platform && course.platform.toLowerCase().includes(searchQuery))
        );
    }
    
    // Render course cards
    filteredCourses.forEach(course => {
        const category = categories.find(cat => cat.id === (course.category || '').toLowerCase()) || 
                        { displayName: course.category || 'General' };
        const courseCard = createCourseCard(course, category);
        coursesGrid.appendChild(courseCard);
    });
    
    // If no courses found
    if (filteredCourses.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--primary-gold); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">No se encontraron cursos</h3>
                <p style="color: var(--text-secondary);">Intenta con otra categoría o término de búsqueda</p>
            </div>
        `;
        coursesGrid.appendChild(noResults);
    }
}

function createCourseCard(course, category) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    
    const hasCertificate = course.certificate === true || course.certificate === 'TRUE' || course.certificate === 'Sí';
    
    courseCard.innerHTML = `
        <div class="course-image">
            <i class="fas fa-laptop-code"></i>
        </div>
        <div class="course-content">
            <div class="course-header">
                <h3 class="course-title">${course.title || 'Curso sin título'}</h3>
                ${hasCertificate ? 
                    '<div class="certificate-badge"><i class="fas fa-certificate"></i> Certificado</div>' : 
                    ''
                }
            </div>
            <p class="course-description">${course.description || 'Descripción no disponible'}</p>
            <div class="course-meta">
                <span class="course-category">${category.displayName}</span>
                <span class="course-platform">${course.platform || 'Plataforma no especificada'}</span>
            </div>
            <div class="course-actions">
                <button class="btn btn-small btn-primary view-course-btn" data-id="${course.id}">
                    Ver Detalles
                </button>
                ${course.link ? 
                    `<a href="${course.link}" target="_blank" class="btn btn-small btn-secondary">
                        Ir al Curso
                    </a>` : 
                    `<button class="btn btn-small btn-secondary" disabled>
                        Sin enlace
                    </button>`
                }
            </div>
        </div>
    `;
    
    // Add event listener for view course button
    courseCard.querySelector('.view-course-btn').addEventListener('click', () => {
        openCourseModal(course);
    });
    
    return courseCard;
}

// Estados de UI
function showLoading(show) {
    if (loadingCourses) {
        loadingCourses.style.display = show ? 'block' : 'none';
    }
    if (coursesGrid) {
        coursesGrid.style.display = show ? 'none' : 'grid';
    }
}

function showError(message) {
    if (errorCourses && errorMessage) {
        errorMessage.textContent = message;
        errorCourses.style.display = 'block';
        coursesGrid.style.display = 'none';
    }
}

function hideError() {
    if (errorCourses) {
        errorCourses.style.display = 'none';
        coursesGrid.style.display = 'grid';
    }
}

function updateCourseCount() {
    if (totalCoursesElement) {
        const activeCourses = courses.filter(course => 
            course.active === true || course.active === 'TRUE' || course.active === 'Sí' || course.active === undefined
        ).length;
        totalCoursesElement.textContent = activeCourses;
    }
}

// Sistema de caché
function saveToCache() {
    try {
        localStorage.setItem('courses_cache', JSON.stringify(courses));
        localStorage.setItem('courses_timestamp', Date.now().toString());
    } catch (e) {
        console.warn('No se pudo guardar en caché:', e);
    }
}

function loadFromCache() {
    try {
        const cachedData = localStorage.getItem('courses_cache');
        const cacheTimestamp = localStorage.getItem('courses_timestamp');
        
        if (cachedData && cacheTimestamp) {
            const age = Date.now() - parseInt(cacheTimestamp);
            
            if (age < CACHE_DURATION) {
                return JSON.parse(cachedData);
            }
        }
    } catch (e) {
        console.warn('Error al cargar del caché:', e);
    }
    return null;
}

// Modal Functions
function initModal() {
    // Close modal buttons
    modalClose.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    enrollBtn.addEventListener('click', () => {
        alert('¡Inscripción exitosa! Serás redirigido al curso.');
        closeModal();
    });
    
    // Close modal when clicking outside
    courseModal.addEventListener('click', (e) => {
        if (e.target === courseModal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && courseModal.style.display === 'flex') {
            closeModal();
        }
    });
}

function openCourseModal(course) {
    const category = categories.find(cat => cat.id === (course.category || '').toLowerCase()) || 
                    { displayName: course.category || 'General' };
    
    const hasCertificate = course.certificate === true || course.certificate === 'TRUE' || course.certificate === 'Sí';
    
    modalCourseTitle.textContent = course.title || 'Curso sin título';
    modalCourseContent.innerHTML = `
        <div class="course-details">
            <div class="detail-row">
                <div class="detail-item">
                    <strong>Plataforma:</strong> ${course.platform || 'No especificada'}
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
                    <p>${course.description || 'Descripción no disponible'}</p>
                    <p>Este curso incluye contenido actualizado, ejercicios prácticos, proyectos reales y soporte continuo para garantizar tu aprendizaje efectivo.</p>
                    ${hasCertificate ? 
                        '<p><i class="fas fa-certificate"></i> Al completar el curso recibirás un certificado digital verificable que podrás añadir a tu currículum y perfil profesional.</p>' : 
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

// Admin Functions (solo lectura para Google Sheets)
function initAdmin() {
    // Admin access button
    adminAccessBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAdminPanel();
    });
    
    // Login form
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        
        // Simple authentication (for demo purposes only)
        if (username === 'admin' && password === 'admin123') {
            loginSuccess();
        } else {
            alert('Credenciales incorrectas. Intenta nuevamente.');
        }
    });
    
    // Cancel login
    cancelLoginBtn.addEventListener('click', () => {
        closeAdminPanel();
    });
    
    // Show credentials button
    showCredsBtn.addEventListener('click', () => {
        loginHint.classList.toggle('active');
        showCredsBtn.textContent = loginHint.classList.contains('active') ? 
            'Ocultar Credenciales' : 'Mostrar Credenciales';
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        adminLogin.style.display = 'block';
        adminPanel.style.display = 'none';
        document.getElementById('admin-username').value = '';
        document.getElementById('admin-password').value = '';
        loginHint.classList.remove('active');
        showCredsBtn.textContent = 'Mostrar Credenciales';
    });
    
    // Admin tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // Load data for specific tabs
            if (tabId === 'courses-tab') {
                renderAdminCourses();
            }
        });
    });
    
    // Populate category select for new course
    populateCategorySelect();
    
    // Desactivar el formulario de agregar curso (solo lectura)
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showFormStatus('⚠️ La edición directa no está disponible. Edita los cursos directamente en Google Sheets.', 'warning');
        });
        
        // Deshabilitar todos los campos del formulario
        const formInputs = addCourseForm.querySelectorAll('input, select, textarea, button');
        formInputs.forEach(input => {
            input.disabled = true;
        });
    }
    
    // Branding
    logoUrlInput.addEventListener('input', updateLogoPreview);
    saveLogoBtn.addEventListener('click', saveLogo);
    resetLogoBtn.addEventListener('click', resetLogo);
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
    populateCategorySelect();
}

function renderAdminCourses() {
    adminCoursesList.innerHTML = '';
    
    courses.forEach(course => {
        const category = categories.find(cat => cat.id === (course.category || '').toLowerCase()) || 
                        { displayName: course.category || 'General' };
        
        const isActive = course.active === true || course.active === 'TRUE' || course.active === 'Sí' || course.active === undefined;
        const hasCertificate = course.certificate === true || course.certificate === 'TRUE' || course.certificate === 'Sí';
        
        const courseItem = document.createElement('div');
        courseItem.className = 'admin-course-item';
        courseItem.innerHTML = `
            <div class="admin-course-header">
                <div class="admin-course-title">${course.title || 'Curso sin título'}</div>
                <div class="admin-course-actions">
                    <a href="https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit" target="_blank" class="action-btn edit">
                        Editar en Sheets
                    </a>
                </div>
            </div>
            <div class="admin-course-details">
                <div><strong>Categoría:</strong> <span class="category-display">${category.displayName}</span></div>
                <div><strong>Plataforma:</strong> ${course.platform || 'No especificada'}</div>
                <div><strong>Certificado:</strong> ${hasCertificate ? 'Sí' : 'No'}</div>
                <div><strong>Estado:</strong> ${isActive ? 'Activo' : 'Inactivo'}</div>
                <div><strong>Enlace:</strong> ${course.link ? `<a href="${course.link}" target="_blank">Ver curso</a>` : 'No disponible'}</div>
            </div>
        `;
        adminCoursesList.appendChild(courseItem);
    });
}

function populateCategorySelect() {
    if (!newCourseCategory) return;
    
    newCourseCategory.innerHTML = '<option value="">Seleccionar categoría</option>';
    
    // Filtrar categorías que no sean "todos"
    categories.filter(cat => cat.id !== 'todos').forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.displayName;
        newCourseCategory.appendChild(option);
    });
}

// Branding Functions
function updateLogoPreview() {
    const url = logoUrlInput.value.trim();
    
    if (url) {
        logoPreviewImg.src = url;
        logoPreviewImg.classList.add('active');
        defaultLogoText.style.display = 'none';
        
        // Handle image loading errors
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

function saveLogo() {
    const url = logoUrlInput.value.trim();
    
    if (url) {
        // Validate URL
        try {
            new URL(url);
            customLogoUrl = url;
            localStorage.setItem('customLogoUrl', url);
            updateHeroLogo();
            alert('Logo guardado exitosamente en este dispositivo.');
        } catch (e) {
            alert('Por favor ingresa una URL válida.');
        }
    } else {
        alert('Por favor ingresa una URL para el logo.');
    }
}

function resetLogo() {
    customLogoUrl = "";
    localStorage.removeItem('customLogoUrl');
    logoUrlInput.value = "";
    updateLogoPreview();
    updateHeroLogo();
    alert('Logo restablecido al predeterminado.');
}

function updateHeroLogo() {
    if (customLogoUrl) {
        heroLogoImg.src = customLogoUrl;
        heroLogoImg.classList.add('active');
        document.querySelector('.hero-logo-default').style.display = 'none';
        
        // Handle image loading errors
        heroLogoImg.onerror = function() {
            heroLogoImg.classList.remove('active');
            document.querySelector('.hero-logo-default').style.display = 'flex';
        };
    } else {
        heroLogoImg.classList.remove('active');
        document.querySelector('.hero-logo-default').style.display = 'flex';
    }
}

function showFormStatus(message, type) {
    if (!formStatus) return;
    
    formStatus.textContent = message;
    formStatus.className = '';
    
    if (type === 'success') {
        formStatus.style.color = '#4CAF50';
    } else if (type === 'error') {
        formStatus.style.color = '#f44336';
    } else if (type === 'warning') {
        formStatus.style.color = '#FFC107';
    } else if (type === 'loading') {
        formStatus.style.color = '#2196F3';
    } else {
        formStatus.style.color = '';
    }
}

// Close admin panel with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && adminOverlay.style.display === 'flex') {
        closeAdminPanel();
    }
});

// Botón para actualizar manualmente
function addRefreshButton() {
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-small';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
    refreshBtn.style.marginLeft = '10px';
    refreshBtn.addEventListener('click', loadCoursesFromGoogleSheets);
    
    // Agregar al header de cursos
    const sectionHeader = document.querySelector('.section-header');
    if (sectionHeader) {
        sectionHeader.appendChild(refreshBtn);
    }
}

// Agregar botón de actualización después de cargar
setTimeout(addRefreshButton, 1000);
