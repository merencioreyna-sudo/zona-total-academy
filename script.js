// ============================================
// CONFIGURACIÓN SIMPLIFICADA
// ============================================

// FORMA 1: Usar CSV público (la más fácil)
const USE_CSV_METHOD = true; // Cambia a false si quieres usar la otra forma
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJpv1h9XBYo7gJPLBx4U_1IiRkf0v-y2W2Z_o-O3V67aPSqAzvBdAomO7SPy-dVSYw3cyUwD3C0oVJ/pub?output=csv';

// FORMA 2: Usar JSON (necesita configuración adicional)
const GOOGLE_SHEET_ID = 'TU_ID_DE_GOOGLE_SHEETS'; // Solo si usas JSON

// Variables globales
let courses = [];
let categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
let currentCategory = "todos";
let searchQuery = "";

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Academia Élite - Iniciando...');
    
    initNavigation();
    initFilters();
    initModal();
    setupEventListeners();
    
    // Cargar cursos
    loadCourses();
});

// ============================================
// CARGAR CURSOS (FUNCIONAL)
// ============================================
async function loadCourses() {
    console.log('Cargando cursos...');
    
    // Mostrar estado de carga
    showLoading(true);
    hideError();
    
    try {
        if (USE_CSV_METHOD) {
            await loadFromCSV();
        } else {
            await loadFromGoogleSheetsAPI();
        }
    } catch (error) {
        console.error('Error cargando cursos:', error);
        showError('No se pudieron cargar los cursos. Usando datos de ejemplo.');
        loadSampleData();
    } finally {
        showLoading(false);
    }
}

// ============================================
// MÉTODO 1: CSV PÚBLICO (RECOMENDADO)
// ============================================
async function loadFromCSV() {
    console.log('Usando método CSV...');
    
    // URL de ejemplo - REEMPLAZA ESTA CON TU URL REAL
    // Para obtenerla: Ve a Archivo → Compartir → Publicar en web → Selecciona CSV
    const csvUrl = GOOGLE_SHEETS_CSV_URL;
    
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('CSV recibido:', csvText.substring(0, 200) + '...');
    
    // Parsear CSV
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        throw new Error('CSV vacío');
    }
    
    // Parsear encabezados
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    console.log('Encabezados:', headers);
    
    // Parsear datos
    courses = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = parseCSVLine(line);
        
        if (values.length === 0) continue;
        
        const course = { id: i };
        
        // Mapear valores a propiedades
        headers.forEach((header, index) => {
            if (index < values.length) {
                course[header] = values[index].trim();
            }
        });
        
        // Asegurar campos mínimos
        if (!course.title && course.titulo) {
            course.title = course.titulo;
        }
        if (!course.description && course.descripcion) {
            course.description = course.descripcion;
        }
        if (!course.category && course.categoria) {
            course.category = course.categoria;
        }
        if (!course.platform && course.plataforma) {
            course.platform = course.plataforma;
        }
        if (!course.link && course.enlace) {
            course.link = course.enlace;
        }
        
        // Convertir booleanos
        if (course.certificado || course.certificate) {
            const certValue = course.certificado || course.certificate;
            course.certificate = certValue === 'TRUE' || certValue === 'true' || certValue === 'Sí' || certValue === 'sí';
        }
        
        if (course.activo || course.active) {
            const activeValue = course.activo || course.active;
            course.active = activeValue !== 'FALSE' && activeValue !== 'false' && activeValue !== 'No';
        } else {
            course.active = true; // Por defecto activo
        }
        
        // Solo agregar si tiene título
        if (course.title && course.title.trim() !== '') {
            courses.push(course);
        }
    }
    
    console.log(`${courses.length} cursos cargados desde CSV`);
    updateUI();
}

// Función para parsear líneas CSV (maneja comas dentro de comillas)
function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Comilla doble dentro de comillas
                currentValue += '"';
                i++; // Saltar la siguiente comilla
            } else {
                // Comilla simple - alternar estado
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Fin del valor
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    
    // Agregar el último valor
    values.push(currentValue);
    return values;
}

