/**
 * КСШОР Республики Мордовия г. Саранск
 * Основной JavaScript файл
 */

// ============================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ ВАЛИДАЦИИ
// ============================================

// МАСКА ТЕЛЕФОНА
function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.startsWith('7') || value.startsWith('8')) {
        value = value.substring(0, 11);
    } else if (value.startsWith('9')) {
        value = '7' + value;
        value = value.substring(0, 11);
    } else {
        value = value.substring(0, 10);
    }
    
    let formatted = '+7';
    if (value.length > 1) {
        formatted += ' (' + value.substring(1, 4);
    }
    if (value.length >= 5) {
        formatted += ') ' + value.substring(4, 7);
    }
    if (value.length >= 8) {
        formatted += '-' + value.substring(7, 9);
    }
    if (value.length >= 10) {
        formatted += '-' + value.substring(9, 11);
    }
    
    input.value = formatted;
}

function validateAge(input) {
    let value = parseInt(input.value);
    if (value < 5) input.value = 5;
    if (value > 18) input.value = 18;
}

// ============================================
// Инициализация при загрузке страницы
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Сайт КСШОР Республики Мордовия загружен');
    
    initMobileMenu();
    initScrollEffects();
    initFormValidation();
    initBackToTop();
    initImageLoading();
    initAnimations();
});

// ============================================
// 1. Мобильное меню (бургер)
// ============================================
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    const body = document.body;
    
    if (!mobileMenuBtn || !navLinks) return;
    
    mobileMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
        navLinks.classList.toggle('active');
        body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        
        const icon = this.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    document.querySelectorAll('#navLinks a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            navLinks.classList.remove('active');
            body.style.overflow = '';
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });
    
    document.addEventListener('click', function(event) {
        if (navLinks.classList.contains('active') && 
            !mobileMenuBtn.contains(event.target) && 
            !navLinks.contains(event.target)) {
            mobileMenuBtn.classList.remove('active');
            navLinks.classList.remove('active');
            body.style.overflow = '';
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}

// ============================================
// 2. Эффекты скролла и навигации
// ============================================
function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
            navbar.style.padding = '10px 0';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            navbar.style.padding = '15px 0';
        }
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// ============================================
// 3. ВАЛИДАЦИЯ И ОТПРАВКА ФОРМЫ ЗАЯВКИ (РАБОЧАЯ ВЕРСИЯ С СЕРВЕРОМ)
// ============================================
function initFormValidation() {
    const applicationForm = document.getElementById('applicationForm');
    
    if (!applicationForm) return;
    
    applicationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        clearAllFormErrors();
        
        const formData = {
            fullName: document.getElementById('fullName').value.trim(),
            age: document.getElementById('age').value,
            phone: document.getElementById('phone').value.replace(/\D/g, ''),
            email: document.getElementById('email').value.trim(),
            direction: document.getElementById('direction').value,
            message: document.getElementById('message').value.trim()
        };
        
        console.log('Собранные данные формы:', formData);
        
        let isValid = true;
        
        if (!formData.fullName) {
            showFormError(document.getElementById('fullName'), 'ФИО обязательно для заполнения');
            isValid = false;
        }
        
        const age = parseInt(formData.age);
        if (!formData.age || isNaN(age) || age < 5 || age > 18) {
            showFormError(document.getElementById('age'), 'Возраст должен быть от 5 до 18 лет');
            isValid = false;
        }
        
        if (!formData.phone || formData.phone.length !== 11) {
            showFormError(document.getElementById('phone'), 'Введите корректный телефон (11 цифр)');
            isValid = false;
        }
        
        if (!formData.email || !isValidEmail(formData.email)) {
            showFormError(document.getElementById('email'), 'Введите корректный email');
            isValid = false;
        }
        
        if (!formData.direction) {
            showFormError(document.getElementById('direction'), 'Выберите направление');
            isValid = false;
        }
        
        if (!isValid) {
            showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
            return;
        }
        
        // ОТПРАВКА НА СЕРВЕР
        sendApplicationToServer(formData);
    });
    
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function showFormError(field, message) {
        const errorDiv = field.parentNode.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        field.style.borderColor = '#ff3860';
        field.style.backgroundColor = '#fff5f5';
    }
    
    function clearFormError(field) {
        const errorDiv = field.parentNode.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
        field.style.borderColor = '#ddd';
        field.style.backgroundColor = '';
    }
    
    function clearAllFormErrors() {
        const formErrors = document.querySelectorAll('.form-error');
        formErrors.forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
        
        const formInputs = document.querySelectorAll('#applicationForm input, #applicationForm select');
        formInputs.forEach(input => {
            input.style.borderColor = '#ddd';
            input.style.backgroundColor = '';
        });
    }
    
    function sendApplicationToServer(formData) {
        const submitBtn = applicationForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;
        
        const directionNames = {
            'wrestling': 'Греко-римская борьба',
            'swimming': 'Плавание',
            'athletics': 'Легкая атлетика',
            'table-tennis': 'Настольный теннис',
            'gymnastics': 'Художественная гимнастика',
            'chess': 'Шахматы'
        };
        
        fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: formData.fullName,
                age: parseInt(formData.age),
                phone: formData.phone,
                email: formData.email,
                direction: formData.direction,
                directionName: directionNames[formData.direction] || formData.direction,
                message: formData.message || ''
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Заявка успешно отправлена! Мы свяжемся с вами в течение 24 часов.', 'success');
                applicationForm.reset();
            } else {
                showNotification('Ошибка при отправке: ' + (data.error || 'Попробуйте позже'), 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка отправки:', error);
            showNotification('Ошибка соединения. Пожалуйста, позвоните нам по телефону +7 (8342) 55-55-55', 'error');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }
}

