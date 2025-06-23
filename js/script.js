document.addEventListener('DOMContentLoaded', () => {
    const menuItemsGrid = document.querySelector('.menu-items-grid');
    const menuCategoriesContainer = document.querySelector('.menu-categories');
    const popularGrid = document.querySelector('.popular-grid');
    const favoritesGrid = document.querySelector('.favorites-grid');
    const bookingForm = document.getElementById('booking-form');
    const contactForm = document.getElementById('contact-form');
    const modal = document.getElementById('modal');
    const dishModal = document.getElementById('dish-modal');
    const modalMessage = document.getElementById('modal-message');
    const searchInput = document.getElementById('menu-search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const priceFilter = document.getElementById('price-filter');
    const priceValue = document.getElementById('price-value');
    let allMenuItems = [];

    // Иконки категорий
    const categoryIcons = {
        'Мясо': '🍖',
        'Супы': '🍲',
        'Паста': '🍝',
        'Салаты': '🥗',
        'Рыба': '🐟',
        'Напитки': '🥤',
        'Десерты': '🍰'
    };

    // Инициализация избранного
    if (!localStorage.getItem('favorites')) {
        localStorage.setItem('favorites', JSON.stringify([1, 3, 8]));
    }

    // 1. Загрузка данных
    async function loadMenuData() {
        try {
            const response = await fetch('data/menu.json');
            allMenuItems = await response.json();
            displayMenuItems(allMenuItems);
            generateCategoryButtons(allMenuItems);
            displayPopularItems(allMenuItems);
            displayFavorites();
            displayPromotions();
        } catch (error) {
            console.error('Ошибка загрузки меню:', error);
            menuItemsGrid.innerHTML = '<p>Не удалось загрузить меню.</p>';
        }
    }

    // 2. Отображение блюд
    function displayMenuItems(items, container = menuItemsGrid) {
        container.innerHTML = '';
        if (items.length === 0) {
            container.innerHTML = '<p>Нет блюд</p>';
            return;
        }
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        items.forEach(item => {
            const isFavorite = favorites.includes(item.id);
            const menuItem = document.createElement('div');
            menuItem.classList.add('menu-item');
            menuItem.id = `menu-item-${item.id}`;
            menuItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" loading="lazy">
                <div class="menu-item-content">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <span class="price">${item.price} ₽</span>
                    <button class="favorite-btn${isFavorite ? ' active' : ''}" data-id="${item.id}" aria-label="${isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}" aria-pressed="${isFavorite}">
                        ${isFavorite ? '★' : '☆'}
                    </button>
                </div>
            `;
            menuItem.addEventListener('click', (e) => {
                if (e.target.classList.contains('favorite-btn')) return;
                console.log('Открываем модальное окно для блюда:', item.name); // Отладка
                try {
                    document.getElementById('dish-modal-image').src = item.image;
                    document.getElementById('dish-modal-image').alt = item.name;
                    document.getElementById('dish-modal-name').textContent = item.name;
                    document.getElementById('dish-modal-description').textContent = item.description;
                    document.getElementById('dish-modal-price').textContent = `${item.price} ₽`;
                    // Ingredients
                    const ingredientsList = document.getElementById('dish-modal-ingredients');
                    ingredientsList.innerHTML = '';
                    if (typeof item.ingredients === 'string' && item.ingredients.trim().length > 0) {
                        const ingredientsArray = item.ingredients.split(',').map(ing => ing.trim());
                        ingredientsArray.forEach(ingredient => {
                            const li = document.createElement('li');
                            li.textContent = ingredient;
                            ingredientsList.appendChild(li);
                        });
                    } else {
                        ingredientsList.innerHTML = '<li>Состав не указан</li>';
                    }
                    // Calories
                    const caloriesElement = document.getElementById('dish-modal-calories');
                    caloriesElement.textContent = item.calories ? `Калорийность: ${item.calories} ккал` : 'Калорийность не указана';
                    dishModal.classList.add('active');
                    dishModal.setAttribute('aria-hidden', 'false');
                    document.querySelector('#dish-modal .modal-close').focus();
                    dishModal.dataset.lastFocused = menuItem.id;
                } catch (error) {
                    console.error('Ошибка при открытии модального окна:', error);
                }
            });
            container.appendChild(menuItem);
        });
        addFavoriteListeners();
    }

    // 3. Генерация кнопок категорий
    function generateCategoryButtons() {
        menuCategoriesContainer.innerHTML = '';
        const categories = ['Все', ...new Set(allMenuItems.map(item => item.category))];
        categories.forEach(category => {
            const button = document.createElement('button');
            button.classList.add('menu-category-btn');
            button.innerHTML = `${categoryIcons[category] || ''} ${category}`;
            button.dataset.category = category;
            button.setAttribute('aria-pressed', category === 'Все' ? 'true' : 'false');
            if (category === 'Все') {
                button.classList.add('active');
            }
            button.addEventListener('click', () => {
                document.querySelectorAll('.menu-category-btn').forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
                filterMenuItems(category);
            });
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
            menuCategoriesContainer.appendChild(button);
        });
    }

    // 4. Фильтрация блюд
    function filterMenuItems(category) {
        let filteredItems = category === 'Все' ? allMenuItems : allMenuItems.filter(item => item.category === category);
        const query = searchInput.value.toLowerCase().trim();
        const maxPrice = parseInt(priceFilter.value);
        priceValue.textContent = `${maxPrice} ₽`;
        if (query) {
            filteredItems = filteredItems.filter(item => 
                item.name.toLowerCase().includes(query) || 
                item.description.toLowerCase().includes(query)
            );
        }
        if (maxPrice < 2500) {
            filteredItems = filteredItems.filter(item => item.price <= maxPrice);
        }
        displayMenuItems(filteredItems);
    }

    // 5. Отображение популярных блюд
    function displayPopularItems(items) {
        const popularItems = items.filter(item => item.popular);
        displayMenuItems(popularItems, popularGrid);
    }

    // 6. Отображение избранного
    function displayFavorites() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const favoriteItems = allMenuItems.filter(item => favorites.includes(item.id));
        displayMenuItems(favoriteItems, favoritesGrid);
    }

    // 7. Отображение акций
    async function displayPromotions() {
        try {
            const response = await fetch('data/promotions.json');
            const promotions = await response.json();
            const promotionsGrid = document.querySelector('.promotions-grid');
            promotionsGrid.innerHTML = '';
            promotions.forEach(promo => {
                const promoItem = document.createElement('div');
                promoItem.classList.add('promo-item');
                promoItem.innerHTML = `
                    <img src="${promo.image}" alt="${promo.title}" loading="lazy">
                    <h3>${promo.title}</h3>
                    <p>${promo.description}</p>
                    <span class="promo-valid">Действует до: ${promo.validUntil}</span>
                `;
                promotionsGrid.appendChild(promoItem);
            });
        } catch (error) {
            console.error('Ошибка загрузки акций:', error);
        }
    }

    // 8. Обновление кнопок "Избранное"
    function updateFavoriteButtons(itemId, isFavorite) {
        document.querySelectorAll(`.favorite-btn[data-id="${itemId}"]`).forEach(btn => {
            btn.classList.toggle('active', isFavorite);
            btn.textContent = isFavorite ? '★' : '☆';
            btn.setAttribute('aria-label', isFavorite ? 'Убрать из избранного' : 'Добавить в избранное');
            btn.setAttribute('aria-pressed', isFavorite);
        });
    }

    // 9. Обработчик кнопок "Избранное"
    function addFavoriteListeners() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.removeEventListener('click', handleFavoriteClick);
            btn.removeEventListener('keydown', handleFavoriteKeydown);
            btn.addEventListener('click', handleFavoriteClick);
            btn.addEventListener('keydown', handleFavoriteKeydown);
        });

        function handleFavoriteClick(e) {
            const btn = e.currentTarget;
            const itemId = parseInt(btn.dataset.id);
            let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const isFavorite = favorites.includes(itemId);

            if (isFavorite) {
                favorites = favorites.filter(id => id !== itemId);
            } else {
                favorites.push(itemId);
            }

            localStorage.setItem('favorites', JSON.stringify(favorites));
            updateFavoriteButtons(itemId, !isFavorite);
            displayFavorites();
        }

        function handleFavoriteKeydown(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.currentTarget.click();
            }
        }
    }

    // 10. Поиск и фильтры
    searchInput.addEventListener('input', () => filterMenuItems(document.querySelector('.menu-category-btn.active')?.dataset.category || 'Все'));
    priceFilter.addEventListener('input', () => filterMenuItems(document.querySelector('.menu-category-btn.active')?.dataset.category || 'Все'));

    // 11. Тёмная тема
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.querySelector('.theme-icon').textContent = '☀️';
    }

    // 12. Плавная прокрутка
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
        });
    });

    // 13. Подсветка активного раздела
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.main-nav a');
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.removeAttribute('aria-current');
            if (link.getAttribute('href').slice(1) === current) {
                link.setAttribute('aria-current', 'page');
            }
        });
    });

    // 14. Обработка формы бронирования
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name').trim();
        const phone = formData.get('phone').trim();
        const date = formData.get('date');
        const time = formData.get('time');
        const guests = parseInt(formData.get('guests'));

        document.querySelectorAll('.error-message').forEach(el => el.remove());
        let isValid = true;

        if (!/^[a-zA-Zа-яА-Я\s]{2,}$/.test(name)) {
            const error = document.createElement('span');
            error.className = 'error-message';
            error.textContent = 'Имя должно содержать минимум 2 буквы';
            document.getElementById('booking-name').after(error);
            isValid = false;
        }
        if (!/^\+7\d{10}$/.test(phone)) {
            const error = document.createElement('span');
            error.className = 'error-message';
            error.textContent = 'Телефон должен быть в формате +7XXXXXXXXXX';
            document.getElementById('booking-phone').after(error);
            isValid = false;
        }
        const today = new Date().toISOString().split('T')[0];
        if (date < today) {
            const error = document.createElement('span');
            error.className = 'error-message';
            error.textContent = 'Дата не может быть раньше текущей';
            document.getElementById('booking-date').after(error);
            isValid = false;
        }
        const validTimes = Array.from({length: 21}, (_, i) => {
            const hour = Math.floor(12 + i / 2);
            const minute = i % 2 === 0 ? '00' : '30';
            return `${hour}:${minute}`;
        });
        if (!validTimes.includes(time)) {
            const error = document.createElement('span');
            error.className = 'error-message';
            error.textContent = 'Время должно быть с 12:00 до 22:00 с шагом 30 минут';
            document.getElementById('booking-time').after(error);
            isValid = false;
        }
        if (guests < 1 || guests > 10) {
            const error = document.createElement('span');
            error.className = 'error-message';
            error.textContent = 'Количество гостей должно быть от 1 до 10';
            document.getElementById('booking-guests').after(error);
            isValid = false;
        }

        if (isValid) {
            modalMessage.textContent = `Бронь на имя ${name} на ${date} в ${time} для ${guests} гостей`;
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.querySelector('#modal .modal-close').focus();
            modal.dataset.lastFocused = 'booking-submit';
            bookingForm.reset();
        }
    });

    // 15. Обработка формы обратной связи
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        modalMessage.textContent = 'Ваше сообщение отправлено! Мы свяжемся с вами скоро.';
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.querySelector('#modal .modal-close').focus();
        modal.dataset.lastFocused = 'contact-submit';
        contactForm.reset();
    });

    // 16. Закрытие модальных окон
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            const lastFocusedId = modal.dataset.lastFocused;
            if (lastFocusedId) {
                document.getElementById(lastFocusedId)?.focus();
            }
        });
    });

    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            const lastFocusedId = modal.dataset.lastFocused;
            if (lastFocusedId) {
                document.getElementById(lastFocusedId)?.focus();
            }
        }
    });

    dishModal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dishModal.classList.remove('active');
            dishModal.setAttribute('aria-hidden', 'true');
            const lastFocusedId = dishModal.dataset.lastFocused;
            if (lastFocusedId) {
                document.getElementById(lastFocusedId)?.focus();
            }
        }
    });

    // Запуск
    loadMenuData();
});
