// Menu LEET-DORIAN - Application Mobile Premium
class MenuApp {
    constructor() {
        this.binId = JSONBIN_CONFIG.binId || localStorage.getItem('pilipili_binId');
        this.menuData = null;
        this.allItems = [];
        this.currentFilter = 'all';
        this.selection = this.loadSelection();
        this.init();
    }

    async init() {
        try {
            console.log('[MENU] binId utilisé:', this.binId);
            if (!this.binId) {
                await this.createBin();
            }
            await this.loadMenu();
            this.setupSearch();
            this.setupScrollTop();
            this.setupSelection();
            this.updateSelectionFab();
        } catch (error) {
            console.error('Erreur init:', error);
            this.showError();
        }
    }

    // ==================== SÉLECTION ====================
    
    loadSelection() {
        try {
            return JSON.parse(localStorage.getItem('pilipili_selection')) || [];
        } catch {
            return [];
        }
    }

    saveSelection() {
        localStorage.setItem('pilipili_selection', JSON.stringify(this.selection));
        this.updateSelectionFab();
    }

    addToSelection(itemId) {
        const existing = this.selection.find(s => s.itemId === itemId);
        if (existing) {
            existing.qty += 1;
        } else {
            this.selection.push({ itemId, qty: 1 });
        }
        this.saveSelection();
        this.updateMenuCards();
        this.renderSelectionModal();
    }

    removeFromSelection(itemId) {
        const existing = this.selection.find(s => s.itemId === itemId);
        if (existing) {
            if (existing.qty > 1) {
                existing.qty -= 1;
            } else {
                this.selection = this.selection.filter(s => s.itemId !== itemId);
            }
        }
        this.saveSelection();
        this.updateMenuCards();
        this.renderSelectionModal();
    }

    clearSelection() {
        this.selection = [];
        this.saveSelection();
        this.updateMenuCards();
        this.renderSelectionModal();
    }

    getSelectionCount() {
        return this.selection.reduce((sum, s) => sum + s.qty, 0);
    }

    getSelectionTotal() {
        return this.selection.reduce((sum, s) => {
            const item = this.allItems.find(i => i.id === s.itemId);
            return sum + (item ? item.price * s.qty : 0);
        }, 0);
    }

    getItemQty(itemId) {
        const found = this.selection.find(s => s.itemId === itemId);
        return found ? found.qty : 0;
    }

    updateSelectionFab() {
        const fab = document.getElementById('selectionFab');
        const count = document.getElementById('selectionCount');
        const total = this.getSelectionCount();
        
        if (total > 0) {
            fab.style.display = 'flex';
            count.textContent = total;
        } else {
            fab.style.display = 'none';
        }
    }

    updateMenuCards() {
        document.querySelectorAll('.menu-card').forEach(card => {
            const itemId = parseInt(card.dataset.itemId);
            const qty = this.getItemQty(itemId);
            const selectBtn = card.querySelector('.select-btn');
            const qtyBadge = card.querySelector('.item-qty-badge');
            
            if (selectBtn) {
                selectBtn.classList.toggle('selected', qty > 0);
            }
            
            if (qtyBadge) {
                if (qty > 0) {
                    qtyBadge.textContent = qty;
                    qtyBadge.style.display = 'flex';
                } else {
                    qtyBadge.style.display = 'none';
                }
            }
        });
    }

    setupSelection() {
        const fab = document.getElementById('selectionFab');
        fab.addEventListener('click', () => {
            this.renderSelectionModal();
            document.getElementById('selectionModal').style.display = 'flex';
        });
    }

