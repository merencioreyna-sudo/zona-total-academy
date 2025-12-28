// CONFIGURACIÓN
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1YAqfZadMR5O6mABhl0QbhF8scbtIW9JJPfwdED4bzDQ/edit?gid=0#gid=0';

// Datos de ejemplo CON EMBED
let courses = [
    {
        id: 1,
        title: "React Avanzado - Curso Completo",
        description: "Aprende React con Hooks, Context API, Redux y despliegue. Incluye proyectos reales.",
        category: "Programación",
        platform: "YouTube",
        link: "https://www.youtube.com/embed/Ke90Tje7VS0",
        embed: '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;border-radius:8px;"><iframe src="https://www.youtube.com/embed/Ke90Tje7VS0" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Curso React Avanzado"></iframe></div>',
        certificate: true,
        active: true
    },
    {
        id: 2,
        title: "JavaScript Moderno ES6+",
        description: "Domina JavaScript moderno con todas las nuevas características.",
        category: "Programación", 
        platform: "YouTube",
        link: "https://www.youtube.com/embed/f4fB9Xg2JEY",
        embed: '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;border-radius:8px;"><iframe src="https://www.youtube.com/embed/f4fB9Xg2JEY" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen title="Curso JavaScript"></iframe></div>',
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

    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderCourses();
        });
    }

    // Modal
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

    // Admin
    setupAdmin();
    
    // Cursos
    updateCategories();
    renderFilters();
    renderCourses();
    updateCourseCount();
    
    // Google Sheets
    if (GOOGLE_SHEETS_CSV_URL && !GOOGLE_SHEETS_CSV_URL.includes('TU_URL')) {
        loadFromGoogleSheets();
    }
});

// ==================== GOOGLE SHEETS ====================
async function loadFromGoogleSheets() {
    try {
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const newCourses = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const course = { id: i };
                
                // Mapear todas las columnas
                headers.forEach((header, index) => {
                    if (values[index]) {
                        course[header] = values[index].trim();
                    }
                });
                
                // Asegurar campos
                if (!course.title && course.titulo) course.title = course.titulo;
                if (!course.embed && course.enlace) {
                    // Si es enlace de YouTube, crear embed automáticamente
                    if (course.enlace.includes('youtube.com') || course.enlace.includes('youtu.be')) {
                        const videoId = extractYouTubeId(course.enlace);
                        if (videoId) {
                            course.embed = createYouTubeEmbed(videoId);
                        }
                    }
                }
                
                if (course.title) newCourses.push(course);
            }
            
            if (newCourses.length > 0) {
                courses = newCourses;
                updateCategories();
                renderFilters();
                renderCourses();
                updateCourseCount();
            }
        }
    } catch (error) {
        console.log('Usando datos locales');
    }
}

function extractYouTubeId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
}

