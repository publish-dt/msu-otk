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


if(nats_core === undefined || nats_core === null) alert("Ваш браузер устарел, и не может поддерживать данное приложение.");
else {
        
(async () => {

    const nc = await nats_core.wsconnect({
        servers: "wss://connect.ngs.global", //  ws://localhost:8080 wss://demo.nats.io:8443 tls://connect.ngs.global
        authenticator: nats_core.credsAuthenticator(new TextEncoder().encode(creds)),
        //user: "client",
        //pass: "12345",
        name: "Client-Web"
    });

    console.log(`connected to ${nc.getServer()}`);

    const sc = new nats_core.StringCodec();
    const jc = new nats_core.JSONCodec();


    boost.onclick = function (event) {
        if (event.target.nodeName != 'A') return;

        let href = event.target.getAttribute('href');
        alert(href); // может быть подгрузка с сервера, генерация интерфейса и т.п.
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
            //const data = nats_core.JSONCodec((this_, key, value) => { return value; }).encode({"p": 5});
            const data = jc.encode({ name: "Alex", path: url }); // ["hello", 5] sc.encode(String(4))
            try {
                rep = await nc.request("MSU.Req.Main", data, { timeout: 5000 });
                //const numbers = nats_core.JSONCodec<number[]>().decode(rep.data);
                var res = jc.decode(rep.data);
                if (res.error == undefined) {
                    console.log(`Данные от сервиса получены.`);

                    /*var el_title = document.querySelector("#Title");
                    el_title.innerHTML = res.Name;

                    var el_description = document.querySelector("#Description");
                    el_description.innerHTML = res.Description;*/

                    var el_content = document.querySelector("#Content");
                    el_content.innerHTML = res.content;
                    window.scroll(0, 0);
                }
                else
                    console.log(`Произошла ошибка в сервисе: ${res.error}`);
            } catch (ex) {
                if (ex.code == "503")
                    console.log(`Сервис для ответа не запущен. Ошибка: ${JSON.stringify(ex)}`);
                else if (ex.code == "TIMEOUT")
                    console.log(`Сервис долго не отвечает. Ошибка: ${JSON.stringify(ex)}`);
                else
                    console.log(`Ошибка от сервиса: ${JSON.stringify(ex)}`);
            }


        } catch (_err) {
            console.log(`error connecting to ${JSON.stringify(_err.message)}`);
        }

        return 4;
    }
})();
}
