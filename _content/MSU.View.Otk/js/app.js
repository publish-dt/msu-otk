let domain = "";
let hostname = "";
let isStaticMode = false;

let prefix = "";
let StaticResourcesHost = "https://cdn.jsdelivr.net/gh/publish-dt/msu-otk@main"; // надо дополнительно получать этот хост через ajax, т.к. этот CDN может быть недоступен и приложение будет не работоспособно.
let cachePathFile = "_cnt";



/*document.querySelector('.header').style.setProperty("--header-background", "url('" + StaticResourcesHost + "/_content/MSU.View.Otk/img/header.jpg')");
document.querySelector('body').style.setProperty("--body-background", "url('" + StaticResourcesHost + "/_content/MSU.View.Otk/img/stars.gif')");*/


window.onload = function () {
    onLoadMain();

    if (typeof siteID !== 'undefined' && siteID === 'Poems') backTop();
    if (typeof typeContent !== 'undefined' && typeContent === 'Poem') {
        tooltipstering();
        clearTooltip(); // управление отображением номера стиха Катрена, чтобы он по таймеру пропадал, когда на элементе мышка стоит долго
    }

}

// управление отображением номера стиха Катрена, чтобы он по таймеру пропадал, когда на элементе мышка стоит долго
function hiddenTooltip(el) {
    el.style.setProperty("--visibility", "hidden");
}

// самые первые действия сразу после загрузки всех ресурсов сайта
function onLoadMain() {

    // кнопка "гамбургер"
    let toggleBtn = document.getElementsByClassName('navbar-toggle')[0];
    let menu = document.getElementById('bs-navbar');
    toggleBtn.addEventListener('click', function () {
        menu.classList.toggle('in');
    });

}

// управление отображением номера стиха Катрена, чтобы он по таймеру пропадал, когда на элементе мышка стоит долго
function clearTooltip() {

    let listTimeoutID = [];
    document.querySelectorAll('.hint--left').forEach(box =>
        box.addEventListener('mouseenter', function (event) {
            event.target.style.setProperty("--visibility", "visible");
            timeoutID = window.setTimeout(hiddenTooltip, 1500, event.target);
            listTimeoutID.push([event.target, timeoutID]);
        })
    );
    document.querySelectorAll('.hint--left').forEach(box =>
        box.addEventListener('mouseleave', function (event) {
            for (let i = 0; i < listTimeoutID.length; i++) {
                if (listTimeoutID[i][0] === event.target) {
                    window.clearTimeout(listTimeoutID[i][1]);
                    listTimeoutID.splice(i, 1);
                    //console.log(listTimeoutID.length);
                    //hiddenTooltip(event.target);
                }
            }
        })
    );

}

// проверка, является ли текущее приложение автономным или работает в статическом режиме, например, через GitHub Pages
function isAutonomy(v) {
    if (location.hostname === "" || isStaticMode === true)
        return true;
    else
        return false;
}

// кнопка "Наверх сайта"
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
            let imgHost = StaticResourcesHost;
            if (src.indexOf(cachePathFile+'/') !== -1) continue; // imgHost = hostname; //  пропускаем изображения из БД
            element.src = imgHost + (src.indexOf('/') === 0 ? "" : "/") + src;
        }
    }
}

// для автономного режима получаем путь/байты изображения из БД
window.getImgData = function (imgEl) {
    if (isAutonomy()) { // это для автономного или статического режима
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

document.body.addEventListener('htmx:configRequest', function (evt) {
    if (true || location.hostname === "" || (evt.detail.triggeringEvent !== undefined && evt.detail.triggeringEvent.detail.notfound === true)) { // это для автономного режима или если при предыдущей попытке не найден
        evt.detail.headers['MSU-Dev'] = prefix;
        evt.detail.path = hostname + (evt.detail.path.indexOf('/') === 0 ? "" : "/") + evt.detail.path;

        //alert("hostname = "+hostname);
    }
});

document.body.addEventListener('htmx:responseError', function (evt) {
    if (location.hostname !== "" && evt.detail.xhr.status === 404) { // на статическом хосте не найдена страница (не была закэширована на стат. сайте)
        let trigger = evt.detail.elt.getAttribute('hx-trigger');
        if (trigger === null) {
            trigger = "click";
            htmx.trigger(evt.detail.elt, trigger, { notfound: true });
        }
        else {
            //var base = document.getElementsByTagName('base')[0].getAttribute("href");
            htmx.ajax('GET', hostname + (evt.detail.pathInfo.requestPath.indexOf('/') === 0 ? "" : "/") + evt.detail.pathInfo.requestPath, { target: '#main-cont'/*, swap: 'outerHTML'*/ }); // https://v1.htmx.org/api/#ajax
        }
    }
});
