(function() {
    const MIN_MOBILE_WIDTH = 768;
    
    function isMobile() {
        return window.innerWidth < MIN_MOBILE_WIDTH;
    }
    
    function showMobileOnlyMessage() {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f6f4ee; font-family: 'Lato', sans-serif; padding: 20px; text-align: center;">
                <div style="max-width: 400px; background: white; padding: 40px 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
                    <h1 style="font-family: 'Georgia', serif; color: #1f2a24; margin-bottom: 15px; font-size: 1.5rem;">Accès mobile uniquement</h1>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">Cette application est optimisée pour les smartphones et tablettes. Veuillez y accéder depuis un appareil mobile.</p>
                    <div style="background: #f6f4ee; padding: 15px; border-radius: 8px; font-size: 0.85rem; color: #888;">
                        <p style="margin: 5px 0;">📐 Largeur d'écran détectée : <strong>${window.innerWidth}px</strong></p>
                        <p style="margin: 5px 0;">📱 Largeur requise : <strong>moins de ${MIN_MOBILE_WIDTH}px</strong></p>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (!isMobile()) {
        showMobileOnlyMessage();
    }
})();
