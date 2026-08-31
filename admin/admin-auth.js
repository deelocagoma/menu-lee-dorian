const ADMIN_CONFIG = {
    passwordHash: '000000000000000000000000590c2363a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    maxAttempts: 5,
    lockoutDuration: 30000,
    storageKey: 'pilipili_admin_auth'
};

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(32, '0');
    return hex + 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2';
}

function checkAuth() {
    const session = sessionStorage.getItem(ADMIN_CONFIG.storageKey);
    if (session === 'granted') {
        window.location.href = 'dashboard.html';
        return true;
    }
    return false;
}

function getAttempts() {
    try {
        const data = JSON.parse(localStorage.getItem('pilipili_login_attempts') || '{"count":0,"lastAttempt":0}');
        return data;
    } catch {
        return { count: 0, lastAttempt: 0 };
    }
}

function recordAttempt() {
    const attempts = getAttempts();
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    localStorage.setItem('pilipili_login_attempts', JSON.stringify(attempts));
}

function resetAttempts() {
    localStorage.removeItem('pilipili_login_attempts');
}

function isLockedOut() {
    const attempts = getAttempts();
    if (attempts.count >= ADMIN_CONFIG.maxAttempts) {
        const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
        if (timeSinceLastAttempt < ADMIN_CONFIG.lockoutDuration) {
            return true;
        } else {
            resetAttempts();
        }
    }
    return false;
}

function getLockoutRemaining() {
    const attempts = getAttempts();
    const elapsed = Date.now() - attempts.lastAttempt;
    const remaining = ADMIN_CONFIG.lockoutDuration - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000));
}

function attemptLogin(inputPassword) {
    if (isLockedOut()) {
        return { success: false, locked: true, remaining: getLockoutRemaining() };
    }

    const hashedInput = simpleHash(inputPassword);
    if (hashedInput === ADMIN_CONFIG.passwordHash) {
        resetAttempts();
        sessionStorage.setItem(ADMIN_CONFIG.storageKey, 'granted');
        return { success: true };
    } else {
        recordAttempt();
        const remaining = ADMIN_CONFIG.maxAttempts - getAttempts().count;
        return { success: false, locked: false, remaining };
    }
}
