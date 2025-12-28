// ============================================
// CONFIGURACIÓN PRINCIPAL
// ============================================

// ELIGE UN MÉTODO (descomenta solo uno):

// MÉTODO 1: CSV Público (RECOMENDADO - más fácil)
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJpv1h9XBYo7gJPLBx4U_1IiRkf0v-y2W2Z_o-O3V67aPSqAzvBdAomO7SPy-dVSYw3cyUwD3C0oVJ/pub?output=csv';

// MÉTODO 2: JSON con opensheet.elk.sh
// const GOOGLE_SHEET_ID = 'TU_ID_AQUI'; // Solo el ID, no la URL completa
// const SHEET_NAME = 'Cursos'; // Nombre de la hoja

// Variables globales
let courses = [];
let categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
let currentCategory = "todos";
let searchQuery = "";

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Academia Élite - Inicializando...');
    
    initNavigation();
    initFilters();
    initModal();
    initAdmin();
    setupEventListeners();
    
    // Cargar cursos automáticamente
    setTimeout(() => {
        loadCourses();
    }, 500);
});

// ============================================
// FUNCIÓN PRINCIPAL PARA CARGAR CURSOS
// ============================================
async function loadCourses() {
    console.log('Iniciando carga de cursos...');
    showLoading(true);
    hideError();
    
    try {
        // Intentar cargar desde Google Sheets CSV
        await loadFromCSV();
    } catch (error) {
        console.warn('Error con Google Sheets:', error);
        
        // Si falla, mostrar datos de ejemplo con instrucciones
        loadSampleData();
        showConfigInstructions();
    } finally {
        showLoading(false);
    }
}

// ============================================
// MÉTODO CSV (EL MÁS CONFIABLE)
// ============================================
async function loadFromCSV() {
    console.log('Cargando desde CSV...');
    
    const csvUrl = GOOGLE_SHEETS_CSV_URL;
    
    // Verificar que la URL no sea la de ejemplo
    if (csvUrl.includes('TU_ID_AQUI') || csvUrl.includes('EXAMPLE')) {
        throw new Error('Configura la URL de Google Sheets primero');
    }
    
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const csvText = await response.text();
    
    // Verificar que no esté vacío
    if (!csvText || csvText.trim() === '') {
        throw new Error('El CSV está vacío');
    }
    
    // Parsear CSV
    parseCSVData(csvText);
    console.log(`✅ ${courses.length} cursos cargados desde Google Sheets`);
    
    // Actualizar UI
    updateUI();
}

function parseCSVData(csvText) {
    // Separar líneas
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line !== '');
    
    if (lines.length < 2) {
        throw new Error('El CSV necesita al menos una fila de encabezados y una de datos');
    }
    
    // Parsear encabezados (primera línea)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Parsear datos
    courses = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = splitCSVLine(line);
        
        const course = { id: i };
        
        // Asignar valores según posición
        if (values[0]) course.title = values[0].trim();
        if (values[1]) course.description = values[1].trim();
        if (values[2]) course.category = values[2].trim();
        if (values[3]) course.platform = values[3].trim();
        if (values[4]) course.link = values[4].trim();
        
        // Procesar certificado (columna 5)
        if (values[5]) {
            const certValue = values[5].trim().toLowerCase();
            course.certificate = certValue === 'true' || certValue === 'sí' || certValue === 'si' || certValue === '1';
        } else {
            course.certificate = false;
        }
        
        // Procesar activo (columna 6)
        if (values[6]) {
            const activeValue = values[6].trim().toLowerCase();
            course.active = !(activeValue === 'false' || activeValue === 'no' || activeValue === '0');
        } else {
            course.active = true; // Por defecto activo
        }
        
        // Solo agregar si tiene título
        if (course.title && course.title.trim() !== '') {
            courses.push(course);
        }
    }
}

// Función para dividir líneas CSV (maneja comas dentro de comillas)
function splitCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // Agregar el último valor
    values.push(current);
    return values;
}

