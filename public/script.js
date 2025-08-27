window.onload = function() {
    document.getElementById('sendOtpBtn').addEventListener('click', async () => {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const dob = document.getElementById('dob').value;
        const city = document.getElementById('city').value;
        const country = document.getElementById('country').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!firstName || !lastName || !dob || !city || !country || !email || !password) {
            alert('Please fill all fields');
            return;
        }

        const res = await fetch('/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        if (data.success) {
            alert("OTP sent to your email");
            document.getElementById('step-email').classList.add('hidden');
            document.getElementById('step-otp').classList.remove('hidden');
        } else {
            alert("Failed to send OTP");
        }
    });

    document.getElementById('verifyOtpBtn').addEventListener('click', async () => {
        const token = document.getElementById('otp').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const dob = document.getElementById('dob').value;
        const city = document.getElementById('city').value;
        const country = document.getElementById('country').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!token) {
            alert('Please enter the OTP');
            return;
        }

        const res = await fetch('/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, email })
        });

        const data = await res.json();
        if (data.success) {
            alert("OTP Verified! Signing you up...");
            // Send all user info to server
            const signupRes = await fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: firstName + ' ' + lastName,
                    dob,
                    city,
                    country,
                    email,
                    password
                })
            });

            const signupData = await signupRes.json();
            if (signupData.success) {
                alert("Signup successful! Please login.");
                document.getElementById('step-otp').classList.add('hidden');
                document.getElementById('login-form').classList.remove('hidden');
            } else {
                alert("Signup failed.");
            }
        } else {
            alert("Invalid OTP");
        }
    });

    // Forgot Password navigation
    document.getElementById('forgotPasswordLink').addEventListener('click', () => {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('forgot-form').classList.remove('hidden');
    });
    document.getElementById('backToLoginBtn').addEventListener('click', () => {
        document.getElementById('forgot-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    });

    // Forgot Password logic
    document.getElementById('forgotBtn').addEventListener('click', async () => {
        const email = document.getElementById('forgot-email').value;
        if (!email) {
            alert('Please enter your registered email');
            return;
        }
        const res = await fetch('/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
            alert('Reset code sent to your email!');
            document.getElementById('forgot-form').classList.add('hidden');
            document.getElementById('reset-form').classList.remove('hidden');
        } else {
            alert(data.message || 'Email not found');
        }
    });

    document.getElementById('resetBtn').addEventListener('click', async () => {
        const email = document.getElementById('forgot-email').value;
        const otp = document.getElementById('reset-otp').value;
        const newPassword = document.getElementById('reset-password').value;
        if (!otp || !newPassword) {
            alert('Please enter OTP and new password');
            return;
        }
        const res = await fetch('/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword })
        });
        const data = await res.json();
        if (data.success) {
            alert('Password changed successfully!');
            document.getElementById('reset-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
        } else {
            alert(data.message || 'Failed to reset password');
        }
    });

    document.getElementById('backToLoginBtn2').addEventListener('click', () => {
        document.getElementById('reset-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    });

    // Show login form when login button is clicked
    document.getElementById('showLoginBtn').addEventListener('click', () => {
        document.getElementById('step-email').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    });

    // Go back to registration from login
    document.getElementById('backToSignupBtn').addEventListener('click', () => {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('step-email').classList.remove('hidden');
    });

    // Login logic
    document.getElementById('loginBtn').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            // Clear all user/shop/product keys except accessibility and language
            const preserve = ['aidify.language', 'fontSize','highContrast','darkMode','dyslexiaFont','linkHighlight','largeCursors','reduceMotion','gridColumns','ttsScope','ttsAutoRead'];
            Object.keys(localStorage).forEach(function(k){
                if (!preserve.includes(k)) localStorage.removeItem(k);
            });
            // Explicitly clear shop, products, orders, messages, cart
            localStorage.removeItem('aidify.store');
            localStorage.removeItem('aidify.products');
            localStorage.removeItem('aidify.orders');
            localStorage.removeItem('aidify.messages');
            localStorage.removeItem('aidify.cart');
            try {
                localStorage.setItem('aidify.auth', JSON.stringify({ email, userId: data.userId, country: data.country, loggedInAt: Date.now() }));
            } catch (e) {}
            alert('Login successful!');
            window.location.href = '/home';
        } else {
            alert('Invalid email or password');
        }
    });
}