// ============================================
// CONFIGURACIÓN - PEGA TU ID DE GOOGLE SHEETS
// ============================================
const GOOGLE_SHEET_ID = '1YAqfZadMR5O6mABhl0QbhF8scbtIW9JJPfwdED4bzDQ'; // <-- REEMPLAZA ESTO CON TU ID
const GOOGLE_SHEETS_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json`;

// ============================================
// VARIABLES GLOBALES
// ============================================
let courses = [];
let categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
let currentCategory = "todos";
let searchQuery = "";

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Academia Élite...');
    
    // Inicializar componentes
    initNavigation();
    initFilters();
    initAdmin();
    initModal();
    
    // Cargar cursos
    loadCoursesWithJSONP();
    
    // Configurar búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderCourses();
        });
    }
    
    // Botón de actualización
    addRefreshButton();
});

// ============================================
// FUNCIÓN PRINCIPAL - CARGAR CURSOS (GARANTIZADA)
// ============================================
function loadCoursesWithJSONP() {
    console.log('Cargando cursos desde Google Sheets...');
    
    // Mostrar estado de carga
    showLoading(true);
    
    // Crear script para JSONP (evita problemas de CORS)
    const scriptId = 'googleSheetsJSONP';
    const oldScript = document.getElementById(scriptId);
    if (oldScript) {
        oldScript.remove();
    }
    
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `${GOOGLE_SHEETS_URL}&callback=handleGoogleSheetsData`;
    
    // Manejar errores
    script.onerror = function() {
        console.error('Error al cargar Google Sheets');
        showError('No se pudo conectar a Google Sheets. Verifica: <br>1. Que la hoja sea pública<br>2. Que el ID sea correcto<br>3. Tu conexión a internet');
        showLoading(false);
    };
    
    document.head.appendChild(script);
}

// ============================================
// MANEJAR DATOS DE GOOGLE SHEETS
// ============================================
window.handleGoogleSheetsData = function(response) {
    console.log('Datos recibidos de Google Sheets:', response);
    
    try {
        if (!response || !response.table || !response.table.rows) {
            throw new Error('Estructura de datos inválida');
        }
        
        // Parsear datos
        courses = parseSheetData(response.table);
        console.log(`${courses.length} cursos cargados`);
        
        // Actualizar UI
        updateCategoriesFromCourses();
        updateFilterButtons();
        renderCourses();
        updateCourseCount();
        
        // Ocultar loading
        showLoading(false);
        
    } catch (error) {
        console.error('Error procesando datos:', error);
        showError('Error al procesar los datos. Verifica la estructura de tu hoja.');
        showLoading(false);
    }
};

// ============================================
// PARSER DE DATOS DE GOOGLE SHEETS
// ============================================
function parseSheetData(table) {
    const rows = table.rows;
    const coursesArray = [];
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Saltar fila vacía
        if (!row.c || row.c.length === 0) continue;
        
        const course = {
            id: i + 1,
            title: getCellValue(row.c[0]) || `Curso ${i + 1}`,
            description: getCellValue(row.c[1]) || 'Descripción no disponible',
            category: getCellValue(row.c[2]) || 'General',
            platform: getCellValue(row.c[3]) || 'No especificada',
            link: getCellValue(row.c[4]) || '#',
            certificate: parseBoolean(getCellValue(row.c[5])),
            active: parseBoolean(getCellValue(row.c[6]), true)
        };
        
        // Solo agregar si tiene título
        if (course.title && course.title !== `Curso ${i + 1}`) {
            coursesArray.push(course);
        }
    }
    
    return coursesArray;
}

function getCellValue(cell) {
    if (!cell) return '';
    return cell.v !== undefined ? cell.v : '';
}

function parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') return defaultValue;
    
    if (typeof value === 'boolean') return value;
    
    const strValue = String(value).toLowerCase().trim();
    return strValue === 'true' || strValue === 'sí' || strValue === 'si' || strValue === '1' || strValue === 'verdadero';
}

// ============================================
// UI FUNCTIONS
// ============================================
function updateCategoriesFromCourses() {
    // Resetear categorías (mantener "todos")
    categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
    
    // Obtener categorías únicas
    const categorySet = new Set();
    courses.forEach(course => {
        if (course.category && course.category.trim()) {
            categorySet.add(course.category.trim());
        }
    });
    
    // Agregar categorías
    categorySet.forEach(catName => {
        const id = catName.toLowerCase().replace(/\s+/g, '-');
        const displayName = catName.charAt(0).toUpperCase() + catName.slice(1);
        
        categories.push({
            id: id,
            name: catName,
            displayName: displayName
        });
    });
}

function updateFilterButtons() {
    const filterButtons = document.getElementById('filter-buttons');
    if (!filterButtons) return;
    
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
    const coursesGrid = document.getElementById('courses-grid');
    if (!coursesGrid) return;
    
    // Filtrar cursos
    let filteredCourses = courses.filter(course => course.active !== false);
    
    if (currentCategory !== 'todos') {
        filteredCourses = filteredCourses.filter(course => {
            const catId = course.category.toLowerCase().replace(/\s+/g, '-');
            return catId === currentCategory;
        });
    }
    
    if (searchQuery) {
        filteredCourses = filteredCourses.filter(course => {
            const title = (course.title || '').toLowerCase();
            const desc = (course.description || '').toLowerCase();
            const platform = (course.platform || '').toLowerCase();
            const category = (course.category || '').toLowerCase();
            
            return title.includes(searchQuery) || 
                   desc.includes(searchQuery) || 
                   platform.includes(searchQuery) ||
                   category.includes(searchQuery);
        });
    }
    
    // Limpiar grid
    coursesGrid.innerHTML = '';
    
    // Si no hay cursos
    if (filteredCourses.length === 0) {
        coursesGrid.innerHTML = `
            <div class="no-courses" style="text-align: center; padding: 60px 20px; grid-column: 1/-1;">
                <i class="fas fa-book-open" style="font-size: 4rem; color: var(--primary-gold); margin-bottom: 20px; opacity: 0.7;"></i>
                <h3 style="margin-bottom: 15px; color: var(--text-color);">No se encontraron cursos</h3>
                <p style="color: var(--text-secondary); margin-bottom: 30px; max-width: 500px; margin-left: auto; margin-right: auto;">
                    ${searchQuery ? 
                        'No hay cursos que coincidan con tu búsqueda.' : 
                        'No hay cursos disponibles en esta categoría.'
                    }
                </p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="currentCategory='todos'; updateFilterButtons(); renderCourses();">
                        <i class="fas fa-list"></i> Ver todos los cursos
                    </button>
                    <button class="btn btn-secondary" onclick="loadCoursesWithJSONP()">
                        <i class="fas fa-sync-alt"></i> Recargar cursos
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // Renderizar cursos
    filteredCourses.forEach(course => {
        const categoryName = course.category || 'General';
        const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
        const category = categories.find(cat => cat.id === categoryId) || {
            displayName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
        };
        
        const courseCard = createCourseCard(course, category);
        coursesGrid.appendChild(courseCard);
    });
}