// ============================================
// DATOS DE EJEMPLO (cuando Google Sheets falla)
// ============================================
function loadSampleData() {
    console.log('Cargando datos de ejemplo...');
    
    courses = [
        {
            id: 1,
            title: "React JS - Desarrollo Web Moderno",
            description: "Aprende React desde cero hasta nivel avanzado. Incluye hooks, context API y proyectos reales.",
            category: "Programación",
            platform: "Udemy",
            link: "#",
            certificate: true,
            active: true
        },
        {
            id: 2,
            title: "Marketing Digital Completo",
            description: "Estrategias de marketing digital, SEO, redes sociales y análisis de métricas.",
            category: "Marketing",
            platform: "Coursera",
            link: "#",
            certificate: true,
            active: true
        },
        {
            id: 3,
            title: "Diseño UX/UI Profesional",
            description: "Aprende diseño de interfaces y experiencia de usuario con Figma y Adobe XD.",
            category: "Diseño",
            platform: "Platzi",
            link: "#",
            certificate: true,
            active: true
        },
        {
            id: 4,
            title: "Python para Ciencia de Datos",
            description: "Curso completo de Python aplicado a análisis de datos y machine learning.",
            category: "Data Science",
            platform: "edX",
            link: "#",
            certificate: true,
            active: true
        },
        {
            id: 5,
            title: "Finanzas Personales e Inversiones",
            description: "Aprende a manejar tus finanzas, crear presupuestos y empezar a invertir.",
            category: "Finanzas",
            platform: "Udemy",
            link: "#",
            certificate: false,
            active: true
        },
        {
            id: 6,
            title: "Desarrollo Web Full Stack",
            description: "Conviértete en desarrollador full stack aprendiendo frontend y backend.",
            category: "Programación",
            platform: "Coursera",
            link: "#",
            certificate: true,
            active: true
        }
    ];
    
    updateUI();
}

// ============================================
// ACTUALIZAR INTERFAZ DE USUARIO
// ============================================
function updateUI() {
    updateCategoriesFromCourses();
    updateFilterButtons();
    renderCourses();
    updateCourseCount();
}

function updateCategoriesFromCourses() {
    // Resetear categorías (mantener "todos")
    categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
    
    // Obtener categorías únicas de los cursos
    const categorySet = new Set();
    
    courses.forEach(course => {
        if (course.category && course.category.trim()) {
            categorySet.add(course.category.trim());
        }
    });
    
    // Agregar categorías al array
    categorySet.forEach(catName => {
        const id = catName.toLowerCase().replace(/\s+/g, '-');
        const displayName = catName.charAt(0).toUpperCase() + catName.slice(1);
        
        categories.push({
            id: id,
            name: catName,
            displayName: displayName
        });
    });
    
    // Ordenar alfabéticamente
    categories.sort((a, b) => {
        if (a.id === 'todos') return -1;
        if (b.id === 'todos') return 1;
        return a.displayName.localeCompare(b.displayName);
    });
}

function updateFilterButtons() {
    const filterButtons = document.getElementById('filter-buttons');
    if (!filterButtons) return;
    
    // Limpiar botones existentes
    filterButtons.innerHTML = '';
    
    // Crear nuevos botones
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `filter-btn ${category.id === currentCategory ? 'active' : ''}`;
        button.textContent = category.displayName;
        button.dataset.category = category.id;
        
        button.addEventListener('click', () => {
            // Actualizar categoría activa
            currentCategory = category.id;
            
            // Actualizar estado visual de los botones
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // Volver a renderizar los cursos
            renderCourses();
        });
        
        filterButtons.appendChild(button);
    });
}

