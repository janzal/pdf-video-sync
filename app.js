// Global state variables
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let syncConfig = null;
let isManualPageChange = false;
let isDragging = false;

// DOM elements
const video = document.getElementById('video');
const pdfCanvas = document.getElementById('pdf-canvas');
const ctx = pdfCanvas.getContext('2d');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');
const videoTimeSpan = document.getElementById('video-time');
const videoDurationSpan = document.getElementById('video-duration');
const statusBar = document.getElementById('status-bar');
const divider = document.getElementById('divider');
const videoPanel = document.getElementById('video-panel');
const pdfPanel = document.getElementById('pdf-panel');

// Initialize the application
async function init() {
    try {
        // Load configuration
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error('Configuration file not found');
        }
        
        syncConfig = await response.json();
        
        // Validate configuration
        if (!syncConfig.videoUrl || !syncConfig.pdfUrl || !syncConfig.sync) {
            throw new Error('Invalid configuration: missing required fields');
        }
        
        // Sort sync points by time
        syncConfig.sync.sort((a, b) => a.time - b.time);
        
        updateStatus('Configuration loaded successfully', 'success');
        
        // Load video
        video.src = syncConfig.videoUrl;
        
        // Load PDF
        await loadPDF(syncConfig.pdfUrl);
        
        // Setup event listeners
        setupEventListeners();
        
        updateStatus('Ready', 'success');
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
        console.error('Initialization error:', error);
    }
}

// Load and render PDF
async function loadPDF(url) {
    try {
        updateStatus('Loading PDF...', 'loading');
        
        const loadingTask = pdfjsLib.getDocument(url);
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        
        totalPagesSpan.textContent = totalPages;
        
        // Render first page
        await renderPage(1);
        
        updateStatus('PDF loaded successfully', 'success');
    } catch (error) {
        updateStatus(`Error loading PDF: ${error.message}`, 'error');
        console.error('PDF loading error:', error);
    }
}

// Render a specific page
async function renderPage(pageNum) {
    try {
        const page = await pdfDoc.getPage(pageNum);
        
        // Get container dimensions
        const container = pdfCanvas.parentElement;
        const containerWidth = container.clientWidth - 40; // Account for padding
        const containerHeight = container.clientHeight - 100; // Account for controls
        
        // Calculate scale to fit container
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
            containerWidth / viewport.width,
            containerHeight / viewport.height,
            2 // Max scale
        );
        
        const scaledViewport = page.getViewport({ scale });
        
        // Set canvas dimensions
        pdfCanvas.width = scaledViewport.width;
        pdfCanvas.height = scaledViewport.height;
        
        // Render PDF page
        const renderContext = {
            canvasContext: ctx,
            viewport: scaledViewport
        };
        
        await page.render(renderContext).promise;
        
        currentPage = pageNum;
        currentPageSpan.textContent = currentPage;
        updatePageButtons();
    } catch (error) {
        updateStatus(`Error rendering page: ${error.message}`, 'error');
        console.error('Page rendering error:', error);
    }
}

