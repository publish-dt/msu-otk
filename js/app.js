const creds = `
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

var isWS = true; // false

(async () => {

    if (nats_core === undefined || nats_core === null) {
        isWS = false;
        alert("Ваш браузер устарел, и не может поддерживать данное приложение.");
    }
    else {
        //try {
        var nc = await nats_core.wsconnect({
            servers: "wss://connect.ngs.global", //  ws://localhost:81 wss://demo.nats.io:8443 tls://connect.ngs.global
            authenticator: nats_core.credsAuthenticator(new TextEncoder().encode(creds)),
            //user: "client",
            //pass: "12345",
            name: "Client-Web"
        });
        /*} catch (_err) {
            console.log(`error connecting to ${JSON.stringify(_err.message)}`);
        }*/

        console.log(`connected to ${nc.getServer()}`);

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
                    //const data = nats_core.JSONCodec((this_, key, value) => { return value; }).encode({"p": 5});
                    var dataReq = jc.encode({ name: "Alex", path: url }); // ["hello", 5] sc.encode(String(4))

                    var response = await nc.request("MSU.Req.Main", dataReq, { timeout: 5000 }); // MSU.Req.Main
                    //const numbers = nats_core.JSONCodec<number[]>().decode(response.data);
                    res = jc.decode(response.data);
                    if (res.code == undefined && res.result != undefined) {
                        console.log(`Данные от сервиса получены.`);
                        dataResp = res.result.model;
                    }
                    else console.log(`Произошла ошибка в сервисе: ${res.code}, ${res.message}`);
                }
                else {
                    var response = await fetch("http://2.56.88.201" + url); // http://localhost:8888 http://localhost:8080/api/MSU/Main?path=
                    if (response.ok) { // если HTTP-статус в диапазоне 200-299
                        console.log(`Данные от сервиса получены.`);
                        //res0 = await response.text();
                        res = await response.json();
                        //console.log(`Получены данные: ${res.content}`);
                        dataResp = res;
                    } else {
                        alert("Ошибка HTTP: " + response.status);
                    }
                }

                if (dataResp !== undefined) {

                    var el_content = document.querySelector("#Content");

                    /*var el_title = document.querySelector("#Title");
                    el_title.innerHTML = res.Name;
    
                    var el_description = document.querySelector("#Description");
                    el_description.innerHTML = res.Description;*/

                    if (dataResp.content !== undefined) {
                        el_content.innerHTML = dataResp.content;

                        //console.log(`Отображены данные: ${data.content}`);
                        window.scroll(0, 0);
                    }
                }
            } catch (ex) {
                if (ex.code == "503")
                    console.log(`Сервис для ответа не запущен. Ошибка: ${JSON.stringify(ex)}`);
                else if (ex.code == "TIMEOUT")
                    console.log(`Сервис долго не отвечает. Ошибка: ${JSON.stringify(ex)}`);
                else
                    console.log(`Ошибка от сервиса: ${ex}`);
            }



            return 4;
        }

})();