// ============================================
// MÉTODO 2: API de Google Sheets (alternativa)
// ============================================
async function loadFromGoogleSheetsAPI() {
    console.log('Usando método API...');
    
    // Esta URL SÍ funciona para hojas públicas
    const url = `https://opensheet.elk.sh/${GOOGLE_SHEET_ID}/Cursos`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }
    
    courses = await response.json();
    console.log(`${courses.length} cursos cargados desde API`);
    updateUI();
}

// ============================================
// DATOS DE EJEMPLO (si todo falla)
// ============================================
function loadSampleData() {
    console.log('Cargando datos de ejemplo...');
    
    courses = [
        {
            id: 1,
            title: "React Avanzado - Ejemplo",
            description: "Curso de desarrollo con React. Configura tu Google Sheets para ver tus cursos reales.",
            category: "Programación",
            platform: "Udemy",
            link: "#",
            certificate: true,
            active: true
        },
        {
            id: 2,
            title: "Marketing Digital",
            description: "Estrategias de marketing moderno. Añade tus cursos en Google Sheets.",
            category: "Marketing",
            platform: "Coursera",
            link: "#",
            certificate: true,
            active: true
        },
        {
            id: 3,
            title: "Diseño UX/UI Profesional",
            description: "Aprende diseño de interfaces. Configura tu Google Sheets.",
            category: "Diseño",
            platform: "Platzi",
            link: "#",
            certificate: true,
            active: true
        }
    ];
    
    updateUI();
    
    // Mostrar mensaje de ayuda
    showHelpMessage();
}

function showHelpMessage() {
    const message = `
        <div style="text-align: center; padding: 20px; margin-top: 20px; background: rgba(212, 175, 55, 0.1); border-radius: 8px;">
            <h4 style="color: var(--primary-gold); margin-bottom: 10px;">
                <i class="fas fa-info-circle"></i> Cómo configurar Google Sheets
            </h4>
            <ol style="text-align: left; display: inline-block; margin: 0 auto; color: var(--text-secondary);">
                <li>Abre tu Google Sheet con los cursos</li>
                <li>Ve a <strong>Archivo → Compartir → Publicar en web</strong></li>
                <li>Selecciona formato <strong>CSV</strong></li>
                <li>Copia la URL generada</li>
                <li>Pégala en el código (línea 7)</li>
            </ol>
            <button onclick="showConfigGuide()" class="btn btn-small" style="margin-top: 15px;">
                <i class="fas fa-cogs"></i> Ver guía completa
            </button>
        </div>
    `;
    
    const coursesGrid = document.getElementById('courses-grid');
    if (coursesGrid) {
        const helpDiv = document.createElement('div');
        helpDiv.style.gridColumn = '1/-1';
        helpDiv.innerHTML = message;
        coursesGrid.appendChild(helpDiv);
    }
}

// ============================================
// ACTUALIZAR INTERFAZ
// ============================================
function updateUI() {
    updateCategoriesFromCourses();
    updateFilterButtons();
    renderCourses();
    updateCourseCount();
}

