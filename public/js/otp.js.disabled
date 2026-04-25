// Cache DOM references for OTP workflow.
const otpCard = document.getElementById('otp-card');
const requestBtn = document.getElementById('request-otp-btn');
const verifyBtn = document.getElementById('verify-otp-btn');
const resendBtn = document.getElementById('resend-otp-btn');
const resendCountdown = document.getElementById('resend-countdown');
const statusEl = document.getElementById('otp-status');
const maskedEmailInlineEl = document.getElementById('masked-email-inline');
const otpInputs = Array.from(document.querySelectorAll('.otp-input'));

const REQUEST_COOLDOWN_SECONDS = 60;

let cooldownTimer = null;
let cooldownRemaining = REQUEST_COOLDOWN_SECONDS;
const maskedEmail = maskedEmailInlineEl ? maskedEmailInlineEl.textContent : 'j***@mail.com';

const requestUrl = otpCard?.dataset.requestUrl || '/request-otp';
const verifyUrl = otpCard?.dataset.verifyUrl || '/verify-otp';
const token = otpCard?.dataset.token || '';

// Format seconds as mm:ss.
function formatCountdown(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Update status text with a tone-specific color.
function setStatus(message, tone) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = tone === 'error' ? '#b34a2a' : '#7f3b24';
}

// Reveal the OTP entry panel and focus the first input.
function showOtpPanel() {
    if (!otpCard) return;
    otpCard.classList.add('show-otp');
    if (otpInputs[0]) otpInputs[0].focus();
}

// Start resend cooldown timer and update UI.
function startCooldown() {
    cooldownRemaining = REQUEST_COOLDOWN_SECONDS;
    resendBtn.disabled = true;
    resendCountdown.textContent = `Resend available in ${formatCountdown(cooldownRemaining)}`;
    resendCountdown.style.display = 'inline';

    cooldownTimer = setInterval(() => {
        cooldownRemaining -= 1;
        if (cooldownRemaining <= 0) {
            clearInterval(cooldownTimer);
            resendBtn.disabled = false;
            resendCountdown.textContent = 'You can request another OTP now.';
            return;
        }
        resendCountdown.textContent = `Resend available in ${formatCountdown(cooldownRemaining)}`;
    }, 1000);
}

// Clear OTP inputs and disable verify until filled.
function resetOtpInputs() {
    otpInputs.forEach(input => {
        input.value = '';
    });
    verifyBtn.disabled = true;
}

// Combine all OTP input values into a single string.
function getOtpValue() {
    return otpInputs.map(input => input.value).join('');
}

// Allow only digits and auto-advance between fields.
function handleInput(event, index) {
    const value = event.target.value.replace(/\D/g, '');
    event.target.value = value;

    if (value && otpInputs[index + 1]) {
        otpInputs[index + 1].focus();
    }

    verifyBtn.disabled = getOtpValue().length !== otpInputs.length;
}

// Move focus back on backspace when field is empty.
function handleKeyDown(event, index) {
    if (event.key === 'Backspace' && !event.target.value && otpInputs[index - 1]) {
        otpInputs[index - 1].focus();
    }
}

// Paste a full OTP across inputs.
function handlePaste(event) {
    const pasted = (event.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, otpInputs.length);
    if (!pasted) return;

    otpInputs.forEach((input, idx) => {
        input.value = pasted[idx] || '';
    });

    const nextIndex = Math.min(pasted.length, otpInputs.length - 1);
    otpInputs[nextIndex].focus();
    verifyBtn.disabled = getOtpValue().length !== otpInputs.length;
    event.preventDefault();
}

// Request a new OTP from the server and start cooldown.
async function requestOtp() {
    requestBtn.disabled = true;
    resendBtn.disabled = true;
    setStatus('Sending OTP to your email...', 'info');

    try {
        const response = await fetch(requestUrl,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "companyName": window.c || ""
                })
            });

        let result;
        try {
            result = await response.json();
        } catch (e) {
            throw new Error('Unexpected response from server. Please try again.');
        }

        if (!response.ok) {
            throw new Error(result.message || 'Failed to request OTP. Please try again.');
        }

        showOtpPanel();
        resetOtpInputs();
        setStatus(`OTP has been sent to ${maskedEmail}.`, 'info');
        startCooldown();
    } catch (error) {
        requestBtn.disabled = false;
        resendBtn.disabled = false;
        setStatus(error.message, 'error');
    }
}

// Verify OTP with server and redirect on success.
async function verifyOtp() {
    const otpValue = getOtpValue();
    if (otpValue.length !== otpInputs.length) return;

    verifyBtn.disabled = true;
    setStatus('Verifying OTP...', 'info');

    try {
        const response = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp: otpValue, companyName: window.c || "" })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Verification failed');
        }

        setStatus('OTP verified. You may continue.', 'info');
        resendBtn.disabled = true;
        resendCountdown.textContent = '';
        clearInterval(cooldownTimer);

        window.location.href = '/terminals?token=' + token;
    } catch (error) {
        verifyBtn.disabled = false;
        setStatus(error.message, 'error');
    }
}

if (requestBtn) {
    requestBtn.addEventListener('click', requestOtp);
}

if (resendBtn) {
    resendBtn.addEventListener('click', () => {
        resetOtpInputs();
        requestOtp();
    });
}

if (verifyBtn) {
    verifyBtn.addEventListener('click', verifyOtp);
}

otpInputs.forEach((input, index) => {
    input.addEventListener('input', event => handleInput(event, index));
    input.addEventListener('keydown', event => handleKeyDown(event, index));
    input.addEventListener('paste', handlePaste);
});
