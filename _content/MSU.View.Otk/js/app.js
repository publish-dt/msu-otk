domain = ""; // let удалено, т.к. ошибка возникает, когда через историю браузера возвращаемся назад
hostname = "";
isStaticMode = false;
isAlert = false;
dnsLinks = "dnslink.msu.work.gd";

prefix = "";
StaticResourcesHost = "https://cdn.jsdelivr.net/gh/publish-dt/msu-otk@main"; // надо дополнительно получать этот хост через ajax, т.к. этот CDN может быть недоступен и приложение будет не работоспособно.
cachePathFile = "_cnt";

originalHostname = hostname; // запоминаем изначальный хост, чтобы потом к нему вернуться, после смены на дополнительный хост, когда текущий недоступен
newHosts = {}; // список новых/дополнительных хостов, т.к. текущий недоступен
isNewHost = false; // установлен новый хост, т.к. текущий недоступен



/*window.onerror = function (message, url, line, col, error) {
    if (isAlert) alert(message + "\n В " + line + ":" + col + " на " + url);
};*/


/*document.querySelector('.header').style.setProperty("--header-background", "url('" + StaticResourcesHost + "/_content/MSU.View.Otk/img/header.jpg')");
document.querySelector('body').style.setProperty("--body-background", "url('" + StaticResourcesHost + "/_content/MSU.View.Otk/img/stars.gif')");*/


