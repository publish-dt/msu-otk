var creds = `
-----BEGIN NATS USER JWT-----
eyJ0eXAiOiJKV1QiLCJhbGciOiJlZDI1NTE5LW5rZXkifQ.eyJqdGkiOiJXRkpKU0NKNTM0RDZIVDNWQVpHRkpUVVZON0xIT05QSU5OSEFGUVhFWEdaVEU0WTNHMkVRIiwiaWF0IjoxNzI3MTk4NTk5LCJpc3MiOiJBQVBVT000M1NZNFRTSVhURU9aVTdUMlg2VkpIVExKR0RXWjJOWFM3VUhCVlFRTUZXWklYQVVWRyIsIm5hbWUiOiJ3ZWIiLCJzdWIiOiJVQ1YzUlROQk03M0dDSktXRkFVTDJFUUhVQkkyVDVLWkJFNURUQ1dNTzZYWkxHWU0yQkFZRFFVQiIsIm5hdHMiOnsicHViIjp7ImFsbG93IjpbIk1TVS5SZXEuTWFpbiJdfSwic3ViIjp7fSwic3VicyI6LTEsImRhdGEiOi0xLCJwYXlsb2FkIjotMSwiaXNzdWVyX2FjY291bnQiOiJBQkVNR0RSQ01YM0JZQU81RFcyVTVKNllEWlVOTlY0T1BTUkpMQVg2TUg3M0NMWTdUUTNUNzRCTyIsInR5cGUiOiJ1c2VyIiwidmVyc2lvbiI6Mn19.LAhaBMHIkPz9WjRtknkR3DT435Nfc3Tnqe7LssxTLc9yyZM7Qdzz0SMFs86WJQmE3sEs5r2p2dGYDwG5YR-bCw
------END NATS USER JWT------

************************* IMPORTANT *************************
NKEY Seed printed below can be used to sign and prove identity.
NKEYs are sensitive and should be treated as secrets.

-----BEGIN USER NKEY SEED-----
SUAMVOU7IIH2XY4Z3HK77CGLC6EHIGSZITHS77B6AJKK24IGXUWIZKOI4U
------END USER NKEY SEED------

*************************************************************
`;
//var nKey = "";

var prefixDev = "dev."; // 
var isWS = true; // false 

