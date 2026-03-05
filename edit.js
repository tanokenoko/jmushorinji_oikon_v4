/**
 * 自治医科大学 少林寺拳法部 追いコンWebサイト 編集機能
 * ログイン機能・テキスト編集・画像変更機能を提供
 */

class EditManager {
    constructor() {
        this.isLoggedIn = false;
        this.currentEditingElement = null;
        this.editToolbar = null;
        this.password = 'shorinji2026';
        this.storageKey = 'oikon2026_data';
        this.imageStorageKey = 'oikon2026_images';
        
        this.init();
    }
    
    init() {
        this.checkLoginStatus();
        this.setupEventListeners();
        this.loadSavedData();
        this.loadSavedImages();
        this.createLoginDialog();
    }
    
    checkLoginStatus() {
        this.isLoggedIn = localStorage.getItem('oikon2026_loggedin') === 'true';
        this.updateUI();
    }
    
    setupEventListeners() {
        // ログインボタン
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginDialog());
        }
        
        // 編集可能要素の設定
        document.addEventListener('click', (e) => this.handleClick(e));
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 画像変更ボタン
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('image-change-btn')) {
                this.changeImage(e.target);
            }
        });
    }
    
    createLoginDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'login-dialog';
        dialog.innerHTML = `
            <div class="login-form">
                <h3><i class="fas fa-lock"></i> ログイン</h3>
                <div class="form-group">
                    <label class="form-label">パスワード</label>
                    <input type="password" class="form-input" id="login-password" placeholder="パスワードを入力">
                    <div class="login-error">パスワードが正しくありません</div>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="editManager.hideLoginDialog()">キャンセル</button>
                    <button type="button" class="btn" onclick="editManager.login()">ログイン</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }
    
    showLoginDialog() {
        const dialog = document.querySelector('.login-dialog');
        dialog.classList.add('active');
        document.getElementById('login-password').focus();
    }
    
    hideLoginDialog() {
        const dialog = document.querySelector('.login-dialog');
        dialog.classList.remove('active');
        document.getElementById('login-password').value = '';
        document.querySelector('.login-error').classList.remove('active');
    }
    
    login() {
        const password = document.getElementById('login-password').value;
        const errorElement = document.querySelector('.login-error');
        
        if (password === this.password) {
            this.isLoggedIn = true;
            localStorage.setItem('oikon2026_loggedin', 'true');
            this.hideLoginDialog();
            this.updateUI();
            this.makeElementsEditable();
        } else {
            errorElement.classList.add('active');
        }
    }
    
    logout() {
        this.isLoggedIn = false;
        localStorage.removeItem('oikon2026_loggedin');
        this.updateUI();
        location.reload(); // ページをリロードして編集モードを解除
    }
    
    updateUI() {
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            if (this.isLoggedIn) {
                loginBtn.innerHTML = '<i class="fas fa-unlock"></i> ログアウト';
                loginBtn.onclick = () => this.logout();
            } else {
                loginBtn.innerHTML = '<i class="fas fa-lock"></i> Login';
                loginBtn.onclick = () => this.showLoginDialog();
            }
        }
    }
    
    makeElementsEditable() {
        if (!this.isLoggedIn) return;
        
        // 編集可能な要素にクラスを追加
        const editableElements = document.querySelectorAll('[data-editable]');
        editableElements.forEach(element => {
            element.classList.add('editable');
            element.title = 'クリックして編集';
        });
        
        // 画像コンテナに変更ボタンを追加
        const imageContainers = document.querySelectorAll('[data-image-key]');
        imageContainers.forEach(container => {
            if (!container.querySelector('.image-change-btn')) {
                const changeBtn = document.createElement('button');
                changeBtn.className = 'image-change-btn';
                changeBtn.innerHTML = '<i class="fas fa-camera"></i> 画像を変更';
                container.appendChild(changeBtn);
            }
        });
    }
    
    handleClick(e) {
        if (!this.isLoggedIn) return;
        
        const target = e.target;
        
        // 編集可能な要素をクリックした場合
        if (target.classList.contains('editable')) {
            e.preventDefault();
            this.startEditing(target);
        }
    }
    
    handleKeydown(e) {
        if (!this.isLoggedIn) return;
        
        // Escapeキーで編集モードを終了
        if (e.key === 'Escape' && this.currentEditingElement) {
            this.stopEditing();
        }
    }
    
    startEditing(element) {
        if (this.currentEditingElement) {
            this.stopEditing();
        }
        
        this.currentEditingElement = element;
        element.classList.add('editing');
        
        // 編集ツールバーを作成
        this.createEditToolbar(element);
        
        // 要素を編集可能にする
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.focus();
        } else {
            element.contentEditable = true;
            element.focus();
            
            // テキストを全選択
            const range = document.createRange();
            range.selectNodeContents(element);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    
    createEditToolbar(element) {
        const toolbar = document.createElement('div');
        toolbar.className = 'edit-toolbar';
        toolbar.innerHTML = `
            <button type="button" onclick="editManager.formatText('bold')" title="太字"><i class="fas fa-bold"></i></button>
            <button type="button" onclick="editManager.formatText('italic')" title="斜体"><i class="fas fa-italic"></i></button>
            <button type="button" onclick="editManager.changeFontSize()" title="文字サイズ"><i class="fas fa-text-height"></i></button>
            <button type="button" onclick="editManager.changeColor()" title="文字色"><i class="fas fa-palette"></i></button>
            <button type="button" onclick="editManager.stopEditing()" title="完了"><i class="fas fa-check"></i></button>
        `;
        
        // ツールバーの位置を設定
        const rect = element.getBoundingClientRect();
        toolbar.style.position = 'fixed';
        toolbar.style.top = (rect.top - 50) + 'px';
        toolbar.style.left = Math.max(10, Math.min(window.innerWidth - toolbar.offsetWidth - 10, rect.left)) + 'px';
        
        document.body.appendChild(toolbar);
        this.editToolbar = toolbar;
    }
    
    formatText(command) {
        document.execCommand(command, false, null);
    }
    
    changeFontSize() {
        const size = prompt('文字サイズを入力してください (12-36px)', '16');
        if (size) {
            this.currentEditingElement.style.fontSize = size + 'px';
            this.saveData();
        }
    }
    
    changeColor() {
        const color = prompt('色を入力してください（例：#C9A84C）', '#C9A84C');
        if (color) {
            this.currentEditingElement.style.color = color;
            this.saveData();
        }
    }
    
    stopEditing() {
        if (!this.currentEditingElement) return;
        
        const element = this.currentEditingElement;
        element.classList.remove('editing');
        element.contentEditable = false;
        
        // 編集ツールバーを削除
        if (this.editToolbar) {
            this.editToolbar.remove();
            this.editToolbar = null;
        }
        
        this.currentEditingElement = null;
        this.saveData();
    }
    
    changeImage(button) {
        const container = button.closest('[data-image-key]');
        const imageKey = container.getAttribute('data-image-key');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target.result;
                    
                    // 画像を表示
                    const img = container.querySelector('img');
                    if (img) {
                        img.src = imageData;
                    } else {
                        const newImg = document.createElement('img');
                        newImg.src = imageData;
                        newImg.className = 'card-image';
                        container.appendChild(newImg);
                    }
                    
                    // 画像データを保存
                    this.saveImage(imageKey, imageData);
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }
    
    saveData() {
        const data = {};
        
        // 編集可能な要素のデータを収集
        const editableElements = document.querySelectorAll('[data-editable]');
        editableElements.forEach(element => {
            const key = element.getAttribute('data-editable');
            data[key] = {
                content: element.innerHTML,
                styles: {
                    fontSize: element.style.fontSize,
                    color: element.style.color,
                    fontWeight: element.style.fontWeight,
                    fontStyle: element.style.fontStyle
                }
            };
        });
        
        // リンクURLのデータを収集
        const linkElements = document.querySelectorAll('[data-link-key]');
        linkElements.forEach(element => {
            const key = element.getAttribute('data-link-key');
            data[key] = {
                href: element.href,
                content: element.innerHTML
            };
        });
        
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
    
    loadSavedData() {
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData) {
            const data = JSON.parse(savedData);
            
            Object.keys(data).forEach(key => {
                const element = document.querySelector(`[data-editable="${key}"]`);
                if (element && data[key].content) {
                    element.innerHTML = data[key].content;
                    if (data[key].styles) {
                        Object.assign(element.style, data[key].styles);
                    }
                }
                
                const linkElement = document.querySelector(`[data-link-key="${key}"]`);
                if (linkElement && data[key].href) {
                    linkElement.href = data[key].href;
                    if (data[key].content) {
                        linkElement.innerHTML = data[key].content;
                    }
                }
            });
        }
    }
    
    saveImage(key, imageData) {
        const images = JSON.parse(localStorage.getItem(this.imageStorageKey) || '{}');
        images[key] = imageData;
        localStorage.setItem(this.imageStorageKey, JSON.stringify(images));
    }
    
    loadSavedImages() {
        const savedImages = localStorage.getItem(this.imageStorageKey);
        if (savedImages) {
            const images = JSON.parse(savedImages);
            Object.keys(images).forEach(key => {
                const container = document.querySelector(`[data-image-key="${key}"]`);
                if (container) {
                    const img = container.querySelector('img');
                    if (img) {
                        img.src = images[key];
                    }
                }
            });
        }
    }
}

// グローバル変数として初期化
let editManager;

document.addEventListener('DOMContentLoaded', () => {
    editManager = new EditManager();
});

// スクロールアニメーション
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // フェードイン要素を監視
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
    
    // スクロールインジケーター
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                scrollIndicator.style.opacity = '0';
            } else {
                scrollIndicator.style.opacity = '1';
            }
        });
    }
});

// タブ機能
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // アクティブなタブをリセット
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 選択されたタブをアクティブに
            button.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
});