function createYouTubeEmbed(videoId) {
    return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;border-radius:8px;background:#000;">
        <iframe src="https://www.youtube.com/embed/${videoId}" 
                style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen 
                title="Video del curso">
        </iframe>
    </div>`;
}

// ==================== RENDER CURSOS ====================
function updateCategories() {
    const uniqueCats = new Set(courses.map(c => c.category || c.categoria || 'General'));
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
    
    let filtered = courses.filter(c => c.active !== false && c.active !== 'false');
    
    if (currentCategory !== 'todos') {
        filtered = filtered.filter(c => {
            const cat = (c.category || c.categoria || 'General').toLowerCase().replace(/ /g, '-');
            return cat === currentCategory;
        });
    }
    
    if (searchQuery) {
        filtered = filtered.filter(c => {
            const searchText = [
                c.title || '',
                c.description || c.descripcion || '',
                c.category || c.categoria || '',
                c.platform || c.plataforma || ''
            ].join(' ').toLowerCase();
            
            return searchText.includes(searchQuery);
        });
    }
    
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px">
                <i class="fas fa-search" style="font-size:3rem;color:var(--primary-gold);margin-bottom:20px"></i>
                <h3>No hay cursos</h3>
                <button onclick="loadFromGoogleSheets()" class="btn btn-primary">Recargar</button>
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
                    <h3 class="course-title">${course.title || 'Curso'}</h3>
                    ${(course.certificate === true || course.certificate === 'true' || course.certificate === 'TRUE') ? 
                        '<div class="certificate-badge"><i class="fas fa-certificate"></i> Certificado</div>' : 
                        ''
                    }
                </div>
                <p class="course-description">${course.description || course.descripcion || 'Descripción'}</p>
                <div class="course-meta">
                    <span class="course-category">${course.category || course.categoria || 'General'}</span>
                    <span class="course-platform">${course.platform || course.plataforma || 'Plataforma'}</span>
                </div>
                <div class="course-actions">
                    <button class="btn btn-small btn-primary view-btn">Ver Curso</button>
                    ${(course.link || course.enlace) && (course.link !== '#' || course.enlace !== '#') ? 
                        `<a href="${course.link || course.enlace}" target="_blank" class="btn btn-small btn-secondary">Enlace Externo</a>` : 
                        ''
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
        const active = courses.filter(c => 
            c.active !== false && 
            c.active !== 'false' && 
            c.active !== 'FALSE'
        ).length;
        counter.textContent = active;
    }
}

// ==================== MODAL CON EMBED ====================
function openModal(course) {
    const modal = document.getElementById('course-modal');
    const title = document.getElementById('modal-course-title');
    const content = document.getElementById('modal-course-content');
    
    if (!modal || !title || !content) return;
    
    const courseTitle = course.title || 'Curso';
    const courseDesc = course.description || course.descripcion || 'Descripción no disponible';
    const courseCategory = course.category || course.categoria || 'General';
    const coursePlatform = course.platform || course.plataforma || 'No especificada';
    const hasCert = course.certificate === true || course.certificate === 'true' || course.certificate === 'TRUE';
    const isActive = course.active !== false && course.active !== 'false' && course.active !== 'FALSE';
    
    title.textContent = courseTitle;
    
    // CONSTRUIR CONTENIDO DEL MODAL CON EMBED
    let modalHTML = `
        <div class="course-details">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:25px">
                <div>
                    <div style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:5px">Plataforma</div>
                    <div style="font-weight:500;color:var(--text-color)">${coursePlatform}</div>
                </div>
                <div>
                    <div style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:5px">Categoría</div>
                    <div style="font-weight:500;color:var(--text-color)">${courseCategory}</div>
                </div>
                <div>
                    <div style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:5px">Certificado</div>
                    <div style="font-weight:500;color:${hasCert ? 'var(--primary-gold)' : 'var(--text-secondary)'}">
                        ${hasCert ? '✅ Incluido' : '❌ No incluido'}
                    </div>
                </div>
                <div>
                    <div style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:5px">Estado</div>
                    <div style="font-weight:500;color:${isActive ? '#4CAF50' : '#f44336'}">
                        ${isActive ? '🟢 Activo' : '🔴 Inactivo'}
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom:30px">
                <h4 style="color:var(--text-color);margin-bottom:15px">Descripción</h4>
                <p style="color:var(--text-color);line-height:1.6">${courseDesc}</p>
            </div>
    `;
    
    // AGREGAR EL EMBED SI EXISTE
    if (course.embed) {
        modalHTML += `
            <div class="course-embed">
                <h4 style="color:var(--text-color);margin-bottom:15px">Contenido del Curso</h4>
                <div style="margin:20px 0">
                    ${course.embed}
                </div>
            </div>
        `;
    } else if (course.link || course.enlace) {
        const link = course.link || course.enlace;
        if (link.includes('youtube') || link.includes('youtu.be')) {
            const videoId = extractYouTubeId(link);
            if (videoId) {
                modalHTML += `
                    <div class="course-embed">
                        <h4 style="color:var(--text-color);margin-bottom:15px">Video del Curso</h4>
                        <div style="margin:20px 0">
                            ${createYouTubeEmbed(videoId)}
                        </div>
                    </div>
                `;
            }
        }
    }
    
    modalHTML += `</div>`;
    
    content.innerHTML = modalHTML;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
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
            document.getElementById('admin-overlay').style.display = 'flex';
            document.body.style.overflow = 'hidden';
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
            } else {
                alert('admin / admin123');
            }
        });
    }
    
    // Cancelar
    document.getElementById('cancel-login-btn').addEventListener('click', () => {
        document.getElementById('admin-overlay').style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });
    
    // Logo
    const saveLogoBtn = document.getElementById('save-logo-btn');
    const resetLogoBtn = document.getElementById('reset-logo-btn');
    const logoUrlInput = document.getElementById('logo-url');
    
    if (saveLogoBtn) saveLogoBtn.addEventListener('click', function() {
        const url = logoUrlInput.value;
        if (url) {
            customLogoUrl = url;
            localStorage.setItem('customLogoUrl', url);
            updateHeroLogo();
            alert('Logo guardado');
        }
    });
    
    if (resetLogoBtn) resetLogoBtn.addEventListener('click', function() {
        customLogoUrl = '';
        localStorage.removeItem('customLogoUrl');
        logoUrlInput.value = '';
        updateHeroLogo();
        alert('Logo reseteado');
    });
    
    if (logoUrlInput) {
        logoUrlInput.value = customLogoUrl;
        logoUrlInput.addEventListener('input', function() {
            document.getElementById('logo-preview-img').src = this.value;
        });
    }
}

function updateHeroLogo() {
    const heroImg = document.getElementById('hero-logo-img');
    const heroDefault = document.querySelector('.hero-logo-default');
    
    if (heroImg && heroDefault) {
        if (customLogoUrl) {
            heroImg.src = customLogoUrl;
            heroImg.style.display = 'block';
            heroDefault.style.display = 'none';
        } else {
            heroImg.style.display = 'none';
            heroDefault.style.display = 'flex';
        }
    }
}

// ==================== FUNCIONES GLOBALES ====================
window.openModal = openModal;
window.closeModal = closeModal;
window.loadFromGoogleSheets = loadFromGoogleSheets;

// Inicializar logo
updateHeroLogo();
