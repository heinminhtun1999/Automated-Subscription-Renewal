const adminSidebar = document.getElementById('admin-sidebar');
const hamburger = document.getElementById('hamburger');
const hamburger2 = document.getElementById('hamburger2');

function setupNotification(containerId, closeButtonId, messageSelector) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const closeButton = document.getElementById(closeButtonId);
    let timer;

    const hide = () => {
        container.classList.add('hidden');
        const messageEl = container.querySelector(messageSelector);
        if (messageEl) messageEl.textContent = '';
        clearTimeout(timer);
    };

    if (closeButton) {
        closeButton.addEventListener('click', hide);
    }

    return (message, duration = 5000) => {
        const messageEl = container.querySelector(messageSelector);
        if (messageEl) {
            messageEl.textContent = message;
        }

        container.classList.remove('hidden');
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const progressBar = container.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transition = `width ${duration / 1000}s linear`;
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 100);
        }

        clearTimeout(timer);
        timer = setTimeout(hide, duration);
    };
}

const renderError = setupNotification('error-container', 'close-error', '[data-error-message]');
const renderSuccess = setupNotification('success-container', 'close-success', '[data-success-message]');

window.addEventListener('load', () => {
    const errorContainer = document.getElementById('error-container');
    const errorMessage = errorContainer?.querySelector('[data-error-message]');
    if (errorContainer && errorMessage && errorMessage.textContent.trim()) {
        renderError(errorMessage.textContent.trim());
    }

    const successContainer = document.getElementById('success-container');
    const successMessage = successContainer?.querySelector('[data-success-message]');
    if (successContainer && successMessage && successMessage.textContent.trim()) {
        renderSuccess(successMessage.textContent.trim());
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
});

async function parseResponseData(response) {
    let data;

    try {
        const text = await response.text();
        data = JSON.parse(text)
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