function renderCourses() {
    const coursesGrid = document.getElementById('courses-grid');
    if (!coursesGrid) return;
    
    // Ocultar mensaje de error si está visible
    hideError();
    
    // Filtrar cursos según categoría y búsqueda
    let filteredCourses = courses.filter(course => course.active === true);
    
    // Filtrar por categoría
    if (currentCategory !== 'todos') {
        filteredCourses = filteredCourses.filter(course => {
            const courseCategoryId = (course.category || 'general').toLowerCase().replace(/\s+/g, '-');
            return courseCategoryId === currentCategory;
        });
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
        filteredCourses = filteredCourses.filter(course => {
            const searchableText = [
                course.title || '',
                course.description || '',
                course.platform || '',
                course.category || ''
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchQuery.toLowerCase());
        });
    }
    
    // Limpiar el grid
    coursesGrid.innerHTML = '';
    
    // Si no hay cursos después de filtrar
    if (filteredCourses.length === 0) {
        coursesGrid.innerHTML = `
            <div class="no-courses" style="grid-column: 1/-1; text-align: center; padding: 50px 20px;">
                <i class="fas fa-search" style="font-size: 3.5rem; color: var(--primary-gold); margin-bottom: 20px; opacity: 0.6;"></i>
                <h3 style="color: var(--text-color); margin-bottom: 15px; font-size: 1.5rem;">
                    ${searchQuery ? 'No se encontraron cursos' : 'No hay cursos disponibles'}
                </h3>
                <p style="color: var(--text-secondary); margin-bottom: 25px; max-width: 400px; margin-left: auto; margin-right: auto;">
                    ${searchQuery ? 
                        'Prueba con otros términos de búsqueda o elimina los filtros.' : 
                        'Configura tu Google Sheets o agrega más cursos.'
                    }
                </p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    ${searchQuery ? 
                        `<button onclick="clearSearch()" class="btn btn-primary">
                            <i class="fas fa-times"></i> Limpiar búsqueda
                        </button>` : ''
                    }
                    <button onclick="loadCourses()" class="btn btn-secondary">
                        <i class="fas fa-sync-alt"></i> Recargar cursos
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // Renderizar cada curso
    filteredCourses.forEach(course => {
        const categoryName = course.category || 'General';
        const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
        
        // Buscar la categoría o crear una temporal
        let category = categories.find(cat => cat.id === categoryId);
        if (!category) {
            category = {
                id: categoryId,
                name: categoryName,
                displayName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
            };
        }
        
        const courseCard = createCourseCard(course, category);
        coursesGrid.appendChild(courseCard);
    });
}

function createCourseCard(course, category) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    
    // Determinar ícono según categoría
    let iconClass = 'fas fa-laptop-code';
    const categoryLower = (category.name || '').toLowerCase();
    
    if (categoryLower.includes('diseño') || categoryLower.includes('design')) {
        iconClass = 'fas fa-palette';
    } else if (categoryLower.includes('marketing')) {
        iconClass = 'fas fa-bullhorn';
    } else if (categoryLower.includes('finanza') || categoryLower.includes('business')) {
        iconClass = 'fas fa-chart-line';
    } else if (categoryLower.includes('data') || categoryLower.includes('ciencia')) {
        iconClass = 'fas fa-chart-bar';
    } else if (categoryLower.includes('video') || categoryLower.includes('media')) {
        iconClass = 'fas fa-video';
    }
    
    // Construir HTML del curso
    courseCard.innerHTML = `
        <div class="course-image">
            <i class="${iconClass}"></i>
        </div>
        <div class="course-content">
            <div class="course-header">
                <h3 class="course-title">${course.title || 'Curso sin título'}</h3>
                ${course.certificate ? 
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
                <button class="btn btn-small btn-primary view-course-btn">
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
    
    // Agregar evento para abrir el modal
    const viewBtn = courseCard.querySelector('.view-course-btn');
    viewBtn.addEventListener('click', () => {
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
// MANEJO DE ESTADOS DE UI
// ============================================
function showLoading(show) {
    const loadingElement = document.getElementById('loading-courses');
    const coursesGrid = document.getElementById('courses-grid');
    
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
    
    if (coursesGrid) {
        coursesGrid.style.display = show ? 'none' : 'grid';
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-courses');
    const coursesGrid = document.getElementById('courses-grid');
    
    if (errorElement) {
        errorElement.innerHTML = `
            <div style="text-align: center; padding: 30px; background-color: rgba(255, 107, 107, 0.1); border-radius: 8px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #ff6b6b; margin-bottom: 15px;"></i>
                <h4 style="color: var(--text-color); margin-bottom: 10px;">Error al cargar cursos</h4>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
                <button onclick="loadCourses()" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
        errorElement.style.display = 'block';
    }
    
    if (coursesGrid) {
        coursesGrid.style.display = 'none';
    }
}

function hideError() {
    const errorElement = document.getElementById('error-courses');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function clearSearch() {
    searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    renderCourses();
}

function showConfigInstructions() {
    // Solo mostrar instrucciones si estamos usando datos de ejemplo
    if (courses.length > 0 && courses[0].title.includes("React JS")) {
        const instructionHTML = `
            <div style="grid-column: 1/-1; margin: 20px 0; padding: 20px; background: rgba(212, 175, 55, 0.1); border-radius: 8px; border-left: 4px solid var(--primary-gold);">
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                    <div style="font-size: 1.5rem; color: var(--primary-gold);">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="color: var(--text-color); margin-bottom: 10px; font-size: 1.1rem;">
                            ¡Configura tu Google Sheets!
                        </h4>
                        <p style="color: var(--text-secondary); margin-bottom: 15px; font-size: 0.95rem;">
                            Estás viendo datos de ejemplo. Para conectar tu Google Sheets:
                        </p>
                        <ol style="color: var(--text-secondary); padding-left: 20px; margin: 0; font-size: 0.9rem;">
                            <li>Abre tu Google Sheet con los cursos</li>
                            <li>Ve a <strong>Archivo → Compartir → Publicar en web</strong></li>
                            <li>Selecciona <strong>CSV</strong> y haz clic en "Publicar"</li>
                            <li>Copia la URL generada</li>
                            <li>Pégala en la línea 7 del archivo script.js</li>
                        </ol>
                        <button onclick="showDetailedGuide()" class="btn btn-small" style="margin-top: 15px; background-color: var(--primary-gold); color: var(--primary-black);">
                            <i class="fas fa-book"></i> Ver guía completa
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const coursesGrid = document.getElementById('courses-grid');
        if (coursesGrid) {
            const instructionDiv = document.createElement('div');
            instructionDiv.innerHTML = instructionHTML;
            coursesGrid.prepend(instructionDiv);
        }
    }
}

function showDetailedGuide() {
    const guideHTML = `
        <div class="modal-overlay" id="guide-modal" style="display: flex; z-index: 4000;">
            <div class="modal-container" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-cogs"></i> Configurar Google Sheets</h3>
                    <button class="modal-close" onclick="document.getElementById('guide-modal').style.display='none'">&times;</button>
                </div>
                <div class="modal-content">
                    <div style="line-height: 1.6;">
                        <h4 style="color: var(--text-color); margin-bottom: 15px;">Pasos detallados:</h4>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <div style="background-color: var(--primary-gold); color: var(--primary-black); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">1</div>
                                <strong style="color: var(--text-color);">Prepara tu Google Sheet</strong>
                            </div>
                            <p style="color: var(--text-secondary); margin-left: 34px; margin-bottom: 15px;">
                                Crea una hoja con estas columnas:<br>
                                <code style="background-color: var(--dark-gray); padding: 2px 6px; border-radius: 3px; font-size: 0.9rem;">Título, Descripción, Categoría, Plataforma, Enlace, Certificado, Activo</code>
                            </p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <div style="background-color: var(--primary-gold); color: var(--primary-black); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">2</div>
                                <strong style="color: var(--text-color);">Hazlo público</strong>
                            </div>
                            <p style="color: var(--text-secondary); margin-left: 34px; margin-bottom: 15px;">
                                Ve a <strong>Archivo → Compartir → Publicar en web</strong><br>
                                Selecciona: <strong>Valores separados por comas (.csv)</strong><br>
                                Haz clic en <strong>"Publicar"</strong>
                            </p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <div style="background-color: var(--primary-gold); color: var(--primary-black); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">3</div>
                                <strong style="color: var(--text-color);">Copia la URL</strong>
                            </div>
                            <p style="color: var(--text-secondary); margin-left: 34px; margin-bottom: 15px;">
                                Copia la URL que aparece. Debe terminar en <code>pub?output=csv</code>
                            </p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <div style="background-color: var(--primary-gold); color: var(--primary-black); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">4</div>
                                <strong style="color: var(--text-color);">Configura el código</strong>
                            </div>
                            <p style="color: var(--text-secondary); margin-left: 34px;">
                                Abre el archivo <code>script.js</code><br>
                                En la línea 7, reemplaza:<br>
                                <code style="background-color: var(--dark-gray); padding: 2px 6px; border-radius: 3px; font-size: 0.9rem; display: inline-block; margin-top: 5px;">
                                    const GOOGLE_SHEETS_CSV_URL = 'https://...TU_URL_AQUI...';
                                </code><br>
                                con tu URL real.
                            </p>
                        </div>
                        
                        <div style="background-color: rgba(212, 175, 55, 0.1); padding: 15px; border-radius: 4px; margin-top: 20px;">
                            <p style="color: var(--text-color); margin-bottom: 10px; font-size: 0.9rem;">
                                <i class="fas fa-lightbulb" style="color: var(--primary-gold);"></i>
                                <strong>Consejo:</strong> Los cambios en Google Sheets se reflejarán automáticamente al recargar la página.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="document.getElementById('guide-modal').style.display='none'">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar el modal al body si no existe
    if (!document.getElementById('guide-modal')) {
        const guideModal = document.createElement('div');
        guideModal.id = 'guide-modal';
        guideModal.innerHTML = guideHTML;
        document.body.appendChild(guideModal);
    } else {
        document.getElementById('guide-modal').style.display = 'flex';
    }
}

// ============================================
// CONFIGURACIÓN DE EVENTOS
// ============================================
function setupEventListeners() {
    // Configurar búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderCourses();
        });
        
        // Limpiar búsqueda con botón
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            const clearBtn = document.createElement('button');
            clearBtn.innerHTML = '<i class="fas fa-times"></i>';
            clearBtn.style.cssText = `
                position: absolute;
                right: 40px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                display: none;
            `;
            clearBtn.onclick = clearSearch;
            
            searchBox.appendChild(clearBtn);
            
            // Mostrar/ocultar botón de limpiar
            searchInput.addEventListener('input', function() {
                clearBtn.style.display = this.value ? 'block' : 'none';
            });
        }
    }
    
    // Agregar botón de actualización
    addRefreshButton();
}

function addRefreshButton() {
    // Botón en la sección de cursos
    const sectionHeader = document.querySelector('.section-header');
    if (sectionHeader) {
        // Remover botón existente
        const existingBtn = sectionHeader.querySelector('.refresh-courses-btn');
        if (existingBtn) existingBtn.remove();
        
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-small btn-primary refresh-courses-btn';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
        refreshBtn.style.marginLeft = '15px';
        refreshBtn.onclick = loadCourses;
        
        sectionHeader.appendChild(refreshBtn);
    }
    
    // Botón en los filtros
    const filters = document.querySelector('.filters');
    if (filters) {
        const existingFilterBtn = filters.querySelector('.refresh-filter-btn');
        if (existingFilterBtn) existingFilterBtn.remove();
        
        const filterRefreshBtn = document.createElement('button');
        filterRefreshBtn.className = 'btn btn-small refresh-filter-btn';
        filterRefreshBtn.innerHTML = '<i class="fas fa-redo"></i>';
        filterRefreshBtn.title = 'Actualizar cursos';
        filterRefreshBtn.style.marginLeft = '10px';
        filterRefreshBtn.onclick = loadCourses;
        
        const searchBox = filters.querySelector('.search-box');
        if (searchBox) {
            searchBox.parentNode.insertBefore(filterRefreshBtn, searchBox.nextSibling);
        } else {
            filters.appendChild(filterRefreshBtn);
        }
    }
}

// ============================================
// NAVEGACIÓN Y MODAL
// ============================================
function initNavigation() {
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

function initModal() {
    const modalClose = document.getElementById('modal-close');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const courseModal = document.getElementById('course-modal');
    
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    if (courseModal) {
        courseModal.addEventListener('click', (e) => {
            if (e.target === courseModal) {
                closeModal();
            }
        });
    }
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            const guideModal = document.getElementById('guide-modal');
            if (guideModal) guideModal.style.display = 'none';
        }
    });
}

function openCourseModal(course) {
    const courseModal = document.getElementById('course-modal');
    const modalCourseTitle = document.getElementById('modal-course-title');
    const modalCourseContent = document.getElementById('modal-course-content');
    
    if (!courseModal || !modalCourseTitle || !modalCourseContent) return;
    
    const categoryName = course.category || 'General';
    
    modalCourseTitle.textContent = course.title || 'Curso sin título';
    modalCourseContent.innerHTML = `
        <div class="course-details">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px;">
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Plataforma</div>
                    <div style="font-weight: 500; color: var(--text-color);">${course.platform || 'No especificada'}</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Categoría</div>
                    <div style="font-weight: 500; color: var(--text-color);">${categoryName}</div>
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
                    <p style="color: var(--text-color); line-height: 1.7; white-space: pre-line;">${course.description || 'Descripción no disponible'}</p>
                    
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
// ADMIN (versión simplificada)
// ============================================
function initAdmin() {
    const adminAccessBtn = document.getElementById('admin-access-btn');
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Mostrar modal simple de admin
            const adminHTML = `
                <div class="modal-overlay" id="simple-admin-modal" style="display: flex; z-index: 4000;">
                    <div class="modal-container" style="max-width: 500px;">
                        <div class="modal-header">
                            <h3><i class="fas fa-cogs"></i> Panel de Administración</h3>
                            <button class="modal-close" onclick="document.getElementById('simple-admin-modal').style.display='none'">&times;</button>
                        </div>
                        <div class="modal-content">
                            <div style="text-align: center; padding: 20px 0;">
                                <i class="fas fa-table" style="font-size: 3rem; color: var(--primary-gold); margin-bottom: 20px;"></i>
                                <h4 style="color: var(--text-color); margin-bottom: 15px;">Gestión de Cursos</h4>
                                <p style="color: var(--text-secondary); margin-bottom: 25px;">
                                    Para administrar los cursos, edita directamente tu Google Sheet.
                                    Los cambios se reflejarán automáticamente al recargar la página.
                                </p>
                                
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    <a href="${GOOGLE_SHEETS_CSV_URL.replace('/pub?', '/edit?')}" 
                                       target="_blank" 
                                       class="btn btn-primary"
                                       style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                        <i class="fas fa-edit"></i>
                                        Editar en Google Sheets
                                    </a>
                                    
                                    <button onclick="loadCourses()" class="btn btn-secondary">
                                        <i class="fas fa-sync-alt"></i> Actualizar cursos
                                    </button>
                                    
                                    <button onclick="showDetailedGuide()" class="btn" style="background-color: transparent; border: 1px solid var(--medium-gray);">
                                        <i class="fas fa-question-circle"></i> Ver guía de configuración
                                    </button>
                                </div>
                                
                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--medium-gray);">
                                    <p style="color: var(--text-secondary); font-size: 0.9rem;">
                                        <strong>Estadísticas:</strong><br>
                                        Cursos totales: ${courses.length}<br>
                                        Cursos activos: ${courses.filter(c => c.active).length}<br>
                                        Con certificado: ${courses.filter(c => c.certificate).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Agregar o actualizar el modal
            let adminModal = document.getElementById('simple-admin-modal');
            if (adminModal) {
                adminModal.innerHTML = adminHTML;
                adminModal.style.display = 'flex';
            } else {
                adminModal = document.createElement('div');
                adminModal.id = 'simple-admin-modal';
                adminModal.innerHTML = adminHTML;
                document.body.appendChild(adminModal);
            }
        });
    }
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.loadCourses = loadCourses;
window.clearSearch = clearSearch;
window.openCourseModal = openCourseModal;
window.closeModal = closeModal;
window.showDetailedGuide = showDetailedGuide;
