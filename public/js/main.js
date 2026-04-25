const adminSidebar = document.getElementById('admin-sidebar');
const hamburger = document.getElementById('hamburger');
const hamburger2 = document.getElementById('hamburger2');
const closeError = document.getElementById('close-error');

closeError.addEventListener('click', () => {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.classList.add('hidden');
        errorContainer.querySelector('[data-error-message]').textContent = '';
    }
});

hamburger2.addEventListener('click', () => {
    adminSidebar.classList.toggle('-left-full');
});

hamburger.addEventListener('click', () => {
    adminSidebar.classList.toggle('collapsed');
    adminSidebar.classList.toggle('w-max');
    localStorage.setItem('adminSidebarCollapsed', adminSidebar.classList.contains('collapsed'));
});

// Check the stored state on page load
window.addEventListener('load', () => {
    const isCollapsed = localStorage.getItem('adminSidebarCollapsed') === 'true';
    if (isCollapsed) {
        adminSidebar.classList.add('collapsed');
        adminSidebar.classList.add('w-max');
    }

    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        setTimeout(() => {
            errorContainer.classList.add('hidden');
            errorContainer.querySelector('[data-error-message]').textContent = '';
        }, 10000);
    }
});

function renderError(message) {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) return;

    const messageEl = errorContainer.querySelector('[data-error-message]');
    if (messageEl) {
        messageEl.textContent = message || 'An unexpected error occurred.';
    }

    errorContainer.classList.remove('hidden');
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
        errorContainer.classList.add('hidden');
        messageEl.textContent = '';
    }, 10000);
}

function renderSuccess(message) {
    const successContainer = document.getElementById('success-container');
    if (!successContainer) return;

    const messageEl = successContainer.querySelector('[data-success-message]');
    if (messageEl) {
        messageEl.textContent = message || 'Operation completed successfully.';
    }
    successContainer.classList.remove('hidden');
    successContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
        successContainer.classList.add('hidden');
        messageEl.textContent = '';
    }, 10000);

}

async function parseResponseData(response) {
    let data;

    try {
        data = await response.json();
    } catch (err) {
        console.error('Failed to parse JSON response:', err);
        data = null;
    }
    
    if (!response.ok) {
        const errorMessage = data?.message || 'An unexpected error occurred. Please try again later.';
        
        throw new Error(errorMessage);
    } 
    return data;
}

window.renderError = renderError;
window.renderSuccess = renderSuccess;
window.parseResponseData = parseResponseData;