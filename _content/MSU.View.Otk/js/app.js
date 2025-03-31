// let удалено (у тех, которые ещё раз присваиваются (в файле conf.js)), т.к. ошибка возникает, когда через историю браузера возвращаемся назад
domain = "";
hostname = "";
isStaticMode = false;
isAlert = false;
dnsLinks = "dnslink.msu.linkpc.net";
sendExtSPA = true; // подменять, для htmx, расширение отправляемого запроса на .spa

prefix = "";
StaticResourcesHost = "https://cdn.jsdelivr.net/gh/publish-dt/msu-otk@main"; // надо дополнительно получать этот хост через ajax, т.к. этот CDN может быть недоступен и приложение будет не работоспособно.
cachePathFile = "_cnt";

originalHostname = hostname; // запоминаем изначальный хост, чтобы потом к нему вернуться, после смены на дополнительный хост, когда текущий недоступен

let isQuoteRequestVal = false;
let isExtRequestVal = true;

let urls = []; // полный список доп. хостов, полученные из DNS TXT-записи
let newHosts = {}; // список новых/дополнительных хостов (т.к. текущий недоступен). Это не полный список, а только те, к которым уже был выполнен запрос, т.е уже знаем рабочий этот хост или недоступный
let isNewHost = false; // установлен новый хост, т.к. текущий недоступен
let numbMinutes = 30; // количество минут, по истечению которых будет сброшен список новых хостов (newHosts)
let numbTryLoadImg = {}; // попытки загрузок изображений при ошибке их загрузке
let isIE = false;

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
    //debugger;
    //if (isIE) startReplaceDataStream(); // это не правильно здесь использовать, т.к. onload срабатывает только после полной/окончательной загрузки всех данных, а у нас загружаться может в несколько этапов поток
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

// если сменился хост, то и изображения загружаем с нового хоста (т.к. старый недоступен, а значит будет ошибка загрузки, которая сюда приведёт),
// а так же это для автономного режима получаем путь / байты изображения из БД, когда через механизм браузера не удалось загрузить(не было найдено изображение по указанному пути)
window.getImgData = function (imgEl) {
    if (isAutonomy() || hostname !== "") { // это для автономного и статического режима
        const src = imgEl.getAttribute("src");
        const srcFull = hostname + (src.indexOf('/') === 0 ? "" : "/") + src;

        // ведём учёт попыток неудавшихся загрузок изображений. Только одна повторная попытка с того же хоста. (это нужно, чтобы не зацикливалась попытка загрузки изображений с одного и того же хоста)
        if (numbTryLoadImg[srcFull] === undefined) {
            numbTryLoadImg[srcFull] = true;
            imgEl.src = srcFull;
        }
        else {
            delete numbTryLoadImg[srcFull]; // удаляем использованную попытку загрузки конкретного изображения
        }
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

    //это всё не работает let trigger = evt.detail.elt.getAttribute('hx-trigger');
    //if (trigger !== null && trigger.indexOf('load') === 0) isFirstLoadRequest = true;
    //else isFirstLoadRequest = false;

    let detail = evt.detail;
    if (detail.headers["HX-Trigger"] !== undefined && detail.headers["HX-Trigger"] !== null && detail.headers["HX-Trigger"].indexOf('msu-') !== 0) return; // для всех триггеров, которые не начинаются с msu- не выполняем нижележащий код, например, для триггера "quote-block". Т.к. иначе подставляются к запросу .spa

    let path = detail.path;

    if (isAutonomy() ||  // это для автономного или статического режима
        (evt.detail.triggeringEvent !== undefined && evt.detail.triggeringEvent.detail.notfound === true) || // или если при предыдущей попытке не найден
        isNewHost // или при предыдущей попытке был установлен новый хост, значит и последующие заприсы будем выполнять к этому новому хосту, пока он не сброситься 
    ) {
        //// это нужно только только для IE11, когда срабатывает событие "msu-on-get-dns"
        //if (typeof window.CustomEvent === "function" &&
        //    (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > -1)) {
        //    detail = evt.detail.detail;
        //}

        detail.headers['MSU-Dev'] = prefix;
        path = detail.path;
        if (!isAutonomy() && detail.triggeringEvent !== undefined && detail.triggeringEvent.type === "msu-on-get-dns") { // detail.headers["HX-Trigger"] === "main-cont"
            //if (path.indexOf('http') !== -1) return new URL(path);
            if (detail.headers["HX-Current-URL"] !== undefined) {
                let hXCurrentURL = detail.headers["HX-Current-URL"];
                let url = new URL(hXCurrentURL);
                path = url.pathname;
            }
        }
    }

    let url = getURL(path);
    detail.path = (sendExtSPA && detail.boosted && detail.path.indexOf('.spa') === -1) ? (detail.path.replace(".html", '') + (url.pathname === "/" ? "index" : "") + ".spa") : url.href; // подставляем .spa, при необходимости

    // при каждом новом переходе по ссылке кроме основного контента подгружается дополнительный - ext и пр.
    if (detail.boosted && detail.triggeringEvent.type !== "msu-ext-data" && detail.triggeringEvent.type !== "msu-ext-quote")
        if (isExtRequestVal) htmx.trigger("#api-ext", "msu-ext-data"); // вместо "click from:a""
        else if (isQuoteRequestVal) htmx.trigger("#quote-block", "msu-ext-quote"); // вместо "click from:a""

    if (isAlert) alert("hostname = "+hostname);
});


