// Admin LEET-DORIAN - Version Premium
class AdminApp {
    constructor() {
        this.binId = JSONBIN_CONFIG.binId || localStorage.getItem('pilipili_binId');
        this.menuData = null;
        this.currentSection = 'items';
        this.photoData = null;
        this.init();
    }

    async init() {
        if (!this.binId) {
            await this.createBin();
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

    async createBin() {
        const defaultData = {
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
                { id: 1, name: 'Standard', order: 1, unit: 'chambre', sector: 'hotel' },
                { id: 2, name: 'VIP', order: 2, unit: 'chambre', sector: 'hotel' },
                { id: 3, name: 'Petit-déjeuner', order: 3, unit: 'petit_dejeuner', sector: 'restaurant' },
                { id: 4, name: 'Plats & Desserts', order: 4, unit: 'plat', sector: 'restaurant' },
                { id: 5, name: 'Boissons', order: 5, unit: 'boisson', sector: 'drinks' }
            ],
            items: [
                { id: 1, name: "Chambre Standard - Vue Jardin", description: "Chambre confortable avec vue sur le jardin", price: 25000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", badge: "new", isActive: true, capacity: "2", area: "20 m²", bedType: "Lit double", equipment: "WiFi, TV, Climatisation" },
                { id: 2, name: "Chambre Standard - Vue Cour", description: "Chambre calme avec vue sur la cour intérieure", price: 22000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80", badge: null, isActive: true, capacity: "2", area: "18 m²", bedType: "Lit double", equipment: "WiFi, TV" },
                { id: 3, name: "Chambre Standard - Familiale", description: "Chambre spacieuse pour famille", price: 30000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80", badge: "popular", isActive: true, capacity: "3", area: "25 m²", bedType: "Lit double + lit simple", equipment: "WiFi, TV, Climatisation, Salle de bain privative" },
                { id: 4, name: "Chambre Standard - Économique", description: "Chambre fonctionnelle et économique", price: 18000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80", badge: null, isActive: true, capacity: "2", area: "15 m²", bedType: "Lit double", equipment: "WiFi" },
                { id: 5, name: "Chambre Standard - Supérieure", description: "Chambre avec petit-déjeuner inclus", price: 35000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", badge: "popular", isActive: true, capacity: "2", area: "22 m²", bedType: "Lit double King", equipment: "WiFi, TV, Climatisation, Minibar" },
                { id: 6, name: "Chambre VIP - Suite Présidentielle", description: "Suite luxueuse avec vue panoramique", price: 120000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80", badge: "new", isActive: true, capacity: "2", area: "45 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Minibar, Jacuzzi, Service 24h/24" },
                { id: 7, name: "Chambre VIP - Suite Exécutive", description: "Suite moderne pour voyageurs d'affaires", price: 85000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80", badge: null, isActive: true, capacity: "2", area: "35 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Bureau, Minibar" },
                { id: 8, name: "Chambre VIP - Suite Deluxe", description: "Suite élégante avec terrasse privée", price: 95000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", badge: "popular", isActive: true, capacity: "2", area: "40 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Minibar, Terrasse" },
                { id: 9, name: "Chambre VIP - Suite Romance", description: "Suite romantique avec décoration spéciale", price: 110000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80", badge: null, isActive: true, capacity: "2", area: "38 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Minibar, Décoration romantique" },
                { id: 10, name: "Chambre VIP - Suite Famille", description: "Suite spacieuse pour familles", price: 130000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80", badge: "new", isActive: true, capacity: "4", area: "50 m²", bedType: "Lit King + lits simples", equipment: "WiFi, TV, Climatisation, Minibar, Salon séparé" }
            ],
            lastUpdate: new Date().toISOString()
        };

        console.log('[ADMIN] Création d\'un nouveau bin...');
        const response = await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(defaultData)
        });

        console.log('[ADMIN] Réponse création bin:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[ADMIN] Erreur création bin:', response.status, errorText);
            throw new Error(`Erreur creation bin: ${response.status}`);
        }

        const result = await response.json();
        this.binId = result.metadata?.id;
        
        console.log('[ADMIN] Bin créé, ID:', this.binId);
        
        if (!this.binId) {
            throw new Error('ID du bin non trouve');
        }
    }

    async loadMenu() {
        try {
            console.log('[ADMIN] Chargement du menu, binId:', this.binId);
            const response = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}/latest`, {
                headers: this.getHeaders()
            });

            console.log('[ADMIN] Réponse chargement:', response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                this.menuData = result.record;
                console.log('[ADMIN] Menu chargé, nombre d\'items:', this.menuData.items?.length);
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
            
            console.log('[ADMIN] Sauvegarde du menu, binId:', this.binId);
            console.log('[ADMIN] Données à sauvegarder:', JSON.stringify(this.menuData).substring(0, 200));
            
            const response = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(this.menuData)
            });

            console.log('[ADMIN] Réponse sauvegarde:', response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                console.log('[ADMIN] Sauvegarde réussie:', result);
                return true;
            } else {
                const errorText = await response.text();
                console.error('[ADMIN] Erreur sauvegarde:', response.status, errorText);
                throw new Error(`Erreur de sauvegarde: ${response.status}`);
            }
        } catch (error) {
            console.error('[ADMIN] Erreur sauvegarde:', error);
            alert(`Erreur de sauvegarde: ${error.message}`);
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
            case 'items': this.renderItems('chambre', 'itemsList'); break;
            case 'food': this.renderItems('nourriture', 'foodList'); break;
            case 'drinks': this.renderItems('boisson', 'drinksList'); break;
            case 'categories': this.renderCategories(); break;
            case 'restaurant': this.renderRestaurant(); break;
            case 'logo': break;
        }
    }

    showToast(message) {
        const toast = document.getElementById('adminToast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 2500);
    }

    // ==================== CHAMBRES / PETITS-DÉJEUNERS ====================
    
    renderItems(itemType = 'chambre', containerId = 'itemsList') {
        const itemsList = document.getElementById(containerId);
        const categories = this.menuData.categories || [];
        const displayMode = localStorage.getItem('admin_display_mode') || 'list';
        
        document.querySelectorAll('.display-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.display === displayMode);
        });
        
        if (displayMode === 'list') {
            itemsList.classList.add('admin-list-view');
        } else {
            itemsList.classList.remove('admin-list-view');
        }
        
        const itemsToRender = (this.menuData.items || []).filter(i => (i.type || 'chambre') === itemType);
        
        if (itemsToRender.length === 0) {
            itemsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">+</div>
                    <h3 class="empty-state-title">Aucun ${itemType === 'chambre' ? 'chambre' : 'petit-déjeuner'}</h3>
                    <p class="empty-state-desc">Ajoutez votre premi${itemType === 'chambre' ? 'ère chambre' : 'er petit-déjeuner'}</p>
                </div>
            `;
            return;
        }

        itemsList.innerHTML = itemsToRender.map(item => {
            const category = categories.find(c => c.id === item.categoryId);
            const badgeHtml = '';
            const imageHtml = item.image 
                ? `<img src="${item.image}" alt="${item.name}" class="item-image">`
                : `<div class="item-image-placeholder"></div>`;

            const categoryTag = (itemType === 'chambre' && category)
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

    showItemForm(itemId = null, defaultType = 'chambre') {
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
        
        const actualType = itemId ? (this.menuData.items.find(i => i.id === itemId)?.type || 'chambre') : defaultType;
        const isChambre = actualType === 'chambre';
        const isBoisson = actualType === 'boisson';
        
        // Adapter les libellés
        document.getElementById('photoUploadLabel').textContent = isChambre ? 'Photo de la chambre' : (isBoisson ? 'Photo de la boisson' : 'Photo du plat');
        
        // Masquer/afficher les champs non pertinents
        document.getElementById('itemCategoryGroup').style.display = isBoisson ? 'none' : '';
        document.getElementById('itemDescriptionGroup').style.display = isBoisson ? 'none' : '';
        document.getElementById('itemBadgeGroup').style.display = isChambre ? 'none' : '';
        


        if (itemId) {
            const item = this.menuData.items.find(i => i.id === itemId);
            if (!item) return;
            
            title.textContent = actualType === 'petit_dejeuner' ? 'Modifier le petit-déjeuner' : 'Modifier la chambre';
            document.getElementById('itemId').value = item.id;
            document.getElementById('itemType').value = actualType;
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemDescription').value = item.description;
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemCategory').value = item.categoryId;
            document.getElementById('itemBadge').value = item.badge || '';
            
            if (item.image) {
                this.photoData = item.image;
                photoPreview.innerHTML = `<img src="${item.image}" alt="${item.name}">`;
            }
            
            document.getElementById('itemCapacity').value = item.capacity || '';
            document.getElementById('itemArea').value = item.area || '';
            document.getElementById('itemBedType').value = item.bedType || '';
            document.getElementById('itemEquipment').value = item.equipment || '';
        } else {
            title.textContent = actualType === 'chambre' ? 'Ajouter une chambre' : (actualType === 'boisson' ? 'Ajouter une boisson' : 'Ajouter un plat');
            form.reset();
            document.getElementById('itemId').value = '';
            document.getElementById('itemType').value = actualType;
            document.getElementById('itemCapacity').value = '';
            document.getElementById('itemArea').value = '';
            document.getElementById('itemBedType').value = '';
            document.getElementById('itemEquipment').value = '';
        }
        
        modal.style.display = 'flex';
    }

    closeItemModal() {
        document.getElementById('itemModal').style.display = 'none';
    }

    async saveItem(e) {
        e.preventDefault();
        
        const itemId = document.getElementById('itemId').value;
        
        const itemData = {
            name: document.getElementById('itemName').value.trim(),
            description: document.getElementById('itemDescription').value.trim(),
            price: parseInt(document.getElementById('itemPrice').value),
            categoryId: parseInt(document.getElementById('itemCategory').value),
            type: document.getElementById('itemType').value || 'chambre',
            image: this.photoData || '',
            
            isActive: true
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
            this.showToast('Enregistrement réussi');
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
            const unit = category.unit || 'chambre';
            
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
            document.getElementById('categoryUnit').value = category.unit || 'chambre';
        } else {
            title.textContent = 'Ajouter';
            form.reset();
            document.getElementById('categoryId').value = '';
            document.getElementById('categoryUnit').value = 'chambre';
            
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
            const unit = category.unit || 'chambre';
            
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
            document.getElementById('categoryUnit').value = category.unit || 'chambre';
        } else {
            title.textContent = 'Ajouter';
            form.reset();
            document.getElementById('categoryId').value = '';
            document.getElementById('categoryUnit').value = 'chambre';
            
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

    // ==================== HÔTEL ====================
    
    renderRestaurant() {
        if (!this.menuData.restaurant) {
            this.menuData.restaurant = {
                name: 'LEET-DORIAN',
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
        document.getElementById('restaurantInfoVisible').checked = this.menuData.settings.restaurantInfoVisible !== false;
    }

    async setDisplayMode(mode) {
        localStorage.setItem('admin_display_mode', mode);
        
        document.querySelectorAll('.display-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.display === mode);
        });

        // Apply to the currently visible list
        const listId = this.currentSection === 'drinks' ? 'drinksList' : (this.currentSection === 'food' ? 'foodList' : 'itemsList');
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
        
        this.menuData.settings = this.menuData.settings || {};
        this.menuData.settings.restaurantInfoVisible = document.getElementById('restaurantInfoVisible').checked;
        
        if (await this.saveMenu()) {
            alert('Enregistré !');
        }
    }


    async addDemoHotelContent() {
        if (!confirm('Ajouter 10 chambres de démo au contenu existant ?')) return;
        const demoRooms = [
            { id: 101, name: "Chambre Standard - Vue Jardin", description: "Chambre confortable avec vue sur le jardin", price: 25000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", badge: "new", isActive: true, capacity: "2", area: "20 m²", bedType: "Lit double", equipment: "WiFi, TV, Climatisation" },
            { id: 102, name: "Chambre Standard - Vue Cour", description: "Chambre calme avec vue sur la cour intérieure", price: 22000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80", badge: null, isActive: true, capacity: "2", area: "18 m²", bedType: "Lit double", equipment: "WiFi, TV" },
            { id: 103, name: "Chambre Standard - Familiale", description: "Chambre spacieuse pour famille", price: 30000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80", badge: "popular", isActive: true, capacity: "3", area: "25 m²", bedType: "Lit double + lit simple", equipment: "WiFi, TV, Climatisation, Salle de bain privative" },
            { id: 104, name: "Chambre Standard - Économique", description: "Chambre fonctionnelle et économique", price: 18000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80", badge: null, isActive: true, capacity: "2", area: "15 m²", bedType: "Lit double", equipment: "WiFi" },
            { id: 105, name: "Chambre Standard - Supérieure", description: "Chambre avec petit-déjeuner inclus", price: 35000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", badge: "popular", isActive: true, capacity: "2", area: "22 m²", bedType: "Lit double King", equipment: "WiFi, TV, Climatisation, Minibar" },
            { id: 201, name: "Chambre VIP - Suite Présidentielle", description: "Suite luxueuse avec vue panoramique", price: 120000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80", badge: "new", isActive: true, capacity: "2", area: "45 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Minibar, Jacuzzi, Service 24h/24" },
            { id: 202, name: "Chambre VIP - Suite Exécutive", description: "Suite moderne pour voyageurs d'affaires", price: 85000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80", badge: null, isActive: true, capacity: "2", area: "35 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Bureau, Minibar" },
            { id: 203, name: "Chambre VIP - Suite Deluxe", description: "Suite élégante avec terrasse privée", price: 95000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", badge: "popular", isActive: true, capacity: "2", area: "40 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Minibar, Terrasse" },
            { id: 204, name: "Chambre VIP - Suite Romance", description: "Suite romantique avec décoration spéciale", price: 110000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80", badge: null, isActive: true, capacity: "2", area: "38 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Minibar, Décoration romantique" },
            { id: 205, name: "Chambre VIP - Suite Famille", description: "Suite spacieuse pour familles", price: 130000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80", badge: "new", isActive: true, capacity: "4", area: "50 m²", bedType: "Lit King + lits simples", equipment: "WiFi, TV, Climatisation, Minibar, Salon séparé" }
        ];
        const existingNames = new Set((this.menuData.items || []).map(i => i.name));
        let added = 0;
        for (const room of demoRooms) {
            if (!existingNames.has(room.name)) {
                this.menuData.items.push(room);
                added++;
            }
        }
        if (added === 0) {
            alert('Les chambres de démo semblent déjà présentes.');
            return;
        }
        if (await this.saveMenu()) {
            alert(added + ' chambre(s) de démo ajoutée(s) !');
            this.renderCurrentSection();
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
        } else {
            throw new Error('Erreur upload');
        }
    } catch (error) {
        console.error('Erreur upload:', error);
        preview.innerHTML = '<span class="photo-preview-placeholder">Erreur</span>';
        alert('Erreur lors de l\'upload.');
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

// ==================== FONCTIONS GLOBALES ====================

function showItemForm(itemId = null, type = 'chambre') {
    adminApp.showItemForm(itemId, type);
}

function showCategoryForm(categoryId = null) {
    adminApp.showCategoryForm(categoryId);
}

function closeCategoryModal() {
    adminApp.closeCategoryModal();
}

function closeItemModal() {
    adminApp.closeItemModal();
}

function closeConfirmModal() {
    adminApp.closeConfirmModal();
}

function logout() {
    sessionStorage.removeItem('pilipili_admin');
    window.location.href = 'index.html';
}

function resetDatabase() {
    if (confirm('Réinitialiser la base de données ? Toutes les chambres et catégories seront perdues.')) {
        if (!adminApp || !adminApp.binId) {
            alert('Impossible de réinitialiser : base de données non disponible.');
            return;
        }

        const defaultData = {
            restaurant: {
                name: 'LEET-DORIAN',
                address: '',
                phone: '',
                hours: '',
                social: {}
            },
            categories: [
                { id: 1, name: 'Standard', order: 1, unit: 'chambre', sector: 'hotel' },
                { id: 2, name: 'VIP', order: 2, unit: 'chambre', sector: 'hotel' },
                { id: 3, name: 'Petit-déjeuner', order: 3, unit: 'petit_dejeuner', sector: 'restaurant' },
                { id: 4, name: 'Plats & Desserts', order: 4, unit: 'plat', sector: 'restaurant' },
                { id: 5, name: 'Boissons', order: 5, unit: 'boisson', sector: 'drinks' }
            ],
            items: [
                { id: 1, name: "Chambre Standard - Vue Jardin", description: "Chambre confortable avec vue sur le jardin", price: 25000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", isActive: true, capacity: "2", area: "20 m²", bedType: "Lit double", equipment: "WiFi, TV, Climatisation" },
                { id: 2, name: "Chambre Standard - Vue Cour", description: "Chambre calme avec vue sur la cour intérieure", price: 22000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80", isActive: true, capacity: "2", area: "18 m²", bedType: "Lit double", equipment: "WiFi, TV" },
                { id: 3, name: "Chambre Standard - Familiale", description: "Chambre spacieuse pour famille", price: 30000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80", isActive: true, capacity: "3", area: "25 m²", bedType: "Lit double + lit simple", equipment: "WiFi, TV, Climatisation, Salle de bain privative" },
                { id: 4, name: "Chambre Standard - Économique", description: "Chambre fonctionnelle et économique", price: 18000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80", isActive: true, capacity: "2", area: "15 m²", bedType: "Lit double", equipment: "WiFi" },
                { id: 5, name: "Chambre Standard - Supérieure", description: "Chambre avec petit-déjeuner inclus", price: 35000, categoryId: 1, type: "chambre", image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", isActive: true, capacity: "2", area: "22 m²", bedType: "Lit double King", equipment: "WiFi, TV, Climatisation, Minibar" },
                { id: 6, name: "Chambre VIP - Suite Présidentielle", description: "Suite luxueuse avec vue panoramique", price: 120000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80", isActive: true, capacity: "2", area: "45 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Minibar, Jacuzzi, Service 24h/24" },
                { id: 7, name: "Chambre VIP - Suite Exécutive", description: "Suite moderne pour voyageurs d'affaires", price: 85000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80", isActive: true, capacity: "2", area: "35 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Bureau, Minibar" },
                { id: 8, name: "Chambre VIP - Suite Deluxe", description: "Suite élégante avec terrasse privée", price: 95000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", isActive: true, capacity: "2", area: "40 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Minibar, Terrasse" },
                { id: 9, name: "Chambre VIP - Suite Romance", description: "Suite romantique avec décoration spéciale", price: 110000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80", isActive: true, capacity: "2", area: "38 m²", bedType: "Lit King", equipment: "WiFi, TV, Climatisation, Minibar, Décoration romantique" },
                { id: 10, name: "Chambre VIP - Suite Famille", description: "Suite spacieuse pour familles", price: 130000, categoryId: 2, type: "chambre", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80", isActive: true, capacity: "4", area: "50 m²", bedType: "Lit King + lits simples", equipment: "WiFi, TV, Climatisation, Minibar, Salon séparé" }
            ],            settings: {
                restaurantInfoVisible: true
            },
            lastUpdate: new Date().toISOString()
        };

        fetch('https://api.jsonbin.io/v3/b/' + adminApp.binId, {
            method: 'PUT',
            headers: adminApp.getHeaders(),
            body: JSON.stringify(defaultData)
        }).then(() => {
            alert('Base de données réinitialisée !');
            window.location.reload();
        }).catch(() => {
            alert('Erreur lors de la réinitialisation.');
        });
    }
}

// ============================================
// ADMIN LOGO STATE PERSISTENCE
// ============================================
(function() {
    const logo = document.querySelector('.admin-logo');
    const title = document.querySelector('.admin-header h1');
    if (!logo || !title) return;

    const stateKey = 'leet-dorian-admin-logo-state';

    function parseTranslate(el) {
        const m = (el.style.transform || '').match(/translate\(([^p]+)px,\s*([^p]+)px\)/);
        return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
    }

    function applyTranslate(el, x, y) {
        el.style.transform = `translate(${x}px, ${y}px)`;
    }

    function applyState(state) {
        applyTranslate(logo, state.logoX || 0, state.logoY || 0);
        applyTranslate(title, state.titleX || 0, state.titleY || 0);
        logo.style.height = state.logoHeight || '42px';
        title.style.fontSize = state.titleSize || '1rem';
    }

    const saved = localStorage.getItem(stateKey);
    if (saved) {
        try { applyState(JSON.parse(saved)); } catch {}
    }
})();

// Initialisation
let adminApp;
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminApp();
});
