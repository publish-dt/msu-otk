domain = ""; // let удалено, т.к. ошибка возникает, когда через историю браузера возвращаемся назад
hostname = "";
isStaticMode = false;
isAlert = false;
dnsLinks = "dnslink.msu.work.gd";

prefix = "";
StaticResourcesHost = "https://cdn.jsdelivr.net/gh/publish-dt/msu-otk@main"; // надо дополнительно получать этот хост через ajax, т.к. этот CDN может быть недоступен и приложение будет не работоспособно.
cachePathFile = "_cnt";

originalHostname = hostname; // запоминаем изначальный хост, чтобы потом к нему вернуться, после смены на дополнительный хост, когда текущий недоступен

let urls = []; // полный список доп. хостов, полученные из DNS TXT-записи
let newHosts = {}; // список новых/дополнительных хостов (т.к. текущий недоступен). Это не полный список, а только те, к которым уже был выполнен запрос, т.е уже знаем рабочий этот хост или недоступный
let isNewHost = false; // установлен новый хост, т.к. текущий недоступен
let numbMinutes = 30; // количество минут, по истечению которых будет сброшен список новых хостов (newHosts)


/*window.onerror = function (message, url, line, col, error) {
    if (isAlert) alert(message + "\n В " + line + ":" + col + " на " + url);
};*/


/*document.querySelector('.header').style.setProperty("--header-background", "url('" + StaticResourcesHost + "/_content/MSU.View.Otk/img/header.jpg')");
document.querySelector('body').style.setProperty("--body-background", "url('" + StaticResourcesHost + "/_content/MSU.View.Otk/img/stars.gif')");*/


window.onload = function () {

    getAddressFromDNS(true); // получаем первоначальный hostname (его может не быть) из DNS-записи

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

function isLoadError() {
    if (document.title === "Ошибка")
        return true;

    return false;
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
    //if (isAutonomy()) { // это для автономного и статического режима
        let src = imgEl.getAttribute("src");
        imgEl.src = hostname + (src.indexOf('/') === 0 ? "" : "/") + src;
    //}
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

    if (isAutonomy() ||  // это для автономного или статического режима
        (evt.detail.triggeringEvent !== undefined && evt.detail.triggeringEvent.detail.notfound === true) || // или если при предыдущей попытке не найден
        isNewHost // или при предыдущей попытке был установлен новый хост, значит и последующие заприсы будем выполнять к этому новому хосту, пока он не сброситься 
    ) {
        evt.detail.headers['MSU-Dev'] = prefix;
        let path = evt.detail.path;
        if (!isAutonomy() && evt.detail.triggeringEvent !== undefined && evt.detail.triggeringEvent.type === "onGetDNS") { // evt.detail.headers["HX-Trigger"] === "main-cont"
            if (path.indexOf('http') !== -1) return new URL(path);
            if (evt.detail.headers["HX-Current-URL"] !== undefined) {
                let hXCurrentURL = evt.detail.headers["HX-Current-URL"];
                let url = new URL(hXCurrentURL);
                path = url.pathname;
            }
        }
        let url = getURL(path);
        evt.detail.path = url.href;// hostname + (evt.detail.path.indexOf('/') === 0 ? "" : "/") + evt.detail.path;

        if (isAlert) alert("hostname = "+hostname);
    }
});

// событие: произошла ошибка при запросе через htmx (например, не найдена страница)
document.body.addEventListener('htmx:responseError', function (evt) {
    if (isAutonomy() && evt.detail.xhr.status === 404 ||  // на статическом хосте не найдена страница (не была закэширована на стат. сайте)
        (evt.detail.xhr.status >= 500 && evt.detail.xhr.status < 600)
    ) {
        callNewServer(evt); //reCallRequest(evt); // выполняем запрос к доп. хосту
    }
});

// событие: перед заменой таргета полученными в результате запроса данными
document.body.addEventListener('htmx:beforeSwap', function (evt) {
    if (evt.detail.xhr.status === 404) { // это, ВРОДЕ, для того, чтобы не зацикливалось
        evt.detail.shouldSwap = true;
        evt.detail.isError = false;
        //evt.detail.target = htmx.find("#teapot");
    }
    else if (evt.detail.xhr.status >= 500 && evt.detail.xhr.status < 600) {
        //alert("Произошла ошибка на сервере! Попробуйте позже.");
        //getAddressFromDNS(false, evt, selNewServer);
        let a = 1;
    }

    let menu = document.getElementById('bs-navbar');
    if(menu.classList.contains('in') === true)
        menu.classList.toggle('in');

});

// дополнительные запросы всегда выполняются не к домену по умолчанию (т.е. на котором открыт сайт), а к доп. хостам (для автономного режима всегда есть доп. хосты)
function reCallRequest(evt) {
    if (hostname !== "") {
        //var url = new URL(evt.detail.pathInfo.requestPath, evt.detail.pathInfo.requestPath.indexOf('http') !== -1 ? '' : hostname);
        let url = getURL(evt.detail.pathInfo.requestPath, hostname);
        htmx.ajax('GET', url.href/*pathname*/, { target: '#main-cont'/*, swap: 'outerHTML'*/ }).then(
            function (result) {
                /* обработает успешное выполнение */
                let a = 1;
            },
            function (error) {
                /* обработает ошибку */
                let a = 2;
            }
        ); // https://v1.htmx.org/api/#ajax
    }
}

