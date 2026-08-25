// Menu Pili-Pili Lounge - Application Mobile Premium
class MenuApp {
    constructor() {
        this.binId = localStorage.getItem('pilipili_binId');
        this.menuData = null;
        this.allItems = [];
        this.currentFilter = 'all';
        this.selection = this.loadSelection();
        this.init();
    }

    async init() {
        try {
            if (!this.binId) {
                await this.createBin();
            }
            await this.loadMenu();
            this.setupSearch();
            this.setupNavigation();
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
                    <p class="empty-state-desc">Ajoutez des éléments depuis le menu</p>
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
            restaurant: {
                name: 'Pili-Pili Lounge',
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
                { id: 1, name: 'Entrées', order: 1, unit: 'plat' },
                { id: 2, name: 'Plats', order: 2, unit: 'plat' },
                { id: 3, name: 'Grillades', order: 3, unit: 'plat' },
                { id: 4, name: 'Boissons', order: 4, unit: 'bouteille' },
                { id: 5, name: 'Desserts', order: 5, unit: 'portion' }
            ],
            items: [
                {
                    id: 1,
                    name: 'Salade Pili-Pili',
                    description: 'Salade fraîche avec piment et vinaigrette épicée',
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
                    description: 'Poulet mariné aux épices locales, grillé au feu de bois',
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
                    description: 'Poisson frais grillé avec sauce tomate épicée',
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
                    description: 'Jus d\'hibiscus frais, sucré à votre goût',
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
            throw new Error(`Erreur création bin: ${response.status}`);
        }

        const result = await response.json();
        this.binId = result.metadata?.id;
        
        if (!this.binId) {
            throw new Error('ID du bin non trouvé');
        }

        localStorage.setItem('pilipili_binId', this.binId);
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
        this.renderAll();
    }

    showError() {
        const loading = document.getElementById('loading');
        loading.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">!</div>
                <h3 class="empty-state-title">Erreur de chargement</h3>
                <p class="empty-state-desc">Vérifiez votre connexion</p>
                <button onclick="localStorage.removeItem('pilipili_binId'); location.reload();">
                    Réessayer
                </button>
            </div>
        `;
    }

    renderAll() {
        if (!this.menuData) return;

        this.renderCategories();
        this.renderFeatured();
        this.renderMenu();
        this.renderRestaurantInfo();
    }

    renderCategories() {
        const container = document.getElementById('categoriesScroll');
        
        // On récupère toutes les catégories qui contiennent des plats (pas des boissons)
        // Pour être sûr, on prend toutes les catégories sauf celle des boissons si on a une propriété type,
        // ou alors on laisse les catégories de plats classiques.
        const categories = [...this.menuData.categories]
            .filter(cat => cat.name.toLowerCase() !== 'boissons') // On exclut "Boissons" du haut car c'est en bas
            .sort((a, b) => a.order - b.order);

        container.innerHTML = `
            <button class="category-chip active" data-filter="all">Tout</button>
            ${categories.map(cat => `
                <button class="category-chip" data-filter="category-${cat.id}">${cat.name}</button>
            `).join('')}
        `;

        container.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                
                // Activer "Accueil" dans la nav bar du bas puisqu'on navigue dans les sous-catégories
                document.querySelectorAll('.bottom-nav .nav-item').forEach(nav => {
                    nav.classList.toggle('active', nav.dataset.category === 'all');
                });
                
                this.filterMenu(chip.dataset.filter);
            });
        });
    }

    renderFeatured(expanded = false) {
        const section = document.getElementById('featuredSection');
        const container = document.getElementById('featuredScroll');
        // Exclure les boissons des plats phares (par type ET par nom de catégorie)
        const drinkCatIds = new Set(
            (this.menuData.categories || [])
                .filter(c => c.name.toLowerCase().includes('boisson') || c.name.toLowerCase().includes('drink'))
                .map(c => c.id)
        );
        const specialItems = this.allItems.filter(item =>
            item.isSpecial &&
            (item.type || 'plat') !== 'boisson' &&
            !drinkCatIds.has(item.categoryId)
        );

        if (specialItems.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        
        const maxInitial = 3;
        const toShow = expanded ? specialItems : specialItems.slice(0, maxInitial);
        
        let html = toShow.map(item => this.renderFeaturedCard(item)).join('');
        
        if (!expanded && specialItems.length > maxInitial) {
            html += `
                <button class="see-more-btn" onclick="menuApp.renderFeatured(true)">
                    Voir plus (${specialItems.length - maxInitial})
                </button>
            `;
        } else if (expanded && specialItems.length > maxInitial) {
            html += `
                <button class="see-more-btn" onclick="menuApp.renderFeatured(false)">
                    Voir moins
                </button>
            `;
        }

        container.innerHTML = html;
    }

    renderFeaturedCard(item) {
        const imageHtml = item.image 
            ? `<img src="${item.image}" alt="${item.name}" class="featured-card-image">`
            : `<div class="featured-card-no-image"></div>`;

        return `
            <div class="featured-card">
                ${imageHtml}
                <div class="featured-card-content">
                    <div class="featured-card-header">
                        <h3 class="featured-card-name">${item.name}</h3>
                        <span class="featured-card-price">${this.formatPrice(item.price)}</span>
                    </div>
                    <p class="featured-card-desc">${item.description}</p>
                </div>
            </div>
        `;
    }

    renderMenu(filter = 'all') {
        const container = document.getElementById('menuSection');
        const categories = [...this.menuData.categories].sort((a, b) => a.order - b.order);
        
        // IDs de catégories considérées comme "boissons" (par nom)
        const drinkCategoryIds = new Set(
            categories
                .filter(c => c.name.toLowerCase().includes('boisson') || c.name.toLowerCase().includes('drink'))
                .map(c => c.id)
        );
        
        // Fonction utilitaire : est-ce que cet item est une boisson ?
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
            items = items.filter(item => item.categoryId === catId && !isBoisson(item));
        } else {
            // "all" : uniquement les plats
            items = items.filter(item => !isBoisson(item));
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">0</div>
                    <h3 class="empty-state-title">${isDrinksFilter ? 'Aucune boisson' : 'Aucun plat'}</h3>
                    <p class="empty-state-desc">Essayez une autre catégorie</p>
                </div>
            `;
            return;
        }

        if (isDrinksFilter) {
            // Drinks: show flat list without category grouping
            container.innerHTML = `
                <div class="menu-category">
                    ${items.map(item => this.renderMenuCard(item)).join('')}
                </div>
            `;
        } else {
            const groupedItems = {};
            items.forEach(item => {
                if (!groupedItems[item.categoryId]) {
                    groupedItems[item.categoryId] = [];
                }
                groupedItems[item.categoryId].push(item);
            });

            container.innerHTML = categories
                .filter(cat => groupedItems[cat.id])
                .map(category => {
                    const categoryItems = groupedItems[category.id];
                    return `
                        <div class="menu-category">
                            <h2 class="category-title">${category.name}</h2>
                            ${categoryItems.map(item => this.renderMenuCard(item)).join('')}
                        </div>
                    `;
                }).join('');
        }
    }

    renderMenuCard(item) {
        const imageHtml = item.image 
            ? `<img src="${item.image}" alt="${item.name}" class="menu-card-image">`
            : `<div class="menu-card-no-image"></div>`;

        const badgeHtml = item.badge ? this.getBadgeHtml(item.badge) : '';
        const qty = this.getItemQty(item.id);

        return `
            <div class="menu-card" data-item-id="${item.id}">
                <div class="menu-card-inner">
                    ${imageHtml}
                    <div class="menu-card-info">
                        <div class="menu-card-header">
                            <h3 class="menu-card-name">${item.name}</h3>
                            <span class="menu-card-price">${this.formatPrice(item.price)}</span>
                        </div>
                        <p class="menu-card-desc">${item.description}</p>
                        ${badgeHtml ? `<div class="menu-card-badges">${badgeHtml}</div>` : ''}
                    </div>
                    <button class="select-btn ${qty > 0 ? 'selected' : ''}" onclick="menuApp.toggleSelectItem(${item.id}, event)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 5v14"></path>
                            <path d="M5 12h14"></path>
                        </svg>
                    </button>
                    ${qty > 0 ? `<div class="item-qty-badge">${qty}</div>` : ''}
                </div>
            </div>
        `;
    }

    toggleSelectItem(itemId, event) {
        event.stopPropagation();
        const qty = this.getItemQty(itemId);
        
        if (qty > 0) {
            this.removeFromSelection(itemId);
        } else {
            this.addToSelection(itemId);
        }
        
        // Animation
        const btn = event.currentTarget;
        btn.classList.add('animating');
        setTimeout(() => btn.classList.remove('animating'), 300);
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
                        <div class="info-value">${restaurant.address || 'Non renseigné'}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">...</div>
                    <div class="info-text">
                        <div class="info-label">Téléphone</div>
                        <div class="info-value">${restaurant.phone || 'Non renseigné'}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">...</div>
                    <div class="info-text">
                        <div class="info-label">Horaires</div>
                        <div class="info-value">${restaurant.hours || 'Non renseigné'}</div>
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
        
        const isFoodMenu = filter === 'all' || filter.startsWith('category-');
        
        const featuredSection = document.getElementById('featuredSection');
        const categoriesScroll = document.getElementById('categoriesScroll');
        const pageTitle = document.getElementById('pageTitle');
        
        if (isFoodMenu) {
            // Page "Plats" : on affiche les catégories et les plats phares, pas besoin de titre supplémentaire
            categoriesScroll.style.display = 'flex';
            pageTitle.style.display = 'none';
            this.renderFeatured(); 
        } else {
            // Autres pages : on cache le featured et les catégories, et on affiche un titre
            featuredSection.style.display = 'none';
            categoriesScroll.style.display = 'none';
            
            const titles = {
                'popular': '⭐ Plats phares',
                'drinks': '🍸 Nos boissons',
                'new': '✨ Nouveautés'
            };
            
            pageTitle.textContent = titles[filter] || '';
            pageTitle.style.display = titles[filter] ? 'block' : 'none';
        }

        this.renderMenu(filter);
        
        // Scroll remonter en haut quand on change de page
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
                
                // Si on est sur l'onglet boissons, chercher seulement parmi les boissons
                if (this.currentFilter === 'drinks') {
                    return matchesQuery && (item.type || 'plat') === 'boisson';
                }
                // Sinon, chercher seulement parmi les plats
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
                    <h3 class="empty-state-title">Aucun résultat</h3>
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
                    ${plats.map(item => this.renderMenuCard(item)).join('')}
                </div>
            `;
        }
        if (boissons.length > 0) {
            html += `
                <div class="menu-category">
                    <h2 class="category-title">Boissons</h2>
                    ${boissons.map(item => this.renderMenuCard(item)).join('')}
                </div>
            `;
        }
        container.innerHTML = html;
    }

    setupNavigation() {
        const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');
        
        bottomNavItems.forEach(item => {
            item.addEventListener('click', () => {
                bottomNavItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                const filter = item.dataset.category;
                this.filterMenu(filter);

                // Update category chips
                const chips = document.querySelectorAll('.category-chip');
                let foundMatch = false;
                chips.forEach(chip => {
                    if (chip.dataset.filter === filter) {
                        chip.classList.add('active');
                        foundMatch = true;
                    } else {
                        chip.classList.remove('active');
                    }
                });
                
                // If we clicked a bottom nav item (like drinks or popular) that isn't a chip,
                // and it's not "all", we don't highlight any chip.
            });
        });
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