    renderSelectionModal() {
        const body = document.getElementById('selectionBody');
        const totalEl = document.getElementById('selectionTotal');
        
        if (this.selection.length === 0) {
            body.innerHTML = `
                <div class="empty-state" style="padding: 40px 0;">
                    <div class="empty-state-icon">+</div>
                    <h3 class="empty-state-title">Vide</h3>
                    <p class="empty-state-desc">Ajoutez des elements depuis le menu</p>
                </div>
            `;
            totalEl.textContent = '';
            return;
        }

        body.innerHTML = this.selection.map(s => {
            const item = this.allItems.find(i => i.id === s.itemId);
            if (!item) return '';
            
            const isBoisson = (item.type || 'plat') === 'boisson';
            let unitLabel;
            if (isBoisson) {
                unitLabel = s.qty > 1 ? 'boissons' : 'boisson';
            } else {
                const category = this.menuData.categories.find(c => c.id === item.categoryId);
                const unit = category?.unit || 'plat';
                unitLabel = `${unit}${s.qty > 1 ? 's' : ''}`;
            }
            
            const imageHtml = item.image 
                ? `<img src="${item.image}" alt="${item.name}" class="selection-item-image">`
                : `<div class="selection-item-no-image"></div>`;

            return `
                <div class="selection-item">
                    ${imageHtml}
                    <div class="selection-item-info">
                        <div class="selection-item-name">${item.name}</div>
                        <div class="selection-item-price">${s.qty} ${unitLabel} - ${this.formatPrice(item.price * s.qty)}</div>
                    </div>
                    <div class="selection-item-qty">
                        <button class="qty-btn" onclick="menuApp.removeFromSelection(${item.id})">−</button>
                        <span class="qty-value">${s.qty}</span>
                        <button class="qty-btn" onclick="menuApp.addToSelection(${item.id})">+</button>
                    </div>
                </div>
            `;
        }).join('');

        const total = this.getSelectionTotal();
        totalEl.textContent = this.formatPrice(total);
    }

    getHeaders() {
        return {
            'X-Master-Key': JSONBIN_CONFIG.masterKey,
            'Content-Type': 'application/json'
        };
    }

