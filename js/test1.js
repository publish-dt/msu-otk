window.onload = function () {
    alert('asd');
    document.getElementById('dateF').innerHTML = getCurTime();

    function getCurTime() {
        var date = new Date();
        var dateF = ("0" + date.getDate()).slice(-2) + "." + ("0" + (date.getMonth() + 1)).slice(-2) + "." + ("0" + date.getFullYear() % 100).slice(-2) + " " + ("0" + (date.getHours())).slice(-2) + ":" + ("0" + (date.getMinutes())).slice(-2); // дата в формате 08.02.2020 13:02
        return dateF;
    }
}
