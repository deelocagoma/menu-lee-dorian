const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('admin/dashboard.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

const configJs = fs.readFileSync('js/config.js', 'utf8');
const adminJs = fs.readFileSync('js/admin.js', 'utf8');

dom.window.eval(configJs);
dom.window.eval(adminJs);
dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

setTimeout(() => {
    dom.window.adminApp.menuData = { hotelGallery: [{url:"1", title:"1"}] };
    dom.window.adminApp.currentSection = 'gallery';
    dom.window.adminApp.renderCurrentSection();
    
    setTimeout(() => {
        try {
            console.log("tempGallery before click:", dom.window.adminApp._tempGallery);
            dom.window.adminApp.addGallerySlide();
            console.log("tempGallery after click:", dom.window.adminApp._tempGallery);
            console.log("HTML inside galleryEditorList:", dom.window.document.getElementById('galleryEditorList').innerHTML.length, "bytes");
        } catch (e) {
            console.error("Error clicking button:", e);
        }
    }, 500);
}, 500);