    async createBin() {
        const defaultData = {
            settings: {
                restaurantInfoVisible: true
            },
            restaurant: {
                name: 'LEET-DORIAN',
                address: 'Montagne Sainte, Libreville',
                phone: '074 41 22 56',
                hours: 'Lun-Dim: 12h - 23h',
                social: {
                    facebook: '',
                    instagram: '',
                    whatsapp: '241074412256'
                }
            },
            categories: [
                { id: 1, name: 'Entrees', order: 1, unit: 'plat' },
                { id: 2, name: 'Plats', order: 2, unit: 'plat' },
                { id: 3, name: 'Grillades', order: 3, unit: 'plat' },
                { id: 4, name: 'Boissons', order: 4, unit: 'bouteille' },
                { id: 5, name: 'Desserts', order: 5, unit: 'portion' }
            ],
            items: [
                {
                    id: 1,
                    name: 'Salade Pili-Pili',
                    description: 'Salade fraiche avec piment et vinaigrette epicee',
                    price: 3500,
                    categoryId: 1,
                    type: 'plat',
                    image: '',
                    badge: 'new',
                    isSpecial: false,
                    isActive: true
                },
                {
                    id: 2,
                    name: 'Poulet Braisé',
                    description: 'Poulet marine aux epices locales, grille au feu de bois',
                    price: 8500,
                    categoryId: 3,
                    type: 'plat',
                    image: '',
                    badge: 'popular',
                    isSpecial: true,
                    isActive: true
                },
                {
                    id: 3,
                    name: 'Poisson Grillé',
                    description: 'Poisson frais grille avec sauce tomate epicee',
                    price: 12000,
                    categoryId: 3,
                    type: 'plat',
                    image: '',
                    badge: 'popular',
                    isSpecial: true,
                    isActive: true
                },
                {
                    id: 4,
                    name: 'Jus de Bissap',
                    description: "Jus d'hibiscus frais, sucre a votre gout",
                    price: 1500,
                    categoryId: null,
                    type: 'boisson',
                    image: '',
                    badge: null,
                    isSpecial: false,
                    isActive: true
                },
                {
                    id: 5,
                    name: 'Tarte aux fruits',
                    description: 'Tarte maison avec fruits frais de saison',
                    price: 3000,
                    categoryId: 5,
                    type: 'plat',
                    image: '',
                    badge: 'new',
                    isSpecial: false,
                    isActive: true
                }
            ],
            lastUpdate: new Date().toISOString()
        };

        const response = await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(defaultData)
        });

        if (!response.ok) {
            throw new Error(`Erreur creation bin: ${response.status}`);
        }

        const result = await response.json();
        this.binId = result.metadata?.id;
        
        if (!this.binId) {
            throw new Error('ID du bin non trouve');
        }
    }

    async loadMenu() {
        const loading = document.getElementById('loading');

        if (!this.binId) {
            throw new Error('Aucun binId disponible');
        }

        const response = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}/latest`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erreur chargement: ${response.status}`);
        }

        const result = await response.json();
        this.menuData = result.record;
        this.allItems = this.menuData.items.filter(item => item.isActive);
        
        loading.style.display = 'none';
        document.getElementById('heroSection').style.display = 'block';
        this.renderAll();
        this.renderRestaurantInfo();
        this.applyTheme();
        this.initHeaderToolbar();
    }

    initHeaderToolbar() {
        const toolbar = document.getElementById('headerToolbar');
        const logo = document.getElementById('headerLogo');
        const title = document.getElementById('headerTitle');
        const coordsEl = document.getElementById('headerToolCoords');
        const fontSelect = document.getElementById('titleFontSelect');
        if (!toolbar || !logo || !title || !coordsEl || !fontSelect) return;

        toolbar.style.display = 'flex';

        const stateKey = 'leet-dorian-header-state';
        const step = 5;

        function parseTranslate(el) {
            const m = (el.style.transform || '').match(/translate\(([^p]+)px,\s*([^p]+)px\)/);
            return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
        }

        function applyTranslate(el, x, y) {
            el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
        }

        function getState() {
            const logoPos = parseTranslate(logo);
            const titlePos = parseTranslate(title);
            return {
                logoX: logoPos.x,
                logoY: logoPos.y,
                titleX: titlePos.x,
                titleY: titlePos.y,
                titleFont: title.style.fontFamily || "'Playfair Display', serif",
                titleSize: title.style.fontSize || '1.25rem'
            };
        }

        function applyState(state) {
            applyTranslate(logo, state.logoX || 0, state.logoY || 0);
            applyTranslate(title, state.titleX || 0, state.titleY || 0);
            title.style.fontFamily = state.titleFont || "'Playfair Display', serif";
            title.style.fontSize = state.titleSize || '1.25rem';
            if (fontSelect) fontSelect.value = state.titleFont || "'Playfair Display', serif";
        }

        function updateCoords() {
            const logoPos = parseTranslate(logo);
            const titlePos = parseTranslate(title);
            coordsEl.textContent = Math.round(titlePos.x) + ',' + Math.round(titlePos.y);
        }

        const saved = localStorage.getItem(stateKey);
        if (saved) {
            try { applyState(JSON.parse(saved)); } catch (e) {}
        }
        updateCoords();

        function saveState() {
            localStorage.setItem(stateKey, JSON.stringify(getState()));
            updateCoords();
        }

        document.getElementById('logoLeftBtn').addEventListener('click', function() {
            var pos = parseTranslate(logo);
            applyTranslate(logo, pos.x - step, pos.y);
            saveState();
        });

        document.getElementById('logoRightBtn').addEventListener('click', function() {
            var pos = parseTranslate(logo);
            applyTranslate(logo, pos.x + step, pos.y);
            saveState();
        });

        document.getElementById('logoUpBtn').addEventListener('click', function() {
            var pos = parseTranslate(logo);
            applyTranslate(logo, pos.x, pos.y - step);
            saveState();
        });

        document.getElementById('logoDownBtn').addEventListener('click', function() {
            var pos = parseTranslate(logo);
            applyTranslate(logo, pos.x, pos.y + step);
            saveState();
        });

        document.getElementById('titleLeftBtn').addEventListener('click', function() {
            var pos = parseTranslate(title);
            applyTranslate(title, pos.x - step, pos.y);
            saveState();
        });

        document.getElementById('titleRightBtn').addEventListener('click', function() {
            var pos = parseTranslate(title);
            applyTranslate(title, pos.x + step, pos.y);
            saveState();
        });

        document.getElementById('titleUpBtn').addEventListener('click', function() {
            var pos = parseTranslate(title);
            applyTranslate(title, pos.x, pos.y - step);
            saveState();
        });

        document.getElementById('titleDownBtn').addEventListener('click', function() {
            var pos = parseTranslate(title);
            applyTranslate(title, pos.x, pos.y + step);
            saveState();
        });

        document.getElementById('titleBigBtn').addEventListener('click', function() {
            var current = parseFloat(title.style.fontSize || 20);
            title.style.fontSize = Math.min(40, current + step) + 'px';
            saveState();
        });

        document.getElementById('titleSmallBtn').addEventListener('click', function() {
            var current = parseFloat(title.style.fontSize || 20);
            title.style.fontSize = Math.max(12, current - step) + 'px';
            saveState();
        });

        fontSelect.addEventListener('change', function() {
            title.style.fontFamily = this.value;
            saveState();
        });
    }

    showError() {
        const loading = document.getElementById('loading');
        loading.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">!</div>
                <h3 class="empty-state-title">Erreur de chargement</h3>
                <p class="empty-state-desc">Verifiez votre connexion</p>
                <button onclick="localStorage.removeItem('pilipili_binId'); location.reload();">
                    Reessayer
                </button>
            </div>
        `;
    }

    renderAll() {
        if (!this.menuData) return;

        this.renderCategories();
        this.renderMenu();
    }

    renderRestaurantInfo() {
        const section = document.getElementById('restaurantInfo');
        if (!section || !this.menuData?.restaurant) return;

        if (this.menuData.settings?.restaurantInfoVisible === false) {
            section.style.display = 'none';
            return;
        }

        const restaurant = this.menuData.restaurant;
        const hasInfo = restaurant.name || restaurant.address || restaurant.phone || restaurant.hours || restaurant.social?.whatsapp;
        if (!hasInfo) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        const nameEl = document.getElementById('restaurantInfoName');
        if (nameEl) nameEl.textContent = restaurant.name || '';

        const addressItem = document.getElementById('restaurantInfoAddress');
        const addressText = addressItem?.querySelector('.restaurant-info-text');
        if (restaurant.address && addressItem && addressText) {
            addressText.textContent = restaurant.address;
            addressItem.style.display = 'inline-flex';
        } else if (addressItem) {
            addressItem.style.display = 'none';
        }

        const phoneItem = document.getElementById('restaurantInfoPhone');
        const phoneLink = phoneItem?.querySelector('.restaurant-info-link');
        if (restaurant.phone && phoneItem && phoneLink) {
            phoneLink.textContent = restaurant.phone;
            phoneLink.href = 'tel:' + restaurant.phone.replace(/[^0-9+]/g, '');
            phoneItem.style.display = 'inline-flex';
        } else if (phoneItem) {
            phoneItem.style.display = 'none';
        }

        const whatsappItem = document.getElementById('restaurantInfoWhatsapp');
        const whatsappLink = whatsappItem?.querySelector('.restaurant-info-link');
        if (restaurant.social?.whatsapp && whatsappItem && whatsappLink) {
            whatsappLink.textContent = restaurant.social.whatsapp;
            const phoneNumber = restaurant.social.whatsapp.replace(/[^0-9]/g, '');
            whatsappLink.href = 'https://wa.me/' + phoneNumber;
            whatsappItem.style.display = 'inline-flex';
        } else if (whatsappItem) {
            whatsappItem.style.display = 'none';
        }

        const hoursItem = document.getElementById('restaurantInfoHours');
        const hoursText = hoursItem?.querySelector('.restaurant-info-text');
        if (restaurant.hours && hoursItem && hoursText) {
            hoursText.textContent = restaurant.hours;
            hoursItem.style.display = 'inline-flex';
        } else if (hoursItem) {
            hoursItem.style.display = 'none';
        }
    }

    applyTheme() {
        const theme = this.menuData.settings?.theme || {};
        const root = document.documentElement;
        
        if (theme.primary) {
            root.style.setProperty('--sage', theme.primary);
            root.style.setProperty('--sage-hover', this.darkenColor(theme.primary, 20));
            root.style.setProperty('--sage-glow', this.hexToRgba(theme.primary, 0.15));
        }
        if (theme.secondary) {
            root.style.setProperty('--text-primary', theme.secondary);
            root.style.setProperty('--text-secondary', this.adjustColorOpacity(theme.secondary, 0.7));
            root.style.setProperty('--text-muted', this.adjustColorOpacity(theme.secondary, 0.5));
        }
        if (theme.background) {
            root.style.setProperty('--bg-primary', theme.background);
            root.style.setProperty('--bg-secondary', theme.background);
            root.style.setProperty('--bg-card', '#FFFFFF');
            root.style.setProperty('--bg-elevated', '#FFFFFF');
        }
        if (theme.text) {
            root.style.setProperty('--text-secondary', theme.text);
        }
        if (theme.titleFont) {
            const titleEl = document.getElementById('headerTitle');
            if (titleEl) titleEl.style.fontFamily = theme.titleFont;
        }
        if (theme.bodyFont) {
            document.body.style.fontFamily = theme.bodyFont;
        }
    }
    
    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    hexToRgba(hex, alpha) {
        const num = parseInt(hex.replace('#', ''), 16);
        const R = (num >> 16) & 255;
        const G = (num >> 8) & 255;
        const B = num & 255;
        return 'rgba(' + R + ',' + G + ',' + B + ',' + alpha + ')';
    }
    
    adjustColorOpacity(hex, alpha) {
        return this.hexToRgba(hex, alpha);
    }

    renderCategories() {
        const container = document.getElementById('categoriesScroll');
        
        const categories = [...this.menuData.categories]
            .sort((a, b) => a.order - b.order);

        container.innerHTML = `
            <button class="category-chip active" data-filter="all">Tout</button>
            <button class="category-chip" data-filter="drinks">Boissons</button>
            ${categories.map(cat => `
                <button class="category-chip" data-filter="category-${cat.id}">${cat.name}</button>
            `).join('')}
        `;

        container.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.filterMenu(chip.dataset.filter);
            });
        });
    }

    renderMenu(filter = 'all') {
        const container = document.getElementById('menuSection');
        const categories = [...this.menuData.categories].sort((a, b) => a.order - b.order);
        
        const drinkCategoryIds = new Set(
            categories
                .filter(c => c.name.toLowerCase().includes('boisson') || c.name.toLowerCase().includes('drink'))
                .map(c => c.id)
        );
        
        const isBoisson = item =>
            (item.type || 'plat') === 'boisson' || drinkCategoryIds.has(item.categoryId);
        
        let items = this.allItems;
        let isDrinksFilter = false;
        
        if (filter === 'popular') {
            items = items.filter(item => item.badge === 'popular' && !isBoisson(item));
        } else if (filter === 'drinks') {
            items = items.filter(item => isBoisson(item));
            isDrinksFilter = true;
        } else if (filter === 'new') {
            items = items.filter(item => item.badge === 'new' && !isBoisson(item));
        } else if (filter.startsWith('category-')) {
            const catId = parseInt(filter.replace('category-', ''));
            items = items.filter(item => item.categoryId === catId);
        } else {
            items = items;
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">0</div>
                    <h3 class="empty-state-title">${isDrinksFilter ? 'Aucune boisson' : 'Aucun resultat'}</h3>
                    <p class="empty-state-desc">Essayez une autre categorie</p>
                </div>
            `;
            return;
        }

        if (isDrinksFilter) {
            container.innerHTML = `
                <div class="drinks-grid">
                    ${items.map(item => this.renderMenuCard(item)).join('')}
                </div>
            `;
        } else {
            const plats = items.filter(item => !isBoisson(item));
            const boissons = items.filter(item => isBoisson(item));
            let html = '';

            if (plats.length > 0) {
                const groupedItems = {};
                plats.forEach(item => {
                    if (!groupedItems[item.categoryId]) {
                        groupedItems[item.categoryId] = [];
                    }
                    groupedItems[item.categoryId].push(item);
                });

                html += categories
                    .filter(cat => groupedItems[cat.id])
                    .map(category => {
                        const categoryItems = groupedItems[category.id];
                        return `
                            <div class="menu-category">
                                <h2 class="category-title">${category.name}</h2>
                                <div class="menu-grid">
                                    ${categoryItems.map(item => this.renderMenuCard(item)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('');
            }

            if (boissons.length > 0) {
                html += `
                    <div class="drinks-separator">
                        <div class="drinks-separator-line"></div>
                        <span class="drinks-separator-label">Boissons</span>
                        <div class="drinks-separator-line"></div>
                    </div>
                    <div class="menu-category">
                        <div class="drinks-grid">
                            ${boissons.map(item => this.renderMenuCard(item)).join('')}
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;
        }
    }

    renderMenuCard(item) {
        const imageHtml = item.image 
            ? `<img src="${item.image}" alt="${item.name}" class="menu-card-image" loading="lazy">`
            : `<div class="menu-card-no-image"></div>`;

        const isBoisson = (item.type || 'plat') === 'boisson';
        const badgeHtml = (!isBoisson && item.badge) ? this.getBadgeHtml(item.badge) : '';
        const qty = this.getItemQty(item.id);
        const descIcon = (!isBoisson && item.description) ? `<svg class="menu-card-desc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>` : '';

        return `
            <div class="menu-card" data-item-id="${item.id}">
                ${imageHtml}
                <div class="menu-card-body">
                    <div class="menu-card-header">
                        <h3 class="menu-card-name">${item.name}</h3>
                        <div class="menu-card-header-right">
                            <span class="menu-card-price">${this.formatPrice(item.price)}</span>
                            ${descIcon}
                        </div>
                    </div>
                    ${badgeHtml ? `<div class="menu-card-badges">${badgeHtml}</div>` : ''}
                </div>
                <button class="select-btn ${qty > 0 ? 'selected' : ''}" onclick="menuApp.toggleSelectItem(${item.id}, event)" aria-label="Ajouter au panier">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                    </svg>
                </button>
                ${qty > 0 ? `<div class="item-qty-badge">${qty}</div>` : ''}
            </div>
        `;
    }

    toggleSelectItem(itemId, event) {
        event.stopPropagation();
        const qty = this.getItemQty(itemId);
        const card = event.currentTarget.closest('.menu-card');
        const fab = document.getElementById('selectionFab');
        
        if (qty > 0) {
            this.removeFromSelection(itemId);
        } else {
            this.addToSelection(itemId);
            if (card) {
                card.classList.add('just-added');
                setTimeout(() => card.classList.remove('just-added'), 350);
            }
            if (fab) {
                fab.classList.add('pulse');
                setTimeout(() => fab.classList.remove('pulse'), 500);
            }
        }
        
        const btn = event.currentTarget;
        btn.classList.add('animating');
        setTimeout(() => btn.classList.remove('animating'), 350);
    }

    renderRestaurantInfo() {
        if (!this.menuData.restaurant) return;

        const { restaurant } = this.menuData;
        const container = document.getElementById('menuSection');
        
        container.innerHTML += `
            <div class="restaurant-info">
                <div class="info-item">
                    <div class="info-icon">...</div>
                    <div class="info-text">
                        <div class="info-label">Adresse</div>
                        <div class="info-value">${restaurant.address || 'Non renseigne'}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">...</div>
                    <div class="info-text">
                        <div class="info-label">Telephone</div>
                        <div class="info-value">${restaurant.phone || 'Non renseigne'}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">...</div>
                    <div class="info-text">
                        <div class="info-label">Horaires</div>
                        <div class="info-value">${restaurant.hours || 'Non renseigne'}</div>
                    </div>
                </div>
                ${restaurant.social && (restaurant.social.facebook || restaurant.social.instagram || restaurant.social.whatsapp) ? `
                    <div class="social-row">
                        ${restaurant.social.facebook ? `<a href="${restaurant.social.facebook}" target="_blank" class="social-btn facebook">Facebook</a>` : ''}
                        ${restaurant.social.instagram ? `<a href="${restaurant.social.instagram}" target="_blank" class="social-btn instagram">Instagram</a>` : ''}
                        ${restaurant.social.whatsapp ? `<a href="https://api.whatsapp.com/send?phone=${restaurant.social.whatsapp}" target="_blank" class="social-btn whatsapp">WhatsApp</a>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    filterMenu(filter) {
        this.currentFilter = filter;
        this.renderMenu(filter);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    getBadgeHtml(badge) {
        const badges = {
            popular: { class: 'badge-popular', text: 'Populaire' },
            new: { class: 'badge-new', text: 'Nouveau' }
        };

        const badgeInfo = badges[badge];
        if (!badgeInfo) return '';

        return `<span class="badge ${badgeInfo.class}">${badgeInfo.text}</span>`;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
    }

    setupSearch() {
        const searchBtn = document.getElementById('searchBtn');
        const searchBar = document.getElementById('searchBar');
        const searchInput = document.getElementById('searchInput');
        const searchClose = document.getElementById('searchClose');

        searchBtn.addEventListener('click', () => {
            searchBar.classList.add('active');
            searchInput.focus();
        });

        searchClose.addEventListener('click', () => {
            searchBar.classList.remove('active');
            searchInput.value = '';
            this.renderMenu(this.currentFilter);
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query === '') {
                this.renderMenu(this.currentFilter);
                return;
            }

            const filtered = this.allItems.filter(item => {
                const matchesQuery = item.name.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query);
                
                if (this.currentFilter === 'drinks') {
                    return matchesQuery && (item.type || 'plat') === 'boisson';
                }
                return matchesQuery && (item.type || 'plat') !== 'boisson';
            });

            this.renderSearchResults(filtered);
        });
    }

    renderSearchResults(items) {
        const container = document.getElementById('menuSection');

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">0</div>
                    <h3 class="empty-state-title">Aucun resultat</h3>
                    <p class="empty-state-desc">Essayez autre chose</p>
                </div>
            `;
            return;
        }

        const plats = items.filter(i => (i.type || 'plat') !== 'boisson');
        const boissons = items.filter(i => (i.type || 'plat') === 'boisson');

        let html = '';
        if (plats.length > 0) {
            html += `
                <div class="menu-category">
                    <h2 class="category-title">Plats</h2>
                    <div class="menu-grid">
                        ${plats.map(item => this.renderMenuCard(item)).join('')}
                    </div>
                </div>
            `;
        }
        if (boissons.length > 0) {
            html += `
                <div class="menu-category">
                    <h2 class="category-title">Boissons</h2>
                    <div class="drinks-grid">
                        ${boissons.map(item => this.renderMenuCard(item)).join('')}
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    setupScrollTop() {
        const fab = document.getElementById('scrollTopBtn');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                fab.classList.add('visible');
            } else {
                fab.classList.remove('visible');
            }
        });

        fab.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ==================== FONCTIONS GLOBALES ====================

let menuApp;

function closeSelectionModal() {
    document.getElementById('selectionModal').style.display = 'none';
}

function clearSelection() {
    if (menuApp) {
        menuApp.clearSelection();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    menuApp = new MenuApp();
});

// ============================================
// PWA INSTALLATION
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('SW registration failed: ', err);
        });
    });
}

let deferredPrompt;
const pwaBanner = document.getElementById('pwaInstallBanner');
const pwaInstallBtn = document.getElementById('pwaInstallBtn');
const pwaCloseBtn = document.getElementById('pwaCloseBtn');

const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
};

const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if (!localStorage.getItem('pwa_dismissed')) {
        pwaBanner.style.display = 'flex';
    }
});

if (isIos() && !isInStandaloneMode() && !localStorage.getItem('pwa_dismissed')) {
    pwaBanner.style.display = 'flex';
    document.querySelector('.pwa-desc').textContent = 'Appuyez sur Partager puis "Sur l\'ecran d\'accueil"';
    pwaInstallBtn.style.display = 'none';
}

if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', async () => {
        pwaBanner.style.display = 'none';
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
        }
    });
}

if (pwaCloseBtn) {
    pwaCloseBtn.addEventListener('click', () => {
        pwaBanner.style.display = 'none';
        localStorage.setItem('pwa_dismissed', 'true');
    });
}

