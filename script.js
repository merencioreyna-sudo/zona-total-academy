// CONFIGURACIÓN
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJyqaN42-hjK2Wtkk1nXdlsEZlZEEtcH3FQvGDJZlB4QVK-rBwnOSpW8dJkAXnzvkLLHfDyYIJe_9v/pub?gid=0&single=true&output=csv';

// CURSOS CON VIDEO REAL DENTRO DE LA WEB Y PORTADAS
let courses = [];

async function cargarCursosDesdeSheets() {
    try {
        const res = await fetch(GOOGLE_SHEETS_CSV_URL);
        const text = await res.text();

function parseCSV(text) {
    const lines = text.split("\n");
    return lines.map(line => {
        const result = [];
        let current = '';
        let insideQuotes = false;

        for (let char of line) {
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    });
}

// 👇 ESTA LÍNEA ES LA CLAVE Y VA AQUÍ
const rows = parseCSV(text);

const headers = rows[0];
const data = rows.slice(1);

        courses = data.map(row => {
    return {
        id: row[0],
        title: row[1],
        description: row[2],
        category: row[3],
        platform: row[4],
        link: row[5],
        embed: row[6]
    };
});

    } catch (error) {
        console.error("Error cargando cursos:", error);
    }
}

let categories = [{ id: "todos", name: "Todos", displayName: "Todos" }];
let currentCategory = "todos";
let searchQuery = "";
let customLogoUrl = localStorage.getItem('customLogoUrl') || "";

// =============== INICIALIZACIÓN ===============
document.addEventListener('DOMContentLoaded', async function() {
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
        const suggestionsBox = document.getElementById("search-suggestions");

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderCourses();

    const value = e.target.value.trim().toLowerCase();

    if (!value) {
        suggestionsBox.style.display = "none";
        return;
    }

    const suggestions = courses
        .map(c => c.title)
        .filter(title => title.toLowerCase().includes(value))
        .slice(0, 5);

    if (suggestions.length === 0) {
        suggestionsBox.style.display = "none";
        return;
    }

    suggestionsBox.innerHTML = suggestions
        .map(title => `<div>${title}</div>`)
        .join("");

    suggestionsBox.style.display = "block";

    suggestionsBox.querySelectorAll("div").forEach(item => {
        item.addEventListener("click", () => {
            searchInput.value = item.textContent;
            searchQuery = item.textContent.toLowerCase();
            suggestionsBox.style.display = "none";
            renderCourses();
        });
    });
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
    
    // Mostrar cursos INMEDIATAMENTE
    await cargarCursosDesdeSheets();

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
    const query = searchQuery.trim().toLowerCase();

    filteredCourses = filteredCourses.filter(course => {
        const searchText = [
            course.title || '',
            course.description || '',
            course.category || '',
            course.platform || ''
        ].join(' ')
         .toLowerCase()
         .normalize("NFD")
         .replace(/[\u0300-\u036f]/g, ""); // quitar acentos

        const cleanQuery = query
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        return searchText.includes(cleanQuery);
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
    
    // Determinar ícono según categoría (solo si no hay thumbnail)
    let iconClass = 'fas fa-laptop-code';
    if (course.category.includes('Programación')) iconClass = 'fas fa-code';
    if (course.category.includes('Diseño')) iconClass = 'fas fa-palette';
    if (course.category.includes('Marketing')) iconClass = 'fas fa-bullhorn';
    
    // HTML con PORTADA/THUMBNAIL
    courseCard.innerHTML = `
        <div class="course-image">
            ${getThumbnail(course) ? 
    `<img src="${getThumbnail(course)}" alt="${course.title}" 
         style="width:100%;height:100%;object-fit:cover;border-radius:8px 8px 0 0;">`
    : 
    `<i class="${iconClass}"></i>`
}
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
        const activeCourses = courses.length;
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
    if (course.embed || course.link) {
        let videoSrc = "";

if (course.embed) {
    videoSrc = course.embed;
} else if (course.link && course.link.includes("youtube")) {
    const id = course.link.split("v=")[1]?.split("&")[0];
    videoSrc = `https://www.youtube.com/embed/${id}`;
}

if (videoSrc) {
    modalHTML += `
        <div class="course-embed">
            <h4 style="color: var(--text-color); margin-bottom: 15px;">Video del Curso</h4>
            <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; background: #000; margin-bottom: 20px;">
                <iframe 
                    src="${videoSrc}" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                    allowfullscreen>
                </iframe>
            </div>
        </div>
    `;
}
    }
    
    modalHTML += `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--medium-gray);">
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    
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

function getThumbnail(course) {
    if (course.link && course.link.includes("youtube")) {
        const id = course.link.split("v=")[1]?.split("&")[0];
        if (id) {
            return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
        }
    }
    return null;
}

window.addEventListener("scroll", () => {
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-link");

    let current = "";

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute("id");
        }
    });

    navLinks.forEach(link => {
        link.classList.remove("active");

        if (link.getAttribute("href") === "#" + current) {
            link.classList.add("active");
        }
    });
});
