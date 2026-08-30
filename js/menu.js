// Menu LEET-DORIAN - Application Mobile Premium
class MenuApp {
    constructor() {
        this.binId = JSONBIN_CONFIG.binId || localStorage.getItem('pilipili_binId');
        this.menuData = null;
        this.allItems = [];
        this.currentFilter = 'all';
        localStorage.removeItem('pilipili_selection');
        this.selection = [];
        this.init();
    }

    getHeaders() {
        return {
            'X-Master-Key': JSONBIN_CONFIG.masterKey,
            'Content-Type': 'application/json'
        };
    }

    async init() {
        try {
            console.log('[MENU] binId utilisé:', this.binId);
            if (!this.binId) {
                await this.createBin();
            }
            await this.loadMenu();
            this.setupSearch();
            this.setupSelection();
            this.updateSelectionFab();
            
        } catch (error) {
            console.error('Erreur init:', error);
            this.showError();
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
        this.renderRestaurantCard();
    }

    renderRestaurantCard() {
        const section = document.getElementById('restaurantCard');
        if (!section || !this.menuData?.restaurant) return;

        const restaurant = this.menuData.restaurant;
        const hasInfo = restaurant.name || restaurant.address || restaurant.phone || restaurant.hours || restaurant.social?.whatsapp;
        if (!hasInfo) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        const nameEl = section.querySelector('.restaurant-card-name');
        if (nameEl) nameEl.textContent = restaurant.name || '';

        const addressRow = document.getElementById('restaurantAddressRow');
        const addressText = document.getElementById('restaurantAddressText');
        if (restaurant.address && addressRow && addressText) {
            addressText.textContent = restaurant.address;
            addressRow.style.display = 'inline-flex';
        } else if (addressRow) {
            addressRow.style.display = 'none';
        }

        const phoneRow = document.getElementById('restaurantPhoneRow');
        const phoneLink = document.getElementById('restaurantPhoneLink');
        if (restaurant.phone && phoneRow && phoneLink) {
            phoneLink.textContent = restaurant.phone;
            phoneLink.href = 'tel:' + restaurant.phone.replace(/[^0-9+]/g, '');
            phoneRow.style.display = 'inline-flex';
        } else if (phoneRow) {
            phoneRow.style.display = 'none';
        }

        const hoursRow = document.getElementById('restaurantHoursRow');
        const hoursText = document.getElementById('restaurantHoursText');
        if (restaurant.hours && hoursRow && hoursText) {
            hoursText.textContent = restaurant.hours;
            hoursRow.style.display = 'inline-flex';
        } else if (hoursRow) {
            hoursRow.style.display = 'none';
        }

        const whatsappRow = document.getElementById('restaurantWhatsappRow');
        const whatsappLink = document.getElementById('restaurantWhatsappLink');
        if (restaurant.social?.whatsapp && whatsappRow && whatsappLink) {
            whatsappLink.textContent = restaurant.social.whatsapp;
            whatsappLink.href = 'https://wa.me/' + restaurant.social.whatsapp.replace(/[^0-9]/g, '');
            whatsappRow.style.display = 'inline-flex';
        } else if (whatsappRow) {
            whatsappRow.style.display = 'none';
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
        document.getElementById('selectionModal').style.display = 'none';
    }

    getSelectionCount() {
        return this.selection
            .filter(s => s && typeof s.itemId !== 'undefined' && s.qty > 0)
            .reduce((sum, s) => sum + s.qty, 0);
    }

    getSelectionTotal() {
        return this.selection.reduce((sum, s) => {
            const item = this.allItems.find(i => i.id === s.itemId);
            return sum + (item ? item.price * s.qty : 0);
        }, 0);
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

        const validSelection = this.selection.filter(s => s && typeof s.itemId !== 'undefined' && s.qty > 0);
        
        body.innerHTML = validSelection.map(s => {
            const item = this.allItems.find(i => i.id === s.itemId);
            if (!item) return '';
            
            const isChambre = (item.type || 'chambre') === 'chambre';
            let unitLabel;
            if (isChambre) {
                unitLabel = s.qty > 1 ? 'chambres' : 'chambre';
            } else if ((item.type || '') === 'boisson') {
                unitLabel = s.qty > 1 ? 'boissons' : 'boisson';
            } else {
                unitLabel = s.qty > 1 ? 'plats' : 'plat';
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

    getItemQty(itemId) {
        const found = this.selection.find(s => s.itemId === itemId);
        return found ? found.qty : 0;
    }

    updateSelectionFab() {
        const fab = document.getElementById('selectionFab');
        const count = document.getElementById('selectionCount');
        const total = this.getSelectionCount();
        
        if (fab) fab.style.display = total > 0 ? 'flex' : 'none';
        if (count) count.textContent = total;
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
        if (!fab) return;
        fab.addEventListener('click', () => {
            this.renderSelectionModal();
            const modal = document.getElementById('selectionModal');
            modal.style.display = 'flex';
            modal.offsetHeight;
            modal.classList.add('open');
        });
    }

    applyCustomLogo() {
        const localLogo = localStorage.getItem('leetdorian_logo');
        const logoData = localLogo ? JSON.parse(localLogo) : (this.menuData.settings?.logo);
        if (!logoData?.svg) return;

        const logoImg = document.getElementById('headerLogo');
        const container = document.getElementById('headerLogoContainer');
        if (!logoImg || !container) return;

        const blob = new Blob([logoData.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        logoImg.src = url;
        logoImg.style.display = 'block';
        container.style.display = 'flex';

        logoImg.onload = () => URL.revokeObjectURL(url);
    }

    filterPublicNav(filter) {
        document.querySelectorAll('.public-nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        if (filter === 'hotel') {
            this.renderMenu('hotel');
        } else if (filter === 'restaurant') {
            this.renderMenu('restaurant');
        } else if (filter === 'drinks') {
            this.renderMenu('drinks');
        } else {
            this.renderMenu('all');
        }
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
        this.renderMenu();
    }

    async renderMenu(filter = 'hotel') {
        const container = document.getElementById('menuSection');
        
        if (this.menuData) {
            container.innerHTML = `
                <div class="loading" style="display:flex;align-items:center;justify-content:center;padding:40px 0;">
                    <div class="loading-spinner" style="width:28px;height:28px;border:3px solid #eee;border-top-color:#5E7057;border-radius:50%;animation:spin 0.8s linear infinite"></div>
                </div>
            `;
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const isChambre = item => (item.type || '') === 'chambre';
        const isBoisson = item => (item.type || '') === 'boisson';
        const isRestaurant = item => !isChambre(item) && !isBoisson(item);
        
        let items = this.allItems;
        let sectionLabel = '';
        let isDrinksFilter = false;
        
        if (filter === 'hotel') {
            items = items.filter(item => isChambre(item)).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            sectionLabel = 'Chambres';
        } else if (filter === 'restaurant') {
            items = items.filter(item => isRestaurant(item)).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            sectionLabel = 'Restaurant';
            isDrinksFilter = true;
        } else if (filter === 'drinks') {
            items = items.filter(item => isBoisson(item)).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            isDrinksFilter = true;
        } else {
            items = items.filter(item => isChambre(item)).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            sectionLabel = 'Chambres';
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">0</div>
                    <h3 class="empty-state-title">${isDrinksFilter ? (filter === 'restaurant' ? 'Aucun plat' : 'Aucune boisson') : 'Aucun résultat'}</h3>
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
        } else if (filter === 'hotel') {
            container.innerHTML = `
                <div class="menu-grid">
                    ${items.map(item => this.renderMenuCard(item)).join('')}
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="menu-grid">
                    ${items.map(item => this.renderMenuCard(item)).join('')}
                </div>
            `;
        }
    }

    renderMenuCard(item) {
        const imageHtml = item.image 
            ? `<img src="${item.image}" alt="${item.name}" class="menu-card-image" loading="lazy">`
            : `<div class="menu-card-no-image"></div>`;

        const isChambre = (item.type || 'chambre') === 'chambre';
        const qty = this.getItemQty(item.id);
        const descIcon = (!isChambre && item.description) ? `<svg class="menu-card-desc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>` : '';

        return `
            <div class="menu-card" data-item-id="${item.id}">
                ${imageHtml}
                <div class="menu-card-body">
                    <h3 class="menu-card-name">${item.name}</h3>
                    <div class="menu-card-footer">
                        <span class="menu-card-price">${this.formatPrice(item.price)}</span>
                        <button class="select-btn ${qty > 0 ? 'selected' : ''}" onclick="menuApp.toggleSelectItem(${item.id}, event)" aria-label="Ajouter au panier">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 5v14"></path>
                                <path d="M5 12h14"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="item-qty-badge" style="display: ${qty > 0 ? 'flex' : 'none'}">${qty}</div>
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
                    return matchesQuery && (item.type || 'chambre') === 'petit_dejeuner';
                }
                return matchesQuery && (item.type || 'chambre') !== 'petit_dejeuner';
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
        if (chambres.length > 0) {
            html += `
                <div class="menu-category">
                    <h2 class="category-title">Chambres</h2>
                    <div class="menu-grid">
                        ${chambres.map(item => this.renderMenuCard(item)).join('')}
                    </div>
                </div>
            `;
        }
        if (petitsDejeuners.length > 0) {
            html += `
                <div class="menu-category">
                    <h2 class="category-title">Petits-déjeuners</h2>
                    <div class="drinks-grid">
                        ${petitsDejeuners.map(item => this.renderMenuCard(item)).join('')}
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }

}

// ==================== FONCTIONS GLOBALES ====================

let menuApp;

function closeSelectionModal() {
    document.getElementById('selectionModal').style.display = 'none';
}

function handleSelectionModalClick(event) {
    const modal = document.getElementById('selectionModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

function clearSelection() {
    if (menuApp) {
        menuApp.clearSelection();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    menuApp = new MenuApp();
    document.getElementById('selectionModal').addEventListener('click', handleSelectionModalClick);
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
    document.querySelector('.pwa-desc').textContent = 'Touchez le bouton Partager, puis sélectionnez « Sur l\'écran d\'accueil »';
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

