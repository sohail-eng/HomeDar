// Remove "This month" and "This year" links from ProductView admin date hierarchy
(function() {
    'use strict';
    
    function removeDateHierarchyLinks() {
        // Find the date hierarchy container - Django admin uses different classes
        const dateHierarchy = document.querySelector('.xfull') || 
                             document.querySelector('#changelist-filter') ||
                             document.querySelector('.module.filtered');
        
        if (!dateHierarchy) {
            return;
        }
        
        // Find all links in the date hierarchy
        const links = dateHierarchy.querySelectorAll('a');
        
        links.forEach(function(link) {
            const linkText = link.textContent.trim();
            // Remove "This month" and "This year" links (case-insensitive)
            const lowerText = linkText.toLowerCase();
            if (lowerText === 'this month' || lowerText === 'this year') {
                // Try to find and remove the parent element (usually a span or div)
                let elementToRemove = link;
                
                // Check if link is inside a span or other container
                if (link.parentElement && 
                    (link.parentElement.tagName === 'SPAN' || 
                     link.parentElement.tagName === 'DIV')) {
                    elementToRemove = link.parentElement;
                }
                
                // Remove the element
                if (elementToRemove && elementToRemove.parentElement) {
                    // Also remove any trailing separator (|) if it exists
                    const nextSibling = elementToRemove.nextSibling;
                    if (nextSibling) {
                        if (nextSibling.nodeType === Node.TEXT_NODE) {
                            const text = nextSibling.textContent.trim();
                            if (text === '|' || text.startsWith('|')) {
                                nextSibling.remove();
                            }
                        } else if (nextSibling.nodeType === Node.ELEMENT_NODE && 
                                   nextSibling.textContent.trim() === '|') {
                            nextSibling.remove();
                        }
                    }
                    elementToRemove.remove();
                }
            }
        });
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeDateHierarchyLinks);
    } else {
        removeDateHierarchyLinks();
    }
    
    // Also run after a short delay to catch dynamically loaded content
    setTimeout(removeDateHierarchyLinks, 100);
    setTimeout(removeDateHierarchyLinks, 500);
    
    // Also run after AJAX updates (in case Django admin uses AJAX)
    const observer = new MutationObserver(function(mutations) {
        removeDateHierarchyLinks();
    });
    
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
})();