// событие: произошла ошибка при запросе через htmx (например, недоступен сервер)
document.body.addEventListener('htmx:sendError', /*async*/ function (evt) {
    callNewServer(evt);
});

function callNewServer(evt) {
    let firstTime = false;

    //let urls = /*await*/ getAddressFromDNS(); // это выполняется через callback
    if (urls !== undefined && urls.length > 0) {

        if (isNewHost === false) firstTime = true;

        isNewHost = false;
        for (var i = 0; i < urls.length; i++) {
            
            if (newHosts[urls[i]] === undefined &&
                urls[i] !== location.origin &&  // нам не надо использовать хост, который совпадает с хостом из адресной строки браузера
                (location.protocol !== "https:" ||
                    (location.protocol === "https:" && urls[i].indexOf('http:') === -1) // http нельзя вызывать из https, по правилам безопасности
                )
            ) {

                newHosts[urls[i]] = true;
                hostname = urls[i];
                if (isAlert) console.log("Новый хост: " + hostname);
                isNewHost = true;

                if (evt !== undefined) reCallRequest(evt);

                break;
            }
            else if (newHosts[urls[i]] === true) {
                newHosts[urls[i]] = false; // отключаем ранее использованный хост
            }
        }

        // через 30 мин., после первого изменения хоста, сбрасываем это новое значение и возвращаемся к исходному
        if (firstTime === true && isNewHost === true) {
            setTimeout(function () {

                returnOriginalHostname();

                isNewHost = false;

            }, 60000 * numbMinutes);
        }

        if (isNewHost == false) {
            returnOriginalHostname();

            alert("Все сервера недоступны! Попробуйте снова, через некоторое время.");
        }
    }
    else alert("Сервер недоступен! Попробуйте снова, через некоторое время.");
}
function returnOriginalHostname() {
    hostname = originalHostname;
    newHosts = {};
    if (isAlert) console.log("Вернули исходный хост: " + hostname);
}

// получаем хост/url из DNS-записи
function getAddressFromDNS(isOriginDnsLink/*, evt, callback*/) {
    if (isOriginDnsLink === undefined) isOriginDnsLink = false;

    if (dnsLinks !== "") {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", "https://dns.google/resolve?name=" + dnsLinks + "&type=TXT");
        xhr.send();

        xhr.onload = function () {
            if (xhr.status === 200) {
                const res = JSON.parse(xhr.response);
                if (res.Answer !== undefined && res.Answer.length > 0) {
                    const data = res.Answer[0].data;
                    dataStr = data.replaceAll("'", '"');
                    try {
                        const dataObj = JSON.parse(dataStr);
                        const siteConf = dataObj.Sites[siteID];

                        if (siteConf !== undefined) {
                            if (siteConf.dnsLinks !== undefined) urls = siteConf.dnsLinks;

                            if (isOriginDnsLink &&
                                siteConf.originDnsLink !== undefined && siteConf.originDnsLink !== ''
                            )
                                originalHostname = siteConf.originDnsLink;

                            if (siteConf.minutes !== undefined) numbMinutes = siteConf.minutes;
                        }
                    } catch (e) {
                        console.error("Ошибка при разборе json-данных из DNS TXT-записи", e.message);
                        if (isAlert) alert("Ошибка при разборе json-данных из DNS TXT-записи. Ошибка: " + e.message);
                    }


                    // если ручной запрос (первое открытие в браузере), при открытии страницы, вернул ошибку, то инициируем событие onGetDNS (используется в hx-trigger)
                    if (urls.length > 0 && isLoadError() || isAutonomy()) {
                        callNewServer();

                        const eventVal = new CustomEvent("onGetDNS", { detail: true });
                        document.getElementById('main-cont').dispatchEvent(eventVal);
                    }
                    //return urls;
                    //if (callback !== undefined) callback(urls, evt);


                    /*var terms = data.split(' ');

                    urls = [];
                    //for (let item of terms) {
                    for (let i = 0; i < terms.length; i++) {
                        let item = terms[i];

                        let kv = item.split('=');
                        if ((kv[0] === "dnslink" || (kv[0] === "origindnslink" && hostname !== kv[1]))) {
                            let domainNew = kv[1];
                            if (domainNew !== undefined && domainNew !== "") urls.push(domainNew);
                        }

                        if (isOriginDnsLink && kv[0] === "origindnslink") {
                            let domainNew = kv[1];
                            if (domainNew !== undefined && domainNew !== "") {
                                //hostname = domainNew;
                                originalHostname = domainNew;
                            }
                        }

                        if (kv[0] === "minutes") {
                            numbMinutes = Number(kv[1]);
                        }
                    };*/
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

function getURL(path, newHostname) {
    let baseUrl = newHostname !== undefined ? newHostname : (path.indexOf('http') !== -1 ? '' : (hostname === "" ? location.origin : hostname));

    if (baseUrl === '') return new URL(path); //baseUrl = undefined;
    else {
        if (path.indexOf('http') === -1) return new URL(path, baseUrl);

        let url = new URL(path);
        return new URL(url.pathname, baseUrl);
    }
}

function loadScript(src, callback) {
    let script = document.createElement('script');
    script.src = src;
    script.onload = function () { callback(script); };
    document.head.append(script);
}




// Create the event.
const event = document.createEvent("Event");

// Define that the event name is 'build'.
event.initEvent("onGetDNS");

// Listen for the event.
/*document.getElementById('main-cont').addEventListener(
    "onGetDNS",
    function (e) {
        debugger;
    },
    false,
);*/