function updateCategoriesFromCourses() {
    categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
    
    const uniqueCategories = new Set();
    courses.forEach(course => {
        if (course.category && course.category.trim()) {
            uniqueCategories.add(course.category.trim());
        }
    });
    
    uniqueCategories.forEach(catName => {
        const id = catName.toLowerCase().replace(/\s+/g, '-');
        const displayName = catName.charAt(0).toUpperCase() + catName.slice(1);
        
        categories.push({
            id: id,
            name: catName,
            displayName: displayName
        });
    });
    
    console.log('Categorías:', categories);
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
    let filteredCourses = courses.filter(course => 
        course.active !== false && course.active !== 'false' && course.active !== 'FALSE'
    );
    
    if (currentCategory !== 'todos') {
        filteredCourses = filteredCourses.filter(course => {
            const catId = (course.category || '').toLowerCase().replace(/\s+/g, '-');
            return catId === currentCategory;
        });
    }
    
    if (searchQuery) {
        filteredCourses = filteredCourses.filter(course => {
            const searchIn = [
                course.title || '',
                course.description || '',
                course.platform || '',
                course.category || ''
            ].join(' ').toLowerCase();
            
            return searchIn.includes(searchQuery);
        });
    }
    
    // Limpiar grid
    coursesGrid.innerHTML = '';
    
    // Si no hay cursos
    if (filteredCourses.length === 0) {
        coursesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--primary-gold); margin-bottom: 20px; opacity: 0.5;"></i>
                <h3 style="margin-bottom: 10px; color: var(--text-color);">No se encontraron cursos</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                    ${searchQuery ? 'No hay cursos que coincidan con tu búsqueda.' : 'No hay cursos disponibles.'}
                </p>
                ${searchQuery ? 
                    '<button onclick="searchQuery=\'\'; renderCourses();" class="btn btn-primary">Limpiar búsqueda</button>' : 
                    '<button onclick="loadCourses();" class="btn btn-primary"><i class="fas fa-sync-alt"></i> Recargar cursos</button>'
                }
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
    
    // Determinar ícono
    let iconClass = 'fas fa-laptop-code';
    const catLower = (course.category || '').toLowerCase();
    
    if (catLower.includes('diseño') || catLower.includes('design')) {
        iconClass = 'fas fa-palette';
    } else if (catLower.includes('marketing')) {
        iconClass = 'fas fa-bullhorn';
    } else if (catLower.includes('finanza') || catLower.includes('negocio')) {
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
    
    // Event listener
    courseCard.querySelector('.view-course-btn').addEventListener('click', () => {
        openCourseModal(course);
    });
    
    return courseCard;
}

function updateCourseCount() {
    const totalCoursesElement = document.getElementById('total-courses');
    if (totalCoursesElement) {
        const activeCourses = courses.filter(course => 
            course.active !== false && course.active !== 'false' && course.active !== 'FALSE'
        ).length;
        totalCoursesElement.textContent = activeCourses;
    }
}

// ============================================
// ESTADOS DE UI
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
            <div style="text-align: center; padding: 30px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: var(--primary-gold); margin-bottom: 15px;"></i>
                <h4 style="color: var(--text-color); margin-bottom: 10px;">Atención</h4>
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
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderCourses();
        });
    }
    
    // Botón de actualización
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-small btn-primary';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
    refreshBtn.style.marginLeft = '15px';
    refreshBtn.onclick = loadCourses;
    
    const filters = document.querySelector('.filters');
    if (filters) {
        filters.appendChild(refreshBtn);
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
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// ============================================
// MODAL
// ============================================
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
            </div>
            
            <div class="course-embed">
                <div class="text-content">
                    <h4 style="color: var(--text-color); margin-bottom: 15px;">Descripción Completa</h4>
                    <p style="color: var(--text-color); line-height: 1.7;">${course.description || 'Descripción no disponible'}</p>
                    
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
// GUÍA DE CONFIGURACIÓN
// ============================================
function showConfigGuide() {
    alert(`GUÍA DE CONFIGURACIÓN:

1. Abre tu Google Sheet con los cursos
2. Haz clic en "Archivo" → "Compartir" → "Publicar en web"
3. En la ventana que aparece:
   - Selecciona la pestaña "Publicar"
   - Elige "Valores separados por comas (.csv)"
   - Haz clic en "Publicar"
4. Copia la URL que aparece
5. En el archivo script.js, línea 7, reemplaza:
   const GOOGLE_SHEETS_CSV_URL = 'TU_URL_AQUI';
   con tu URL real

Estructura recomendada de columnas:
Título, Descripción, Categoría, Plataforma, Enlace, Certificado, Activo

Ejemplo:
React Avanzado,Aprende React desde cero,Programación,Udemy,https://...,TRUE,TRUE`);
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================
window.loadCourses = loadCourses;
window.openCourseModal = openCourseModal;
window.closeModal = closeModal;
window.showConfigGuide = showConfigGuide;