window.onload = /*async*/ function () {

    /*await*/ getAddressFromDNS(); // получаем первоначальный hostname (его может не быть) из DNS-записи

    onLoadMain();

    if (typeof siteID !== 'undefined' && siteID === 'Poems') backTop();
    if (typeof typeContent !== 'undefined' && typeContent === 'Poem') {
        tooltipstering();
        clearTooltip(); // управление отображением номера стиха Катрена, чтобы он по таймеру пропадал, когда на элементе мышка стоит долго
    }

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
function hiddenTooltip(el) {
    el.style.setProperty("--visibility", "hidden");
}

// управление отображением номера стиха Катрена, чтобы он по таймеру пропадал, когда на элементе мышка стоит долго
function clearTooltip() {

    let listTimeoutID = [];
    Array.prototype.slice.call(document.querySelectorAll('.hint--left')).forEach(function (box) {
        return box.addEventListener('mouseenter', function (event) {
            event.target.style.setProperty("--visibility", "visible");
            timeoutID = window.setTimeout(hiddenTooltip, 1500, event.target);
            listTimeoutID.push([event.target, timeoutID]);
        });
        }
    );
    Array.prototype.slice.call(document.querySelectorAll('.hint--left')).forEach(function (box) {
        return box.addEventListener('mouseleave', function (event) {
            for (let i = 0; i < listTimeoutID.length; i++) {
                if (listTimeoutID[i][0] === event.target) {
                    window.clearTimeout(listTimeoutID[i][1]);
                    listTimeoutID.splice(i, 1);
                    //console.log(listTimeoutID.length);
                    //hiddenTooltip(event.target);
                }
            }
        });
        }
    );

}

// проверка, является ли текущее приложение автономным или работает в статическом режиме, например, через GitHub Pages
function isAutonomy(event) {
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

// для автономного режима получаем путь/байты изображения из БД, когда через механизм браузера не удалось загрузить (не было найдено изображение по указанному пути)
window.getImgData = function (imgEl) {
    if (isAutonomy()) { // это для автономного и статического режима
        let src = imgEl.getAttribute("src");
        imgEl.src = hostname + (src.indexOf('/') === 0 ? "" : "/") + src;
    }
}

// срабатывает при клике по изображению в автономном режиме
function openImg(imgEl) {
    if (location.hostname === "") { // это для автономного режима
        var dataImg = imgEl.getAttribute("src"); //imgEl.src;// document.getElementById(id).src;
        var imgElement = "<img width='100%' src='" + dataImg + "' />";
        var win = window.open();
        win.document.write(imgElement);
    }
}

// это для автономного или статического режима (ссылка на статическом сайте никогда не ищется при работе через htmx)
document.body.addEventListener('htmx:configRequest', function (evt) {
    // здесь использовать await нельзя!

    /*это всё не работает let trigger = evt.detail.elt.getAttribute('hx-trigger');
    if (trigger !== null && trigger.indexOf('load') === 0) isFirstLoadRequest = true;
    else isFirstLoadRequest = false;*/

    if (/*location.hostname === ""*/isAutonomy() || (evt.detail.triggeringEvent !== undefined && evt.detail.triggeringEvent.detail.notfound === true)) { // это для автономного или статического режима или если при предыдущей попытке не найден
        evt.detail.headers['MSU-Dev'] = prefix;
        evt.detail.path = hostname + (evt.detail.path.indexOf('/') === 0 ? "" : "/") + evt.detail.path;

        if (isAlert) alert("hostname = "+hostname);
    }
});

// событие: произошла ошибка при запросе через htmx (например, не найдена страница)
document.body.addEventListener('htmx:responseError', function (evt) {
    if (isAutonomy() && evt.detail.xhr.status === 404) { // на статическом хосте не найдена страница (не была закэширована на стат. сайте)
        reCallRequest(evt);
    }
});

// событие: перед заменой таргета полученными в результате запроса данными
document.body.addEventListener('htmx:beforeSwap', function (evt) {
    if (evt.detail.xhr.status === 404) { // это, ВРОДЕ, для того, чтобы не зацикливалось
        evt.detail.shouldSwap = true;
        evt.detail.isError = false;
        //evt.detail.target = htmx.find("#teapot");
    }
    else if (evt.detail.xhr.status === 500) {
        alert("Произошла ошибка на сервере! Попробуйте позже.");
    }

    let menu = document.getElementById('bs-navbar');
    if(menu.classList.contains('in') === true)
        menu.classList.toggle('in');

});

function reCallRequest(evt) {
    var url = new URL(evt.detail.pathInfo.requestPath, hostname);
    htmx.ajax('GET', /*hostname + /*(evt.detail.pathInfo.requestPath.indexOf('/') === 0 ? "" : "/") + evt.detail.pathInfo.requestPath*/url.pathname, { target: '#main-cont'/*, swap: 'outerHTML'*/ }); // https://v1.htmx.org/api/#ajax
}

// событие: произошла ошибка при запросе через htmx (например, недоступен сервер)
document.body.addEventListener('htmx:sendError', /*async*/ function (evt) {
    let firstTime = false;

    let urls = /*await*/ getAddressFromDNS();
    if (urls !== undefined && urls.length > 0) {

        if (isNewHost === false) firstTime = true;

        isNewHost = false;
        for (var i = 0; i < urls.length; i++) {
            if (newHosts[urls[i]] === undefined) {

                newHosts[urls[i]] = true;
                hostname = urls[i];
                if (isAlert) console.log("Новый хост: " + hostname);
                isNewHost = true;

                reCallRequest(evt);

                break;
            }
            else if (newHosts[urls[i]] === true) {
                newHosts[urls[i]] = false;
            }
        }

        // через 30 мин., после первого изменения хоста, сбрасываем это новое значение и возвращаемся к исходному
        if (firstTime === true && isNewHost === true) {
            setTimeout(function () {

                returnOriginalHostname();

                isNewHost = false;

            }, 60000 * 30);
        }

        if (isNewHost == false) {
            returnOriginalHostname();

            alert("Все сервера недоступны! Попробуйте снова, через некоторое время.")
        }
    }
    else alert("Сервер недоступен! Попробуйте снова, через некоторое время.")
});

function returnOriginalHostname() {
    hostname = originalHostname;
    newHosts = {};
    if (isAlert) console.log("Вернули исходный хост: " + hostname);
}

// получаем хост/url из DNS-записи
/*async*/ function getAddressFromDNS(isOriginDnsLink/* = false*/) {
    if (isOriginDnsLink === undefined) isOriginDnsLink = false;

    if (dnsLinks !== "") {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", "https://dns.google/resolve?name=" + dnsLinks + "&type=TXT");
        xhr.send();

        xhr.onload = function () {
            if (xhr.status === 200) {
                const res = JSON.parse(xhr.response);
                if (res.Answer !== undefined && res.Answer.length > 0) {
                    let data = res.Answer[0].data;
                    var terms = data.split(' ');

                    let urls = [];
                    //for (let item of terms) {
                    for (let i = 0; i < terms.length; i++) {
                        let item = terms[i];

                        let kv = item.split('=');
                        if (!isOriginDnsLink && (kv[0] === "dnslink" || (kv[0] === "origindnslink" && hostname !== kv[1]))) {
                            let domainNew = kv[1];
                            if (domainNew !== undefined && domainNew !== "") urls.push(domainNew);
                        }

                        if (isOriginDnsLink && kv[0] === "origindnslink") {
                            let domainNew = kv[1];
                            if (domainNew !== undefined && domainNew !== "") {
                                hostname = domainNew;
                                originalHostname = domainNew;
                            }
                        }

                    };

                    return urls;
                }
            }
            else {
                if (isAlert) alert("Ошибка при получении доменов: " + xhr.status);
            }
        };

        xhr.onerror = function () { // происходит, только когда запрос совсем не получилось выполнить
            if (isAlert) alert("Ошибка соединения");
        };

        /*let response = await fetch("https://dns.google/resolve?name=" + dnsLinks + "&type=TXT");
        if (response.ok) { // если HTTP-статус в диапазоне 200-299
            res = await response.json();
        } else {
            if (isAlert) alert("Ошибка при получении доменов: " + response.status);
        }*/
    }
}