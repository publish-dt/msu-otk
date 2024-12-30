let prefixDev = "";
let hostname = "http://2.56.88.201";
if (false) { // это режим разработки
    prefixDev = "dev.";
    hostname = hostname+":8081";
}
const staticBase = "https://cdn.jsdelivr.net/gh/publish-dt/msu-otk@main";

window.onload = function () {
    onLoadMain();
    if (typeof siteID !== 'undefined' && siteID === 'Poems') backTop();
    if (typeof typeContent !== 'undefined' && typeContent === 'Poem') tooltipstering();
}

function onLoadMain() {
    let toggleBtn = document.getElementsByClassName('navbar-toggle')[0];
    let menu = document.getElementById('bs-navbar');

    toggleBtn.addEventListener('click', function () {
        menu.classList.toggle('in');
    });
}

function isAutonomy() {
    if (location.hostname === "")
        return true;
    else
        return false;
}

function backTop() {

    let topEl = document.getElementById("back-top");
    topEl.style.display = 'none';
    window.onscroll = function () {
        var scrollTop = window.scrollY || document.body.scrollTop || document.documentElement.scrollTop || 0;
        //console.info("window.scrollY", scrollTop);
        if (scrollTop > 200) {
            topEl.style.display = '';
        } else {
            topEl.style.display = 'none';
        }
    };
    /*topEl.addEventListener('click', function () {
        window.scroll(0, 0);
        return false;
    });*/
}

// устанавливаем для автономного режима путь статических ресурсов (изображений)
function imgSetSrc() {
    if (location.hostname === "") { // это для автономного режима
        let elements = document.getElementsByTagName('img');
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (element == null) continue;

            let src = element.getAttribute("src");
            let imgHost = staticBase;
            if (src.indexOf('cnt/') !== -1) continue; // imgHost = hostname; //  пропускаем изображения из БД
            element.src = imgHost + (src.indexOf('/') === 0 ? "" : "/") + src;
        }
    }
}

// для автономного режима получаем путь/байты изображения
window.getImgData = function (imgEl) {
    if (location.hostname === "") { // это для автономного режима
        imgEl.src = hostname + imgEl.getAttribute("src");
    }
}

function openImg(imgEl) {
    if (location.hostname === "") { // это для автономного режима
        var dataImg = imgEl.getAttribute("src"); //imgEl.src;// document.getElementById(id).src;
        var imgElement = "<img width='100%' src='" + dataImg + "' />";
        var win = window.open();
        win.document.write(imgElement);
    }
}

function tooltipstering() {
    //debugger;
    //alert('test 03');
    let counterNumbPoem = 1;
    const pageMain = document.getElementsByClassName('sm-poem-blok'); // page-main
    if (pageMain.length > 0) pageMainEl = pageMain[0];
    let elements = pageMainEl.children;
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i]
        if (element == null) continue

        if (element.className.toLowerCase() === "page-title" || element.className.toLowerCase() === "next") counterNumbPoem = 1;
        if (element.classList.contains("poem")) {
            element.classList.add('hint--left');
            element.classList.add('hint--no-arrow');
            element.classList.add('hint--no-animate');
            element.setAttribute('aria-label', counterNumbPoem);

            counterNumbPoem++;
        }
    }
}

document.body.addEventListener('htmx:configRequest', function (evt) {
    //debugger;
    if (location.hostname === "") { // это для автономного режима
        evt.detail.headers['MSU-Dev'] = prefixDev;
        evt.detail.path = hostname + (evt.detail.path.indexOf('/') === 0 ? "" : "/") + evt.detail.path; //
    }
});