document.body.addEventListener('htmx:beforeOnLoad', function (evt) {
    returnOriginalExtension(evt); // это для возрвата нового расширения запроса в исходное расширения (например, .spa возвращаем в .html или в пустое расширение)
});

// событие: произошла ошибка при запросе через htmx (например, не найдена страница или ошибка 500)
document.body.addEventListener('htmx:responseError', function (evt) {
    if (isAutonomy() && evt.detail.xhr.status === 404 ||  // на статическом хосте не найдена страница (не была закэширована на стат. сайте)
        (evt.detail.xhr.status >= 500 && evt.detail.xhr.status < 600)
    ) {
        if (evt.detail.boosted) callNewServer(evt); // выполняем повторный запрос к доп. хосту (только для запроса основного контента (не для ext и пр.))
    }
});

// событие: произошла ошибка при запросе через htmx (например, недоступен сервер)
document.body.addEventListener('htmx:sendError', /*async*/ function (evt) {
    callNewServer(evt);
    //returnOriginalExtension(evt);
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

    if (evt.detail.boosted && evt.srcElement.offsetParent.firstChild && evt.srcElement.offsetParent.firstChild.getAttribute('id') === "quote-block")
        evt.detail.target = htmx.find("#main-cont"); // т.к. у элемента quote-block hx-target="this", то нужно его заменить на #main-cont, иначе основной контент прямо в quote-block выводится

});

// это для возрвата нового расширения запроса в исходное расширения (например, .spa возвращаем в .html или в пустое расширение)
function returnOriginalExtension(evt) {
    if (evt.detail.elt.localName == 'a') {
        const url = new URL(evt.detail.elt.href);

        evt.detail.pathInfo.responsePath = url.pathname;
        evt.detail.requestConfig.path = url.pathname;
    }
}