// Update page navigation buttons state
function updatePageButtons() {
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// Navigate to previous page
async function goToPreviousPage() {
    if (currentPage > 1) {
        isManualPageChange = true;
        video.pause();
        
        const newPage = currentPage - 1;
        
        // Find sync point for this page
        const syncPoint = findSyncPointForPage(newPage);
        if (syncPoint) {
            video.currentTime = syncPoint.time;
        }
        
        await renderPage(newPage);
        
        // Reset flag after delay
        setTimeout(() => {
            isManualPageChange = false;
        }, 500);
    }
}

// Navigate to next page
async function goToNextPage() {
    if (currentPage < totalPages) {
        isManualPageChange = true;
        video.pause();
        
        const newPage = currentPage + 1;
        
        // Find sync point for this page
        const syncPoint = findSyncPointForPage(newPage);
        if (syncPoint) {
            video.currentTime = syncPoint.time;
        }
        
        await renderPage(newPage);
        
        // Reset flag after delay
        setTimeout(() => {
            isManualPageChange = false;
        }, 500);
    }
}

// Find sync point for a given page
function findSyncPointForPage(page) {
    if (!syncConfig || !syncConfig.sync) return null;
    return syncConfig.sync.find(sync => sync.page === page);
}

// Handle video time update for synchronization
function handleVideoTimeUpdate() {
    if (!syncConfig || !syncConfig.sync || isManualPageChange) return;
    
    const currentTime = video.currentTime;
    
    // Find the appropriate page for current time
    let targetPage = 1;
    for (const sync of syncConfig.sync) {
        if (currentTime >= sync.time) {
            targetPage = sync.page;
        } else {
            break;
        }
    }
    
    // Update page if needed
    if (targetPage !== currentPage) {
        renderPage(targetPage);
    }
    
    // Update video time display
    updateVideoTime();
}

// Update video time display
function updateVideoTime() {
    videoTimeSpan.textContent = formatTime(video.currentTime);
    if (video.duration) {
        videoDurationSpan.textContent = formatTime(video.duration);
    }
}

// Format time in MM:SS format
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update status bar
function updateStatus(message, type = '') {
    statusBar.textContent = message;
    statusBar.className = type;
}

// Setup all event listeners
function setupEventListeners() {
    // Page navigation buttons
    prevPageBtn.addEventListener('click', goToPreviousPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    
    // Video events
    video.addEventListener('timeupdate', handleVideoTimeUpdate);
    video.addEventListener('loadedmetadata', updateVideoTime);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // Window resize - re-render PDF
    window.addEventListener('resize', debounce(() => {
        if (pdfDoc && currentPage) {
            renderPage(currentPage);
        }
    }, 250));
    
    // Draggable divider
    setupDivider();
}

// Handle keyboard shortcuts
function handleKeyboard(e) {
    // Spacebar - play/pause video
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }
    
    // Arrow keys - page navigation
    if (e.code === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousPage();
    }
    
    if (e.code === 'ArrowRight') {
        e.preventDefault();
        goToNextPage();
    }
}

// Setup draggable divider
function setupDivider() {
    let startX = 0;
    let startY = 0;
    let startVideoFlex = 50;
    let startPdfFlex = 50;
    
    // Parse flex-basis values, handling both percentage, pixel, and auto values
    const parseFlexBasis = (value, containerSize) => {
        if (value === 'auto') {
            // For auto, calculate based on current computed width/height
            return 50; // Default to 50% for auto
        } else if (value.endsWith('%')) {
            return parseFloat(value);
        } else if (value.endsWith('px')) {
            return (parseFloat(value) / containerSize) * 100;
        } else {
            // Default to 50% if unable to parse
            return 50;
        }
    };
    
    // Apply size constraints ensuring panels sum to 100%
    const applyConstraints = (newVideoFlex, containerSize) => {
        // Enforce minimum sizes (20% or 200px, whichever is smaller)
        const minPercent = Math.min((200 / containerSize) * 100, 20);
        const maxPercent = 100 - minPercent;
        
        if (newVideoFlex < minPercent) {
            return { video: minPercent, pdf: 100 - minPercent };
        } else if (newVideoFlex > maxPercent) {
            return { video: maxPercent, pdf: minPercent };
        } else {
            return { video: newVideoFlex, pdf: 100 - newVideoFlex };
        }
    };
    
    divider.addEventListener('mousedown', (e) => {
        isDragging = true;
        divider.classList.add('dragging');
        
        startX = e.clientX;
        startY = e.clientY;
        
        // Get current flex values
        const videoFlexBasis = window.getComputedStyle(videoPanel).flexBasis;
        const pdfFlexBasis = window.getComputedStyle(pdfPanel).flexBasis;
        
        const container = document.getElementById('container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            startVideoFlex = parseFlexBasis(videoFlexBasis, containerHeight);
            startPdfFlex = parseFlexBasis(pdfFlexBasis, containerHeight);
        } else {
            startVideoFlex = parseFlexBasis(videoFlexBasis, containerWidth);
            startPdfFlex = parseFlexBasis(pdfFlexBasis, containerWidth);
        }
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const container = document.getElementById('container');
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Vertical layout
            const containerHeight = container.clientHeight;
            const deltaY = e.clientY - startY;
            const deltaPercent = (deltaY / containerHeight) * 100;
            
            const newVideoFlex = startVideoFlex + deltaPercent;
            const sizes = applyConstraints(newVideoFlex, containerHeight);
            
            videoPanel.style.flexBasis = `${sizes.video}%`;
            pdfPanel.style.flexBasis = `${sizes.pdf}%`;
        } else {
            // Horizontal layout
            const containerWidth = container.clientWidth;
            const deltaX = e.clientX - startX;
            const deltaPercent = (deltaX / containerWidth) * 100;
            
            const newVideoFlex = startVideoFlex + deltaPercent;
            const sizes = applyConstraints(newVideoFlex, containerWidth);
            
            videoPanel.style.flexBasis = `${sizes.video}%`;
            pdfPanel.style.flexBasis = `${sizes.pdf}%`;
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            divider.classList.remove('dragging');
            
            // Re-render PDF after resize
            if (pdfDoc && currentPage) {
                renderPage(currentPage);
            }
        }
    });
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
