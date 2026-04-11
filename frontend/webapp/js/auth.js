// BookVerse — Auth (Login & Register)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('navbar-root').innerHTML = getNavbarHTML('');
    initNavbar();
});

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');

    if (!email || !password) { Toast.error('Please fill in all fields'); return false; }

    btn.disabled = true;
    btn.innerHTML = 'Signing in...';

    const success = await Auth.login(email, password);
    if (success) {
        Toast.success(`Welcome back, ${Auth.getName()}!`);
        setTimeout(() => {
            window.location.href = Auth.isAdmin() ? 'admin.html' : 'index.html';
        }, 800);
    } else {
        Toast.error('Invalid email or password');
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
    }
    return false;
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const agree = document.getElementById('agreeTerms').checked;
    const btn = document.getElementById('regBtn');

    if (!name || !email || !password || !confirm) { Toast.error('Please fill in all fields'); return false; }
    if (password.length < 6) { Toast.error('Password must be at least 6 characters'); return false; }
    if (password !== confirm) { Toast.error('Passwords do not match'); document.getElementById('regConfirm').classList.add('error'); return false; }
    if (!agree) { Toast.error('Please agree to the Terms of Service'); return false; }

    btn.disabled = true;
    btn.innerHTML = 'Creating account...';

    const success = await Auth.register(name, email, password);
    if (success) {
        Toast.success('Account created successfully!');
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
    } else {
        Toast.error('Registration failed. Please try again.');
        btn.disabled = false;
        btn.innerHTML = 'Register';
    }
    return false;
}

function checkPasswordStrength(password) {
    const bar = document.getElementById('strengthBar');
    const text = document.getElementById('strengthText');
    if (!bar) return;

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
        { width: '0%', color: 'transparent', text: '' },
        { width: '20%', color: '#ef4444', text: 'Very weak' },
        { width: '40%', color: '#f59e0b', text: 'Weak' },
        { width: '60%', color: '#eab308', text: 'Fair' },
        { width: '80%', color: '#22c55e', text: 'Strong' },
        { width: '100%', color: '#10b981', text: 'Very strong' }
    ];

    const level = levels[strength] || levels[0];
    bar.style.width = level.width;
    bar.style.background = level.color;
    if (text) text.textContent = level.text;
}
