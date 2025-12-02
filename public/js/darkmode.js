// Initialize dark mode on page load
document.addEventListener('DOMContentLoaded', () => {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    
    if (darkModeEnabled) {
        enableDarkMode();
    }
});

// Toggle dark mode
function toggleDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

// Enable dark mode
function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
    
    const toggle = document.querySelector('.dark-mode-toggle');
    if (toggle) {
        toggle.textContent = '☀️ Light Mode';
    }
}

// Disable dark mode
function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'false');
    
    const toggle = document.querySelector('.dark-mode-toggle');
    if (toggle) {
        toggle.textContent = '🌙 Dark Mode';
    }
}
