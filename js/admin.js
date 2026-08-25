// Admin Pili-Pili Lounge - Version Premium
class AdminApp {
    constructor() {
        // Priorité : binId hardcodé dans config.js, sinon localStorage
        this.binId = JSONBIN_CONFIG.binId || localStorage.getItem('pilipili_binId');
        // Synchroniser le localStorage avec le binId utilisé
        if (this.binId) localStorage.setItem('pilipili_binId', this.binId);
        this.menuData = null;
        this.currentSection = 'items';
        this.photoData = null;
        this.init();
    }

    async init() {
        if (!this.binId) {
            window.location.href = '../index.html';
            return;
        }
        
        await this.loadMenu();
        this.setupNavigation();
        this.setupForms();
    }

    getHeaders() {
        return {
            'X-Master-Key': JSONBIN_CONFIG.masterKey,
            'Content-Type': 'application/json'
        };
    }

    async loadMenu() {
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}/latest`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const result = await response.json();
                this.menuData = result.record;
                this.renderCurrentSection();
            } else {
                throw new Error('Erreur de chargement');
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
            alert('Erreur de chargement. Rafraîchissez la page.');
        }
    }

    async saveMenu() {
        try {
            this.menuData.lastUpdate = new Date().toISOString();
            
            const response = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(this.menuData)
            });

            if (response.ok) {
                return true;
            } else {
                throw new Error('Erreur de sauvegarde');
            }
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            alert('Erreur de sauvegarde.');
            return false;
        }
    }

    setupNavigation() {
        const bottomNavItems = document.querySelectorAll('.admin-nav-item');
        
        bottomNavItems.forEach(btn => {
            btn.addEventListener('click', () => {
                bottomNavItems.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSection = btn.dataset.section;
                this.renderCurrentSection();
            });
        });
    }

    renderCurrentSection() {
        document.querySelectorAll('.admin-section').forEach(section => {
            section.style.display = 'none';
        });
        
        const section = document.getElementById(`${this.currentSection}Section`);
        if (section) section.style.display = 'block';
        
        switch (this.currentSection) {
            case 'items': this.renderItems('plat', 'itemsList'); break;
            case 'drinks': this.renderItems('boisson', 'drinksList'); break;
            case 'categories': this.renderCategories(); break;
            case 'restaurant': this.renderRestaurant(); break;
        }
    }

    // ==================== PLATS ====================
    
    renderItems(itemType = 'plat', containerId = 'itemsList') {
        const itemsList = document.getElementById(containerId);
        const categories = this.menuData.categories || [];
        const displayMode = localStorage.getItem('admin_display_mode') || 'grid';
        
        document.querySelectorAll('.display-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.display === displayMode);
        });
        
        if (displayMode === 'list') {
            itemsList.classList.add('admin-list-view');
        } else {
            itemsList.classList.remove('admin-list-view');
        }
        
        const itemsToRender = (this.menuData.items || []).filter(i => (i.type || 'plat') === itemType);
        
        if (itemsToRender.length === 0) {
            itemsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">+</div>
                    <h3 class="empty-state-title">Aucun ${itemType === 'plat' ? 'plat' : 'boisson'}</h3>
                    <p class="empty-state-desc">Ajoutez votre premi${itemType === 'plat' ? 'er plat' : 'ère boisson'}</p>
                </div>
            `;
            return;
        }

        itemsList.innerHTML = itemsToRender.map(item => {
            const category = categories.find(c => c.id === item.categoryId);
            const badgeHtml = item.badge ? this.getBadgeHtml(item.badge) : '';
            const imageHtml = item.image 
                ? `<img src="${item.image}" alt="${item.name}" class="item-image">`
                : `<div class="item-image-placeholder"></div>`;

            const categoryTag = (itemType === 'plat' && category)
                ? `<span class="item-category">${category.name}</span>`
                : '';

            return `
                <div class="item-card ${item.isActive ? '' : 'inactive'}">
                    ${imageHtml}
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-description">${item.description}</div>
                        <div class="item-meta">
                            <span class="item-price">${this.formatPrice(item.price)}</span>
                            ${categoryTag}
                            ${badgeHtml}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn toggle-btn ${item.isActive ? '' : 'inactive'}" 
                                onclick="adminApp.toggleItem(${item.id})">
                            ${item.isActive ? '👁' : '—'}
                        </button>
                        <button class="action-btn edit-btn" onclick="adminApp.editItem(${item.id})">
                            ✎
                        </button>
                        <button class="action-btn delete-btn-small" onclick="adminApp.confirmDeleteItem(${item.id})">
                            ×
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showItemForm(itemId = null, defaultType = 'plat') {
        const modal = document.getElementById('itemModal');
        const title = document.getElementById('itemModalTitle');
        const form = document.getElementById('itemForm');
        const photoPreview = document.getElementById('photoPreview');
        
        // Remplir les catégories
        const categorySelect = document.getElementById('itemCategory');
        categorySelect.innerHTML = this.menuData.categories
            .sort((a, b) => a.order - b.order)
            .map(cat => `<option value="${cat.id}">${cat.name}</option>`)
            .join('');
        
        // Reset photo
        this.photoData = null;
        photoPreview.innerHTML = '<span class="photo-preview-placeholder">Ajouter</span>';
        document.getElementById('photoFile').value = '';
        
        const actualType = itemId ? (this.menuData.items.find(i => i.id === itemId)?.type || 'plat') : defaultType;
        const isBoisson = actualType === 'boisson';
        
        // Adapter les libellés
        document.getElementById('photoUploadLabel').textContent = isBoisson ? 'Photo de la boisson' : 'Photo du plat';
        document.getElementById('itemSpecialLabel').textContent = isBoisson ? 'Boisson phare' : 'Plat phare';
        
        // Masquer/afficher les champs non pertinents pour les boissons
        document.getElementById('itemCategoryGroup').style.display = isBoisson ? 'none' : '';
        document.getElementById('itemSpecialGroup').style.display = isBoisson ? 'none' : '';
        document.getElementById('itemActiveGroup').style.display = isBoisson ? 'none' : '';

        if (itemId) {
            const item = this.menuData.items.find(i => i.id === itemId);
            if (!item) return;
            
            title.textContent = actualType === 'boisson' ? 'Modifier la boisson' : 'Modifier le plat';
            document.getElementById('itemId').value = item.id;
            document.getElementById('itemType').value = actualType;
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemDescription').value = item.description;
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemCategory').value = item.categoryId;
            document.getElementById('itemImage').value = item.image || '';
            document.getElementById('itemBadge').value = item.badge || '';
            document.getElementById('itemSpecial').checked = item.isSpecial;
            document.getElementById('itemActive').checked = item.isActive;
            
            if (item.image) {
                this.photoData = item.image;
                photoPreview.innerHTML = `<img src="${item.image}" alt="${item.name}">`;
            }
        } else {
            title.textContent = actualType === 'boisson' ? 'Ajouter une boisson' : 'Ajouter un plat';
            form.reset();
            document.getElementById('itemId').value = '';
            document.getElementById('itemType').value = actualType;
            document.getElementById('itemActive').checked = true;
        }
        
        modal.style.display = 'flex';
    }

    closeItemModal() {
        document.getElementById('itemModal').style.display = 'none';
    }

    async saveItem(e) {
        e.preventDefault();
        
        const itemId = document.getElementById('itemId').value;
        const imageUrl = document.getElementById('itemImage').value.trim();
        
        const itemData = {
            name: document.getElementById('itemName').value.trim(),
            description: document.getElementById('itemDescription').value.trim(),
            price: parseInt(document.getElementById('itemPrice').value),
            categoryId: parseInt(document.getElementById('itemCategory').value),
            type: document.getElementById('itemType').value || 'plat',
            image: this.photoData || imageUrl || '',
            badge: document.getElementById('itemBadge').value || null,
            isSpecial: document.getElementById('itemSpecial').checked,
            isActive: document.getElementById('itemActive').checked
        };
        
        if (itemId) {
            const index = this.menuData.items.findIndex(i => i.id === parseInt(itemId));
            if (index !== -1) {
                this.menuData.items[index] = { ...this.menuData.items[index], ...itemData };
            }
        } else {
            const newId = this.menuData.items.length > 0 
                ? Math.max(...this.menuData.items.map(i => i.id)) + 1 
                : 1;
            this.menuData.items.push({ id: newId, ...itemData });
        }
        
        if (await this.saveMenu()) {
            this.closeItemModal();
            this.renderCurrentSection();
        }
    }

    editItem(itemId) {
        this.showItemForm(itemId);
    }

    async toggleItem(itemId) {
        const item = this.menuData.items.find(i => i.id === itemId);
        if (item) {
            item.isActive = !item.isActive;
            if (await this.saveMenu()) {
                this.renderCurrentSection();
            }
        }
    }

    confirmDeleteItem(itemId) {
        const item = this.menuData.items.find(i => i.id === itemId);
        if (!item) return;
        
        document.getElementById('confirmTitle').textContent = 'Supprimer';
        document.getElementById('confirmMessage').textContent = `Supprimer "${item.name}" ?`;
        document.getElementById('confirmBtn').onclick = () => this.deleteItem(itemId);
        document.getElementById('confirmModal').style.display = 'flex';
    }

    async deleteItem(itemId) {
        this.menuData.items = this.menuData.items.filter(i => i.id !== itemId);
        if (await this.saveMenu()) {
            this.closeConfirmModal();
            this.renderCurrentSection();
        }
    }

    // ==================== CATÉGORIES ====================
    
    renderCategories() {
        const categoriesList = document.getElementById('categoriesList');
        const categories = [...(this.menuData.categories || [])].sort((a, b) => a.order - b.order);
        
        if (categories.length === 0) {
            categoriesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">+</div>
                    <h3 class="empty-state-title">Aucune catégorie</h3>
                </div>
            `;
            return;
        }

        categoriesList.innerHTML = categories.map(category => {
            const itemCount = this.menuData.items.filter(i => i.categoryId === category.id).length;
            const unit = category.unit || 'plat';
            
            return `
                <div class="category-card">
                    <div class="category-order">${category.order}</div>
                    <div class="category-name">${category.name}</div>
                    <span class="item-count">${itemCount} ${unit}${itemCount > 1 ? 's' : ''}</span>
                    <div class="category-actions">
                        <button class="action-btn edit-btn" onclick="adminApp.editCategory(${category.id})">✎</button>
                        <button class="action-btn delete-btn-small" onclick="adminApp.confirmDeleteCategory(${category.id})">×</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showCategoryForm(categoryId = null) {
        const modal = document.getElementById('categoryModal');
        const title = document.getElementById('categoryModalTitle');
        const form = document.getElementById('categoryForm');
        
        if (categoryId) {
            const category = this.menuData.categories.find(c => c.id === categoryId);
            if (!category) return;
            
            title.textContent = 'Modifier';
            document.getElementById('categoryId').value = category.id;
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryOrder').value = category.order;
            document.getElementById('categoryUnit').value = category.unit || 'plat';
        } else {
            title.textContent = 'Ajouter';
            form.reset();
            document.getElementById('categoryId').value = '';
            document.getElementById('categoryUnit').value = 'plat';
            
            const maxOrder = this.menuData.categories.length > 0
                ? Math.max(...this.menuData.categories.map(c => c.order))
                : 0;
            document.getElementById('categoryOrder').value = maxOrder + 1;
        }
        
        modal.style.display = 'flex';
    }

    closeCategoryModal() {
        document.getElementById('categoryModal').style.display = 'none';
    }

    async saveCategory(e) {
        e.preventDefault();
        
        const categoryId = document.getElementById('categoryId').value;
        const categoryData = {
            name: document.getElementById('categoryName').value.trim(),
            order: parseInt(document.getElementById('categoryOrder').value),
            unit: document.getElementById('categoryUnit').value
        };
        
        if (categoryId) {
            const index = this.menuData.categories.findIndex(c => c.id === parseInt(categoryId));
            if (index !== -1) {
                this.menuData.categories[index] = { ...this.menuData.categories[index], ...categoryData };
            }
        } else {
            const newId = this.menuData.categories.length > 0
                ? Math.max(...this.menuData.categories.map(c => c.id)) + 1
                : 1;
            this.menuData.categories.push({ id: newId, ...categoryData });
        }
        
        if (await this.saveMenu()) {
            this.closeCategoryModal();
            this.renderCategories();
        }
    }

    editCategory(categoryId) {
        this.showCategoryForm(categoryId);
    }

    confirmDeleteCategory(categoryId) {
        const category = this.menuData.categories.find(c => c.id === categoryId);
        if (!category) return;
        
        const itemCount = this.menuData.items.filter(i => i.categoryId === categoryId).length;
        
        document.getElementById('confirmTitle').textContent = 'Supprimer';
        document.getElementById('confirmMessage').textContent = itemCount > 0
            ? `La catégorie "${category.name}" contient ${itemCount} élément(s). Tout sera supprimé.`
            : `Supprimer "${category.name}" ?`;
        document.getElementById('confirmBtn').onclick = () => this.deleteCategory(categoryId);
        document.getElementById('confirmModal').style.display = 'flex';
    }

    async deleteCategory(categoryId) {
        this.menuData.items = this.menuData.items.filter(i => i.categoryId !== categoryId);
        this.menuData.categories = this.menuData.categories.filter(c => c.id !== categoryId);
        
        if (await this.saveMenu()) {
            this.closeConfirmModal();
            this.renderCategories();
        }
    }

    // ==================== RESTAURANT ====================
    
    renderRestaurant() {
        if (!this.menuData.restaurant) {
            this.menuData.restaurant = {
                name: 'Pili-Pili Lounge',
                address: '',
                phone: '',
                hours: '',
                social: {}
            };
        }

        if (!this.menuData.settings) {
            this.menuData.settings = {};
        }

        const { restaurant } = this.menuData;
        
        document.getElementById('restaurantName').value = restaurant.name || '';
        document.getElementById('restaurantAddress').value = restaurant.address || '';
        document.getElementById('restaurantPhone').value = restaurant.phone || '';
        document.getElementById('restaurantHours').value = restaurant.hours || '';
        document.getElementById('facebook').value = restaurant.social?.facebook || '';
        document.getElementById('instagram').value = restaurant.social?.instagram || '';
        document.getElementById('whatsapp').value = restaurant.social?.whatsapp || '';
    }

    async setDisplayMode(mode) {
        localStorage.setItem('admin_display_mode', mode);
        
        document.querySelectorAll('.display-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.display === mode);
        });

        // Apply to the currently visible list
        const listId = this.currentSection === 'drinks' ? 'drinksList' : 'itemsList';
        const itemsList = document.getElementById(listId);
        if (itemsList) {
            if (mode === 'list') {
                itemsList.classList.add('admin-list-view');
            } else {
                itemsList.classList.remove('admin-list-view');
            }
        }
    }

    async saveRestaurant(e) {
        e.preventDefault();
        
        this.menuData.restaurant = {
            name: document.getElementById('restaurantName').value.trim(),
            address: document.getElementById('restaurantAddress').value.trim(),
            phone: document.getElementById('restaurantPhone').value.trim(),
            hours: document.getElementById('restaurantHours').value.trim(),
            social: {
                facebook: document.getElementById('facebook').value.trim(),
                instagram: document.getElementById('instagram').value.trim(),
                whatsapp: document.getElementById('whatsapp').value.trim()
            }
        };
        
        if (await this.saveMenu()) {
            alert('Enregistré !');
        }
    }

    // ==================== UTILITAIRES ====================
    
    setupForms() {
        document.getElementById('itemForm').addEventListener('submit', (e) => this.saveItem(e));
        document.getElementById('categoryForm').addEventListener('submit', (e) => this.saveCategory(e));
        document.getElementById('restaurantForm').addEventListener('submit', (e) => this.saveRestaurant(e));
    }

    getBadgeHtml(badge) {
        const badges = {
            popular: { class: 'badge-popular', text: 'Populaire' },
            new: { class: 'badge-new', text: 'Nouveau' }
        };

        const badgeInfo = badges[badge];
        if (!badgeInfo) return '';

        return `<span class="item-badge ${badgeInfo.class}">${badgeInfo.text}</span>`;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
    }
}

// ==================== GESTION PHOTO ====================

const IMGBB_API_KEY = '6846ca547890f0d20ff9a621708f4a1b';

async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert('Image trop grande. Maximum 10 Mo.');
        return;
    }

    const preview = document.getElementById('photoPreview');
    preview.innerHTML = '<span class="photo-preview-placeholder">Compression...</span>';

    try {
        const compressedBlob = await compressImage(file);
        const base64 = await blobToBase64(compressedBlob);

        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', base64);
        formData.append('quality', '80');

        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            adminApp.photoData = result.data.url;
            preview.innerHTML = '<img src="' + result.data.url + '" alt="Apercu">';
            document.getElementById('itemImage').value = result.data.url;
        } else {
            throw new Error('Erreur upload');
        }
    } catch (error) {
        console.error('Erreur upload:', error);
        preview.innerHTML = '<span class="photo-preview-placeholder">Erreur</span>';
        alert('Erreur lors de l\'upload. Essayez une URL directe.');
    }
}

function compressImage(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');

                var width = img.width;
                var height = img.height;

                var maxSize = 800;

                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    } else {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(function(blob) {
                    resolve(blob);
                }, 'image/jpeg', 0.85);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function blobToBase64(blob) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() {
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function previewImageUrl(event) {
    var url = event.target.value.trim();
    if (url) {
        adminApp.photoData = url;
        var preview = document.getElementById('photoPreview');
        preview.innerHTML = '<img src="' + url + '" alt="Apercu" onerror="this.parentElement.innerHTML=\'<span class=\\\'photo-preview-placeholder\\\'>Erreur</span>\'">';
    }
}

// ==================== FONCTIONS GLOBALES ====================

function showItemForm(itemId = null, type = 'plat') {
    adminApp.showItemForm(itemId, type);
}

function closeItemModal() {
    adminApp.closeItemModal();
}

function showCategoryForm(categoryId = null) {
    adminApp.showCategoryForm(categoryId);
}

function closeCategoryModal() {
    adminApp.closeCategoryModal();
}

function closeConfirmModal() {
    adminApp.closeConfirmModal();
}

function logout() {
    sessionStorage.removeItem('pilipili_admin');
    window.location.href = 'index.html';
}

// Initialisation
let adminApp;
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminApp();
});