// дополнительные запросы всегда выполняются не к домену по умолчанию (т.е. на котором открыт сайт), а к доп. хостам (для автономного режима всегда есть доп. хосты)
function reCallRequest(evt) {
    if (hostname !== "") {
        //var url = new URL(evt.detail.pathInfo.requestPath, evt.detail.pathInfo.requestPath.indexOf('http') !== -1 ? '' : hostname);
        let url = getURL(evt.detail.pathInfo.requestPath, hostname);
        let path = (sendExtSPA && evt.detail.boosted && url.href.indexOf('.spa') === -1) ? (url.href.replace(".html", '') + (url.pathname === "/" ? "index" : "") + ".spa") : url.href;
        htmx.ajax('GET', path/*pathname*/, { target: '#main-cont'/*, swap: 'outerHTML'*/ }).then(
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

function callNewServer(evt) {
    let firstTime = false;

    //let urls = /*await*/ getAddressFromDNS(); // это выполняется через callback
    if (urls !== undefined && urls.length > 0) {

        if (isNewHost === false) firstTime = true;

        isNewHost = false;
        for (var i = 0; i < urls.length; i++) {
            
            if (newHosts[urls[i]] === undefined && // этот хост мы ещё не использовали
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

            //if (evt.detail.target.getAttribute('id') === "main-cont")
                alert("Все сервера недоступны! Попробуйте снова, через некоторое время.");
        }
    }
    else
        if (evt.detail.boosted /*evt.detail.target.getAttribute('id') === "main-cont"*/)
            alert("Сервер недоступен! Попробуйте снова, через некоторое время."); // это нужно отображать только для основного контента, а для ext и пр. не надо.
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
                    const re = /'/gi;
                    dataStr = data.replace(re, '"');
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
                        console.error("Ошибка при разборе json-данных из DNS TXT-записи. Ошибка:", e.message);
                        if (isAlert) alert("Ошибка при разборе json-данных из DNS TXT-записи. Ошибка: " + e.message);
                    }


                    // если ручной запрос (первое открытие в браузере), при открытии страницы, вернул ошибку, то инициируем событие msu-on-get-dns (используется в hx-trigger)
                    if (urls.length > 0 && isLoadError() || isAutonomy()) {
                        callNewServer();

                        htmx.trigger('#main-cont', "msu-on-get-dns", { detail: true });
                        /*const eventVal = new CustomEvent("msu-on-get-dns", { detail: true });
                        document.getElementById('main-cont').dispatchEvent(eventVal);*/
                    }
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

function isExtRequest() {
    return isExtRequestVal;
}
function isQuoteRequest() {
    return isQuoteRequestVal;
}

/* Плагин для HTMX - обработка JSON-данных, полученных с сервера */
htmx.defineExtension('json-response', {
    transformResponse: function (text, xhr, elt) {
        //var mustacheTemplate = htmx.closest(elt, '[mustache-template]')
        var apiName = elt.getAttribute('id')
        //debugger
        if (apiName === 'api-ext') {
            var data = JSON.parse(text)
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    var targetElt = htmx.find(data[i].target)
                    if (targetElt) {
                        targetElt.innerHTML = data[i].content;

                        // для БВ очищаем подпись-ссылку на Послание
                        if (data[i].target === "#quote-block" && siteID.indexOf("OTK") !== 0) {
                            var signature = htmx.find("#signature");
                            if (signature.parentNode) {
                                signature.parentNode.removeChild(signature);
                            }
                            //signature.remove();
                        }

                        htmx.process("#quote-block"); // document.body
                    }
                }
                return "";
            } else {
                throw new Error('С сервера пришли пустые данные')
            }
        }
    }
})

/* обработка StreamRendering */
/*class Ii extends HTMLElement {
    // срабатывает при поступлении каждой новой порции данных из потока рендеринга Блазор
    connectedCallback() {
        //alert('asd')
        const e = this.parentNode;
        e.parentNode?.removeChild(e),
            e.childNodes.forEach((e => {
                if (e instanceof HTMLTemplateElement) {
                    replaceDataStream(e);
                }
            }
            ))
    }
}
customElements.define("blazor-ssr-end", Ii)

// замена предварительного контента на основной контент, который был загружен с задержкой в режиме потока (StreamRendering)
function replaceDataStream(templateElement) {
    // Get the blazor-component-id attribute value
    const componentId = templateElement.getAttribute('blazor-component-id');

    // Find the corresponding start and end comments
    let startComment = findComment('bl:' + componentId);
    let endComment = findComment('/bl:' + componentId);

    if (startComment === null && endComment === null) {
        const targetName = templateElement.content.cloneNode(true).firstChild.getAttribute('msu-component-target');
        if (targetName !== null) {
            startComment = findComment('bl:'+componentId, targetName);
            endComment = findComment('/bl:'+componentId, targetName);
        }
    }

    // If both start and end comments are found
    if (startComment && endComment) {
        // Get the parent node (container) of the comments
        const containerNode = startComment.parentNode;

        // Create a temporary document fragment to hold the template content
        const tempFragment = document.createDocumentFragment();
        tempFragment.appendChild(templateElement.content.cloneNode(true));

        // Replace the content between start and end comments with template content
        let currentNode = startComment.nextSibling;
        while (currentNode && currentNode !== endComment) {
            containerNode.removeChild(currentNode);
            currentNode = startComment.nextSibling;
        }

        // Insert each child node of the fragment before the endComment
        while (tempFragment.firstChild) {
            containerNode.insertBefore(tempFragment.firstChild, endComment);
        }

        // Remove the template element
        templateElement.remove();
    }
}

// Function to find a comment node based on its text content
function findComment(textContent, targetName) {
    if (targetName === undefined || targetName === null || targetName === '') targetName = 'main-cont';
    const allNodes = document.getElementById(targetName).childNodes; //document.body.childNodes;
    for (let i = 0; i < allNodes.length; i++) {
        if (allNodes[i].nodeType === Node.COMMENT_NODE && allNodes[i].textContent.trim() === textContent) {
            return allNodes[i];
        }
    }
    return null;
}

// начало обработки StreamRendering
function startReplaceDataStream() {

    //const ssrElements = document.querySelectorAll('blazor-ssr');

    Array.prototype.slice.call(document.querySelectorAll('blazor-ssr')).forEach(function (ssrElement) {
        // Get all template elements with blazor-component-id attribute
        //const templateElements = document.querySelectorAll('template[blazor-component-id]');

        // Iterate through each template element
        Array.prototype.slice.call(document.querySelectorAll('template[blazor-component-id]')).forEach(function (templateElement) {
            replaceDataStream(templateElement);
        });

        ssrElement.remove();
    });
}*/




function loadScript(src, callback) {
    let script = document.createElement('script');
    script.src = src;
    script.onload = function () { callback(script); };
    document.head.append(script);
}


// Create the event.
//const event = document.createEvent("Event");
// Define that the event name is 'build'.
//event.initEvent("msu-on-get-dns");

// Listen for the event.
/*document.getElementById('main-cont').addEventListener(
    "msu-on-get-dns",
    function (e) {
        debugger;
    },
    false,
);*/


if (navigator.userAgent.indexOf('MSIE') !== -1
    || navigator.appVersion.indexOf('Trident/') > -1) {

    isIE = true;

    /* Polyfill URL method IE 11 */
    // ES5
    if (typeof window.URL !== 'function') {
        window.URL = function (url, base) {
            let ind = url.indexOf('http') === 0 ? 1 : 0;

            var protocol = ind === 0 ? '' : url.split('//')[0],
                comps = url.split('#')[0].replace(/^(https\:\/\/|http\:\/\/)|(\/)$/g, '').split('/'),
                host = ind === 0 ? '' : comps[0],
                search = comps[comps.length - 1].split('?')[1],
                tmp = host.split(':'),
                port = ind === 0 ? '' : tmp[1],
                hostname = ind === 0 ? '' : tmp[0];

            if (base !== undefined && base !== null) {
                var protocol = base.split('//')[0],
                comps2 = base.split('#')[0].replace(/^(https\:\/\/|http\:\/\/)|(\/)$/g, '').split('/'),
                host = comps2[0],
                tmp = host.split(':'),
                port = tmp[1],
                hostname = tmp[0];
            }

            search = typeof search !== 'undefined' ? '?' + search : '';

            var params = [];
            //// выдаёт ошибку, поэтому закомментировано
            //if (search !== "") {
            //    params = search
            //        .slice(1)
            //        .split('&')
            //        .map(function (p) { return p.split('='); })
            //        .reduce(function (p, c) {
            //            var parts = c.split('=', 2).map(function (param) { return decodeURIComponent(param); });
            //            if (parts.length == 0 || parts[0] != param) return (p instanceof Array) && !asArray ? null : p;
            //            return asArray ? p.concat(parts.concat(true)[1]) : parts.concat(true)[1];
            //        }, []);
            //}

            return {
                hash: url.indexOf('#') > -1 ? url.substring(url.indexOf('#')) : '',
                protocol: protocol,
                host: host,
                hostname: hostname,
                href: (protocol !== "" ? (protocol + '//' + host) : "") + "/" + url,
                pathname: '/' + comps.splice(ind).map(function (o) { return /\?/.test(o) ? o.split('?')[0] : o; }).join('/'),
                search: search,
                origin: protocol !== "" ? (protocol + '//' + host) : "",
                port: typeof port !== 'undefined' ? port : '',
                searchParams: {
                    get: function (p) {
                        return p in params ? params[p] : ''
                    },
                    getAll: function () { return params; }
                }
            };
        }
    }
    /* Polyfill IE 11 end */

    /* это для работы с StreamRendering */
    /*if (typeof HTMLTemplateElement === 'undefined') {
        (function () {

            var TEMPLATE_TAG = 'template';

            HTMLTemplateElement = function () { }
            HTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);

            HTMLTemplateElement.decorate = function (template) {
                if (template.content) {
                    return;
                }
                template.content = template.ownerDocument.createDocumentFragment();
                var child;
                while (child = template.firstChild) {
                    template.content.appendChild(child);
                }
            }

            HTMLTemplateElement.bootstrap = function (doc) {
                var templates = doc.querySelectorAll(TEMPLATE_TAG);
                Array.prototype.forEach.call(templates, function (template) {
                    HTMLTemplateElement.decorate(template);
                });
            }

            // auto-bootstrapping
            // boot main document
            addEventListener('DOMContentLoaded', function () {
                HTMLTemplateElement.bootstrap(document);
            });
            
        })();
    }*/
}
else {


}

