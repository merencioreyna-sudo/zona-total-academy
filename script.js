// CONFIGURACIÓN
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJyqaN42-hjK2Wtkk1nXdlsEZlZEEtcH3FQvGDJZlB4QVK-rBwnOSpW8dJkAXnzvkLLHfDyYIJe_9v/pub?gid=0&single=true&output=csv';

let courses = [];

// ✅ parseCSV FUERA de la función
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

async function cargarCursosDesdeSheets() {
    try {
        const res = await fetch(GOOGLE_SHEETS_CSV_URL);
        const text = await res.text();

        const rows = parseCSV(text);
        const data = rows.slice(1); // saltar cabecera

        // ✅ Mapeo EXACTO a tus 7 columnas:
        // 0: id | 1: Título | 2: Descripción | 3: Categoría | 4: Plataforma | 5: Enlace | 6: Embed
       courses = data
    .filter(row => row[0] && row[1])
    .map(row => {
        return {
            id: (row[0] || '').trim(),
            title: (row[1] || '').trim(),
            description: (row[2] || '').trim(),
            category: (row[3] || 'General').trim(),
            platform: (row[4] || '').trim(),
            link: (row[5] || '').trim(),
            embed: (row[6] || '').trim(),
            duration: '',
            level: '',
            certificate: false,
            active: true
        };
    })
    .sort((a, b) => Number(b.id) - Number(a.id));

        console.log('Cursos cargados:', courses); // debug

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
    const uniqueCats = [...new Set(courses.map(c => c.category).filter(Boolean))];

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
             .replace(/[\u0300-\u036f]/g, "");

            const cleanQuery = query
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            return searchText.includes(cleanQuery);
        });
    }

    coursesGrid.innerHTML = '';

    if (filteredCourses.length === 0) {
        coursesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px;">
                <i class="fas fa-book-open" style="font-size: 4rem; color: var(--primary-gold); margin-bottom: 20px; opacity: 0.7;"></i>
                <h3 style="color: var(--text-color); margin-bottom: 15px;">No se encontraron cursos</h3>
                <p style="color: var(--text-secondary); margin-bottom: 25px;">
                    ${searchQuery ? 'Prueba con otros términos de búsqueda.' : 'No hay cursos disponibles en esta categoría.'}
                </p>
                ${searchQuery ? '<button onclick="clearSearch()" class="btn btn-primary" style="margin: 10px;">Limpiar búsqueda</button>' : ''}
                <button onclick="location.reload()" class="btn btn-secondary" style="margin: 10px;">
                    <i class="fas fa-redo"></i> Recargar página
                </button>
            </div>
        `;
        return;
    }

    filteredCourses.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesGrid.appendChild(courseCard);
    });
}

// ✅ Devuelve el id más alto (el curso más reciente)
function getNewestCourseId() {
    if (courses.length === 0) return null;
    return courses.reduce((max, c) => {
        const n = Number(c.id) || 0;
        return n > max ? n : max;
    }, 0);
}

function createCourseCard(course) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';

    let iconClass = 'fas fa-laptop-code';
    if (course.category.includes('Programación')) iconClass = 'fas fa-code';
    if (course.category.includes('Diseño')) iconClass = 'fas fa-palette';
    if (course.category.includes('Marketing')) iconClass = 'fas fa-bullhorn';
    if (course.category.includes('Idiomas')) iconClass = 'fas fa-language';
    if (course.category.includes('Inteligencia')) iconClass = 'fas fa-robot';
    if (course.category.includes('Emprendimiento')) iconClass = 'fas fa-rocket';

       // ✅ ¿Es el curso más nuevo?
    const isNew = Number(course.id) === getNewestCourseId();

    courseCard.innerHTML = `
        <div class="course-image">
            ${getThumbnail(course) ?
                `<img src="${getThumbnail(course)}" alt="${course.title}"
                     style="width:100%;height:100%;object-fit:cover;border-radius:8px 8px 0 0;"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'${iconClass}\\'></i>';">`
                :
                `<i class="${iconClass}"></i>`
            }
            ${isNew ? '<span class="new-badge">🔥 NUEVO</span>' : ''}
        </div>
        <div class="course-content">
            <div class="course-header">
                <h3 class="course-title">${course.title}</h3>
            </div>
            <p class="course-description">${course.description}</p>
            <div class="course-meta">
                <span class="course-category">${course.category}</span>
                <span class="course-platform">${course.platform}</span>
            </div>
            <div class="course-actions">
                <button class="btn btn-small btn-primary view-course-btn" data-id="${course.id}">
                    <i class="fas fa-play-circle"></i> Ver Curso
                </button>
            </div>
        </div>
    `;

    // ✅ Abrir modal correctamente
    const btn = courseCard.querySelector('.view-course-btn');
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openCourseModal(course);
    });

    return courseCard;
}

function updateCourseCount() {
    const totalCoursesElement = document.getElementById('total-courses');
    if (totalCoursesElement) {
        totalCoursesElement.textContent = courses.length;
    }
}

// =============== MODAL ===============
function openCourseModal(course) {
    console.log("Abriendo modal para:", course);

    const courseModal = document.getElementById('course-modal');
    const modalCourseTitle = document.getElementById('modal-course-title');
    const modalCourseContent = document.getElementById('modal-course-content');

    if (!courseModal || !modalCourseTitle || !modalCourseContent) {
        console.error("No se encontraron elementos del modal");
        return;
    }

    modalCourseTitle.textContent = course.title;

    let modalHTML = `
        <div class="course-details">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px;">
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Plataforma</div>
                    <div style="font-weight: 500; color: var(--text-color);">${course.platform || 'No especificada'}</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Categoría</div>
                    <div style="font-weight: 500; color: var(--text-color);">${course.category || 'General'}</div>
                </div>
            </div>

            <div style="margin-bottom: 30px;">
                <h4 style="color: var(--text-color); margin-bottom: 15px;">Descripción</h4>
                <p style="color: var(--text-color); line-height: 1.6; white-space: pre-line;">${course.description || ''}</p>
            </div>
    `;

    // ✅ Detectar video: puede venir en embed O en link
    const videoSrc = getVideoEmbedUrl(course);

    if (videoSrc) {
        modalHTML += `
            <div class="course-embed">
                <h4 style="color: var(--text-color); margin-bottom: 15px;">Video del Curso</h4>
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; background: #000; margin-bottom: 20px;">
                    <iframe
                        src="${videoSrc}"
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                        allowfullscreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                    </iframe>
                </div>
            </div>
        `;
    } else {
        modalHTML += `
            <div style="padding: 20px; background: rgba(255,107,107,0.1); border-radius: 8px; text-align: center; color: var(--text-secondary);">
                <i class="fas fa-exclamation-triangle" style="color: #ff6b6b; font-size: 1.5rem; margin-bottom: 10px;"></i>
                <p>No hay video disponible para este curso.</p>
            </div>
        `;
    }

    modalHTML += `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--medium-gray);">
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;"></div>
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