function createCourseCard(course, category) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    
    // Determinar ícono según categoría
    let iconClass = 'fas fa-laptop-code';
    const catLower = (course.category || '').toLowerCase();
    
    if (catLower.includes('diseño') || catLower.includes('design')) {
        iconClass = 'fas fa-palette';
    } else if (catLower.includes('marketing')) {
        iconClass = 'fas fa-bullhorn';
    } else if (catLower.includes('finanza') || catLower.includes('business')) {
        iconClass = 'fas fa-chart-line';
    } else if (catLower.includes('data') || catLower.includes('ciencia')) {
        iconClass = 'fas fa-chart-bar';
    }
    
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
                <span class="course-category">${category.displayName}</span>
                <span class="course-platform">${course.platform}</span>
            </div>
            <div class="course-actions">
                <button class="btn btn-small btn-primary view-course-btn" data-id="${course.id}">
                    <i class="fas fa-eye"></i> Ver Detalles
                </button>
                ${course.link && course.link !== '#' ? 
                    `<a href="${course.link}" target="_blank" class="btn btn-small btn-secondary">
                        <i class="fas fa-external-link-alt"></i> Ir al Curso
                    </a>` : 
                    `<button class="btn btn-small btn-secondary" disabled>
                        <i class="fas fa-link-slash"></i> Sin enlace
                    </button>`
                }
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
    const totalCoursesElement = document.getElementById('total-courses');
    if (totalCoursesElement) {
        const activeCourses = courses.filter(course => course.active !== false).length;
        totalCoursesElement.textContent = activeCourses;
    }
}

