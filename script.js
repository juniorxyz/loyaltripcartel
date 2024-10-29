// PDF.js initialization
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1.5;

const canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d'),
    viewer = document.getElementById('pdf-viewer'),
    prevButton = document.getElementById('prev'),
    nextButton = document.getElementById('next'),
    zoomInButton = document.getElementById('zoomIn'),
    zoomOutButton = document.getElementById('zoomOut'),
    fullscreenButton = document.getElementById('fullscreen'),
    pageNumSpan = document.getElementById('page_num'),
    pageTotalSpan = document.getElementById('page_count');

viewer.appendChild(canvas);

// Load the PDF
pdfjsLib.getDocument('portfolio.pdf').promise.then(function(pdf) {
    pdfDoc = pdf;
    pageTotalSpan.textContent = pdf.numPages;
    renderPage(pageNum);
});

// Render the page
function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({scale: scale});
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        renderTask.promise.then(function() {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    pageNumSpan.textContent = num;
}

// Page navigation
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onPrevPage() {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}

prevButton.addEventListener('click', onPrevPage);
nextButton.addEventListener('click', onNextPage);

// Zoom functionality
function zoom(factor) {
    scale *= factor;
    renderPage(pageNum);
}

zoomInButton.addEventListener('click', () => zoom(1.1));
zoomOutButton.addEventListener('click', () => zoom(0.9));

// Fullscreen functionality
fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        viewer.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

// Lazy loading
const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            renderPage(pageNum);
            observer.unobserve(entry.target);
        }
    });
}, options);

observer.observe(viewer);