// ✅ FUNCIÓN CLAVE: detecta si el enlace ya es embed o es watch
function getVideoEmbedUrl(course) {
    // 1. Si la columna "Embed" tiene contenido, usarla
    if (course.embed && course.embed.trim() !== '') {
        return course.embed.trim();
    }

    // 2. Si el link es un enlace embed de YouTube
    if (course.link && course.link.includes('/embed/')) {
        return course.link.trim();
    }

    // 3. Si el link es un watch?v= normal, convertirlo a embed
    if (course.link && course.link.includes('youtube.com/watch')) {
        const id = course.link.split('v=')[1]?.split('&')[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
    }

    // 4. Si es youtu.be corto
    if (course.link && course.link.includes('youtu.be/')) {
        const id = course.link.split('youtu.be/')[1]?.split('?')[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
    }

    return null;
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

updateHeroLogo();

function getThumbnail(course) {
    // Intentar obtener thumbnail de YouTube
    let videoUrl = course.embed || course.link;
    if (!videoUrl) return null;

    let id = null;
    if (videoUrl.includes('/embed/')) {
        id = videoUrl.split('/embed/')[1]?.split(/[?&]/)[0];
    } else if (videoUrl.includes('watch?v=')) {
        id = videoUrl.split('v=')[1]?.split('&')[0];
    } else if (videoUrl.includes('youtu.be/')) {
        id = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    }

    if (id) {
        return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
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