// ============================================
// ESTADOS DE UI
// ============================================
function showLoading(show) {
    const coursesGrid = document.getElementById('courses-grid');
    const loadingElement = document.getElementById('loading-courses');
    const errorElement = document.getElementById('error-courses');
    
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
    
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    if (coursesGrid) {
        coursesGrid.style.display = show ? 'none' : 'grid';
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-courses');
    const coursesGrid = document.getElementById('courses-grid');
    const loadingElement = document.getElementById('loading-courses');
    
    if (errorElement) {
        errorElement.innerHTML = `
            <div style="text-align: center; padding: 40px; background-color: rgba(212, 175, 55, 0.1); border-radius: 8px; border: 1px solid var(--primary-gold);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--primary-gold); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 15px; color: var(--text-color);">Atención</h3>
                <div style="color: var(--text-secondary); margin-bottom: 25px; line-height: 1.6;">
                    ${message}
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="loadCoursesWithJSONP()">
                        <i class="fas fa-sync-alt"></i> Reintentar
                    </button>
                    <a href="https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit" target="_blank" class="btn btn-secondary">
                        <i class="fas fa-edit"></i> Abrir Google Sheet
                    </a>
                </div>
                <div style="margin-top: 25px; padding: 15px; background-color: rgba(0,0,0,0.2); border-radius: 4px; text-align: left;">
                    <p style="margin-bottom: 10px; color: var(--text-color);"><strong>¿Primera vez configurando?</strong></p>
                    <ol style="color: var(--text-secondary); padding-left: 20px; margin: 0; text-align: left;">
                        <li>Abre tu Google Sheet</li>
                        <li>Haz clic en <strong>"Compartir"</strong> (arriba derecha)</li>
                        <li>Selecciona <strong>"Cualquiera con el enlace"</strong></li>
                        <li>Elige <strong>"Lector"</strong></li>
                        <li>Copia el ID de la URL y pégala en el código</li>
                    </ol>
                </div>
            </div>
        `;
        errorElement.style.display = 'block';
    }
    
    if (coursesGrid) {
        coursesGrid.style.display = 'none';
    }
    
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function addRefreshButton() {
    // Agregar botón en el header
    const sectionHeader = document.querySelector('.section-header');
    if (sectionHeader) {
        const existingBtn = sectionHeader.querySelector('.refresh-btn');
        if (existingBtn) existingBtn.remove();
        
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-small btn-primary refresh-btn';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Cursos';
        refreshBtn.style.marginLeft = '15px';
        refreshBtn.style.marginTop = '10px';
        refreshBtn.onclick = loadCoursesWithJSONP;
        
        sectionHeader.appendChild(refreshBtn);
    }
    
    // Agregar botón en los filtros
    const filters = document.querySelector('.filters');
    if (filters) {
        const existingFilterBtn = filters.querySelector('.refresh-filter-btn');
        if (existingFilterBtn) existingFilterBtn.remove();
        
        const filterRefreshBtn = document.createElement('button');
        filterRefreshBtn.className = 'btn btn-small refresh-filter-btn';
        filterRefreshBtn.innerHTML = '<i class="fas fa-redo"></i>';
        filterRefreshBtn.title = 'Actualizar cursos';
        filterRefreshBtn.style.marginLeft = '10px';
        filterRefreshBtn.onclick = loadCoursesWithJSONP;
        
        const searchBox = filters.querySelector('.search-box');
        if (searchBox) {
            searchBox.parentNode.insertBefore(filterRefreshBtn, searchBox.nextSibling);
        } else {
            filters.appendChild(filterRefreshBtn);
        }
    }
}

// ============================================
// NAVEGACIÓN
// ============================================
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        document.querySelectorAll('.nav-link').forEach(n => {
            n.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            e.preventDefault();
            const targetElement = document.querySelector(href);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// FILTROS
// ============================================
function initFilters() {
    updateFilterButtons();
}

// ============================================
// MODAL
// ============================================
function initModal() {
    const modalClose = document.getElementById('modal-close');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const courseModal = document.getElementById('course-modal');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (courseModal) {
        courseModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    
    // Cerrar con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function openCourseModal(course) {
    const courseModal = document.getElementById('course-modal');
    const modalCourseTitle = document.getElementById('modal-course-title');
    const modalCourseContent = document.getElementById('modal-course-content');
    
    if (!courseModal || !modalCourseTitle || !modalCourseContent) return;
    
    // Información del curso
    const categoryName = course.category || 'General';
    const category = categories.find(cat => 
        cat.id === categoryName.toLowerCase().replace(/\s+/g, '-')
    ) || { displayName: categoryName };
    
    modalCourseTitle.textContent = course.title;
    modalCourseContent.innerHTML = `
        <div class="course-details">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="detail-item">
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Plataforma</div>
                    <div style="font-weight: 500; color: var(--text-color);">${course.platform}</div>
                </div>
                <div class="detail-item">
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Categoría</div>
                    <div style="font-weight: 500; color: var(--text-color);">${category.displayName}</div>
                </div>
                <div class="detail-item">
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Certificado</div>
                    <div style="font-weight: 500; color: ${course.certificate ? 'var(--primary-gold)' : 'var(--text-secondary)'};">
                        ${course.certificate ? '✅ Incluido' : '❌ No incluido'}
                    </div>
                </div>
                <div class="detail-item">
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Acceso</div>
                    <div style="font-weight: 500; color: var(--text-color);">24/7 desde cualquier dispositivo</div>
                </div>
            </div>
            
            <div class="course-embed">
                <div class="text-content">
                    <h4 style="color: var(--text-color); margin-bottom: 20px; font-size: 1.3rem;">Descripción Completa</h4>
                    <p style="color: var(--text-color); line-height: 1.8; margin-bottom: 20px;">${course.description}</p>
                    
                    ${course.certificate ? 
                        `<div style="background-color: rgba(212, 175, 55, 0.1); padding: 15px; border-radius: 4px; border-left: 4px solid var(--primary-gold); margin: 20px 0;">
                            <div style="display: flex; align-items: center; gap: 10px; color: var(--text-color);">
                                <i class="fas fa-certificate" style="color: var(--primary-gold);"></i>
                                <div>
                                    <strong style="display: block; margin-bottom: 5px;">Certificado Incluido</strong>
                                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                        Al completar el curso recibirás un certificado digital verificable que podrás añadir a tu currículum y perfil profesional.
                                    </div>
                                </div>
                            </div>
                        </div>` : 
                        ''
                    }
                    
                    ${course.link && course.link !== '#' ? 
                        `<div style="margin-top: 30px;">
                            <a href="${course.link}" target="_blank" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
                                <i class="fas fa-external-link-alt"></i>
                                Acceder al Curso
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
// ADMIN (Simplificado - solo lectura)
// ============================================
function initAdmin() {
    // Esta función se mantiene simple ya que no podemos escribir en Google Sheets sin autenticación
    const adminAccessBtn = document.getElementById('admin-access-btn');
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Panel de administración disponible en versiones premium. Para editar cursos, modifica directamente tu Google Sheet.');
            window.open(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`, '_blank');
        });
    }
}

// ============================================
// EXPORTAR FUNCIONES PARA HTML
// ============================================
window.loadCoursesWithJSONP = loadCoursesWithJSONP;
window.openCourseModal = openCourseModal;
window.closeModal = closeModal;