// ============================================
// 4. Кнопка "Наверх"
// ============================================
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================
// 5. Оптимизация загрузки изображений
// ============================================
function initImageLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        images.forEach(img => imageObserver.observe(img));
    } else {
        images.forEach(img => {
            img.src = img.dataset.src || img.src;
        });
    }
}

// ============================================
// 6. Анимации и интерактивные элементы
// ============================================
function initAnimations() {
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.direction-card, .review-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                element.style.animationPlayState = 'running';
            }
        });
    };
    
    animateOnScroll();
    window.addEventListener('scroll', animateOnScroll);
    
    const directionCards = document.querySelectorAll('.direction-card');
    directionCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    const reviewCards = document.querySelectorAll('.review-card');
    reviewCards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });
}

// ============================================
// 7. Уведомления
// ============================================
function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#ff3860' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// ============================================
// 8. Обработка внешних ссылок
// ============================================
function handleExternalLinks() {
    const links = document.querySelectorAll('a[href^="http"]');
    
    links.forEach(link => {
        if (link.hostname !== window.location.hostname) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

// ============================================
// 9. Оптимизация для мобильных устройств
// ============================================
function optimizeForMobile() {
    document.addEventListener('focusin', function(e) {
        if (e.target.matches('input, textarea, select')) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    });
    
    document.addEventListener('touchstart', function() {}, { passive: true });
}

// ============================================
// 10. Обработка ошибок изображений
// ============================================
function handleImageErrors() {
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjY2Ij5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
            e.target.alt = 'Изображение не загружено';
        }
    }, true);
}

// ============================================
// 11. Очистка сессии админа при переходе на сайт
// ============================================
function clearAdminSessionOnSite() {
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('.html')) {
        
        if (document.referrer && document.referrer.includes('admin.html')) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUsername');
            localStorage.removeItem('loginTime');
        }
    }
}

// ============================================
// 12. Запуск всех функций
// ============================================
window.addEventListener('load', function() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .notification { animation: slideIn 0.3s ease; }
    `;
    document.head.appendChild(style);
    
    handleExternalLinks();
    optimizeForMobile();
    handleImageErrors();
    clearAdminSessionOnSite();
    
    const copyrightElement = document.querySelector('.copyright p');
    if (copyrightElement) {
        const currentYear = new Date().getFullYear();
        copyrightElement.textContent = copyrightElement.textContent.replace('2025', currentYear);
    }
});