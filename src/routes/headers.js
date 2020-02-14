module.exports = {
        attachCORSHeaders: function (res) {
        res.header('Access-Control-Allow-Origin', ['*']);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        return res;
    }
}