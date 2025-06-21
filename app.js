// Application state
const state = {
    isLoading: false,
    currentTheme: 'light'
};

// Country data
const countries = [
    {"name": "United States", "code": "US", "prefix": "+1", "flag": "🇺🇸"},
    {"name": "United Kingdom", "code": "GB", "prefix": "+44", "flag": "🇬🇧"},
    {"name": "India", "code": "IN", "prefix": "+91", "flag": "🇮🇳"},
    {"name": "Canada", "code": "CA", "prefix": "+1", "flag": "🇨🇦"},
    {"name": "Australia", "code": "AU", "prefix": "+61", "flag": "🇦🇺"},
    {"name": "Germany", "code": "DE", "prefix": "+49", "flag": "🇩🇪"},
    {"name": "France", "code": "FR", "prefix": "+33", "flag": "🇫🇷"},
    {"name": "Japan", "code": "JP", "prefix": "+81", "flag": "🇯🇵"},
    {"name": "Brazil", "code": "BR", "prefix": "+55", "flag": "🇧🇷"},
    {"name": "Mexico", "code": "MX", "prefix": "+52", "flag": "🇲🇽"}
];

// API configuration
const API_CONFIG = {
    key: '5fb910e561a24481829cfcd73e864cb6',
    url: 'https://phonevalidation.abstractapi.com/v1/'
};

// DOM elements
const elements = {
    hamburgerBtn: document.getElementById('hamburgerBtn'),
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('overlay'),
    themeToggle: document.getElementById('themeToggle'),
    countrySelect: document.getElementById('countryCode'),
    phoneInput: document.getElementById('phoneNumber'),
    validateBtn: document.getElementById('validateBtn'),
    validationForm: document.getElementById('validationForm'),
    resultsSection: document.getElementById('resultsSection'),
    resultsGrid: document.getElementById('resultsGrid'),
    backBtn: document.getElementById('backBtn')
};

// Initialize application
function init() {
    populateCountryDropdown();
    setupEventListeners();
    loadThemePreference();
}

// Populate country dropdown
function populateCountryDropdown() {
    const countrySelect = elements.countrySelect;
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.prefix;
        option.textContent = `${country.flag} ${country.name} (${country.prefix})`;
        option.dataset.code = country.code;
        countrySelect.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Hamburger menu toggle
    elements.hamburgerBtn.addEventListener('click', toggleSidebar);
    
    // Overlay click to close sidebar
    elements.overlay.addEventListener('click', closeSidebar);
    
    // Theme toggle
    elements.themeToggle.addEventListener('change', toggleTheme);
    
    // Phone validation
    elements.validateBtn.addEventListener('click', validatePhoneNumber);
    
    // Back button
    elements.backBtn.addEventListener('click', showValidationForm);
    
    // Enter key support for phone input
    elements.phoneInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validatePhoneNumber();
        }
    });
    
    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });
}

// Sidebar functionality
function toggleSidebar() {
    const isOpen = elements.sidebar.classList.contains('open');
    
    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    elements.sidebar.classList.add('open');
    elements.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    elements.sidebar.classList.remove('open');
    elements.overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Theme functionality
function toggleTheme() {
    const isDark = elements.themeToggle.checked;
    const theme = isDark ? 'dark' : 'light';
    
    setTheme(theme);
    saveThemePreference(theme);
}

function setTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-color-scheme', theme);
    elements.themeToggle.checked = theme === 'dark';
}

function loadThemePreference() {
    // Check for system preference since we can't use localStorage
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'dark' : 'light';
    setTheme(theme);
}

function saveThemePreference(theme) {
    // Would normally save to localStorage, but skipping due to sandbox restrictions
    console.log(`Theme set to: ${theme}`);
}