(async () => {

    if (nats_core === undefined || nats_core === null) {
        isWS = false;
        alert("Ваш браузер устарел, и не может поддерживать данное приложение.");
    }
    else {
        try {
            var nc = await nats_core.wsconnect({
                servers: "ws://2.56.88.201:81", //  wss://connect.ngs.global ws://localhost:81 wss://demo.nats.io:8443 tls://connect.ngs.global
                //authenticator: nats_core.nkeyAuthenticator(new TextEncoder().encode(nKey)),
                //authenticator: nats_core.credsAuthenticator(new TextEncoder().encode(creds)),
                user: "web", // создать отдельного пользователя для тестирования
                pass: "web",
                name: "Web-Client"
            });

            console.log(`connected to ${nc.getServer()}`);

        } catch (_err) {
            console.log(`error connecting: ${JSON.stringify(_err.message)}`);
        }

        var sc = new nats_core.StringCodec();
        var jc = new nats_core.JSONCodec();

    }
    boost.onclick = function (event) {
        if (event.target.nodeName != 'A') return;

        let href = event.target.getAttribute('href');
        //alert(href); // может быть подгрузка с сервера, генерация интерфейса и т.п.
        getData(href);

        return false; // отменить действие браузера (переход по ссылке)
    };

    window.addEventListener("unload", async function (e) {

        const done = nc.closed(); // nc.drain(); // drain используется когда есть подписки, чтобы их корректно завершить. И close уже не надо.
        await nc.close();
        const err = await done;
        if (err) {
            console.log(`error closing:`, err);
        }

        //return "Do you really want to close?";  //Webkit, Safari, Chrome
    });


    async function getData(url) {

        try {
            var res = undefined;
            var dataResp = undefined;

            if (isWS) {
                // ЖЕЛАТЕЛЬНО реализовать минимальный набор headers: User-Agent="..."; Method="Get"; Accept="*/*"; 

                //const data = nats_core.JSONCodec((this_, key, value) => { return value; }).encode({"p": 5});
                var dataReq = jc.encode({ path: url, fromSPA: true }); // ["hello", 5] sc.encode(String(4))

                var response = await nc.request(prefixDev + "MSU.Req.Main", dataReq, { timeout: 15000 }); // MSU.Req.Main
                if (response.headers) {
                    /*for (const [key, value] of response.headers) {
                        console.log(`${key}=${value}`);
                    }*/
                    console.error("При получении данных возникла ошибка! Код ошибки: ", response.headers.get("Nats-Service-Error-Code"));
                }
                else {
                    //const numbers = nats_core.JSONCodec<number[]>().decode(response.data);
                    res = jc.decode(response.data);
                    //res = sc.decode(response.data);
                }
            }
            else {
                // http://localhost:8888 http://localhost:8080/api/MSU/Main?path=
                // , { method: "GET", headers: { "Accept": "application/json", "HX-Request": true } }
                // , { headers: { "Content-Type": "application/json", "MSU-Request": true } }
                var response = await fetch("http://2.56.88.201" + url, { headers: { "HX-Request": "true", "MSU-Dev": prefixDev } });
                if (response.ok) { // если HTTP-статус в диапазоне 200-299
                    //res0 = await response.text();
                    res = await response.json();
                } else {
                    alert("Ошибка HTTP: " + response.status);
                }
            }

            if (res !== undefined) {
                if (res.code == undefined && res.content != undefined) {
                    console.log(`Данные от сервиса получены.`);
                    dataResp = res; // res.result.model;
                }
                else console.error(`Произошла ошибка в сервисе: ${res.code}, ${res.message}`);

                if (dataResp !== undefined) {


                    /*var el_title = document.querySelector("#Title");
                    el_title.innerHTML = res.Name;
    
                    var el_description = document.querySelector("#Description");
                    el_description.innerHTML = res.Description;*/

                    //const scriptHTML = `<script>alert("Alert from innerHTML");</script>`;
                    if (dataResp.content !== undefined) {
                        if (url.startsWith("/print/")) {
                            openPage(dataResp.content);
                        }
                        else {
                            var el_content = document.querySelector("#Content");
                            el_content.innerHTML = dataResp.content; // scriptHTML;// 

                            //console.log(`Отображены данные: ${data.content}`);
                            window.scroll(0, 0);
                        }
                    }
                }
            }
        } catch (ex) {
            if (ex.code == "503")
                console.error(`Сервис для ответа не запущен. Ошибка: ${JSON.stringify(ex)}`);
            else if (ex.code == "TIMEOUT")
                console.error(`Сервис долго не отвечает. Ошибка: ${JSON.stringify(ex)}`);
            else
                console.error(`Ошибка от сервиса: ${ex}`);
        }



        return;
    }

    window.getImgData = async (imgEl/*url, id*/) => {
        var res = undefined;
        var data = undefined;
        var url = imgEl.getAttribute("src");

        try {
            if (isWS) {
                var dataReq = jc.encode({ path: url, fromSPA: true });

                var response = await nc.request(prefixDev + "MSU.Req.Files", dataReq, { timeout: 15000 });
                if (response.headers) {
                    /*for (const [key, value] of response.headers) {
                        console.log(`${key}=${value}`);
                    }*/
                    console.error("При получении изображения возникла ошибка! Код ошибки: ", response.headers.get("Nats-Service-Error-Code"));
                }
                else {
                    //imgEl.src = URL.createObjectURL(response.data); // нельзя здесь это использовать, т.к. данные здесь в виде обычных байт, а не подготовленных для передачи изображения через http
                    var base64String = base64js.fromByteArray(response.data);
                    var src = "data:image/jpg;base64," + base64String;
                    imgEl.setAttribute("src", src);
                }
            }
            else {
                var response = await fetch("http://2.56.88.201" + url, { headers: { "HX-Request": "true", "MSU-Dev": prefixDev } });
                /*fetch("http://2.56.88.201" + url)
                    .then(response => response.blob())
                    .then(data =>
                        imgEl.src = URL.createObjectURL(data)
                    );*/

                if (response.ok) { // если HTTP-статус в диапазоне 200-299
                    //res = await response.json();
                    res = await response.blob();
                } else {
                    alert("Ошибка HTTP: " + response.status);
                }

                if (res.code == undefined && res.size != undefined) {
                    console.log(`Данные от сервиса получены.`);
                    data = res; // res.result.model;
                }
                else console.error(`Произошла ошибка в сервисе: ${res.code}, ${res.message}`);

                if (data !== undefined) {
                    imgEl.src = URL.createObjectURL(data);
                }
            }
        } catch (ex) {
            if (ex.code == "503")
                console.error(`Сервис для ответа не запущен. Ошибка: ${JSON.stringify(ex)}`);
            else if (ex.code == "TIMEOUT")
                console.error(`Сервис долго не отвечает. Ошибка: ${JSON.stringify(ex)}`);
            else
                console.error(`Ошибка от сервиса: ${ex}`);
        }

    }

})();


function openImg(imgEl) {
    var dataImg = imgEl.src;// document.getElementById(id).src;
    var imgElement = "<img width='100%' src='" + dataImg + "' />";
    var win = window.open();
    win.document.write(imgElement);
}

function openPage(html) {
    var win = window.open('');
    win.document.open();
    win.document.write(html);
    win.document.close();
}