// Phone validation functionality
async function validatePhoneNumber() {
    if (state.isLoading) return;
    
    const countryCode = elements.countrySelect.value;
    const phoneNumber = elements.phoneInput.value.trim();
    
    // Input validation
    if (!countryCode) {
        showAlert('Please select a country code.');
        return;
    }
    
    if (!phoneNumber) {
        showAlert('Please enter a phone number.');
        elements.phoneInput.focus();
        return;
    }
    
    // Create full phone number
    const fullPhoneNumber = countryCode + phoneNumber;
    
    try {
        setLoadingState(true);
        const result = await callValidationAPI(fullPhoneNumber);
        displayResults(result, fullPhoneNumber);
        showResultsSection();
    } catch (error) {
        console.error('Validation error:', error);
        showAlert('Failed to validate phone number. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

// API call
async function callValidationAPI(phoneNumber) {
    const url = `${API_CONFIG.url}?api_key=${API_CONFIG.key}&phone=${encodeURIComponent(phoneNumber)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Display validation results
function displayResults(data, phoneNumber) {
    const resultsGrid = elements.resultsGrid;
    resultsGrid.innerHTML = '';
    
    // Validation status
    const isValid = data.valid;
    const statusItem = createResultItem('Validation Status', isValid ? 'Valid' : 'Invalid', isValid ? 'valid' : 'invalid');
    resultsGrid.appendChild(statusItem);
    
    // Phone number
    const phoneItem = createResultItem('Phone Number', phoneNumber);
    resultsGrid.appendChild(phoneItem);
    
    // Country
    if (data.country && data.country.name) {
        const countryItem = createResultItem('Country', data.country.name);
        resultsGrid.appendChild(countryItem);
    }
    
    // Location (if available)
    if (data.location) {
        const locationItem = createResultItem('Location', data.location);
        resultsGrid.appendChild(locationItem);
    }
    
    // Carrier
    if (data.carrier) {
        const carrierItem = createResultItem('Carrier', data.carrier);
        resultsGrid.appendChild(carrierItem);
    }
    
    // Line type
    if (data.type) {
        const typeItem = createResultItem('Line Type', capitalizeFirst(data.type));
        resultsGrid.appendChild(typeItem);
    }
    
    // Format (if available)
    if (data.format && data.format.international) {
        const formatItem = createResultItem('International Format', data.format.international);
        resultsGrid.appendChild(formatItem);
    }
    
    // If no additional data available, show message
    if (!data.country && !data.carrier && !data.type) {
        const noDataItem = createResultItem('Additional Info', 'No additional data available');
        resultsGrid.appendChild(noDataItem);
    }
}

// Create result item element
function createResultItem(label, value, className = '') {
    const item = document.createElement('div');
    item.className = `result-item ${className}`;
    
    const labelEl = document.createElement('h4');
    labelEl.textContent = label;
    
    const valueEl = document.createElement('p');
    valueEl.textContent = value;
    
    item.appendChild(labelEl);
    item.appendChild(valueEl);
    
    return item;
}

// UI state management
function setLoadingState(loading) {
    state.isLoading = loading;
    
    if (loading) {
        elements.validateBtn.textContent = 'Validating...';
        elements.validateBtn.disabled = true;
        elements.validationForm.classList.add('loading');
    } else {
        elements.validateBtn.textContent = 'Validate Phone Number';
        elements.validateBtn.disabled = false;
        elements.validationForm.classList.remove('loading');
    }
}

function showValidationForm() {
    elements.validationForm.style.display = 'block';
    elements.resultsSection.style.display = 'none';
    
    // Clear form
    elements.phoneInput.value = '';
    elements.phoneInput.focus();
}

function showResultsSection() {
    elements.validationForm.style.display = 'none';
    elements.resultsSection.style.display = 'block';
}

// Utility functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function showAlert(message) {
    // Simple alert since we can't implement custom modals without additional complexity
    alert(message);
}

// Handle system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!elements.themeToggle.checked && e.matches) {
        setTheme('dark');
    } else if (elements.themeToggle.checked && !e.matches) {
        setTheme('light');
    }
});

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}