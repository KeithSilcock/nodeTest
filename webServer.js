

const express = require('express'); // require in node is == <script> in html
const webServer = express();

//server.get('PATH', Callbackfunction)

// webServer.get('/', function (request, response) {
//     //request is communication from client to server
//     //response is from server to client
//
//     // response.send('Who let you in here?')
//     response.sendFile(__dirname + '/html/index.html')
// });
// webServer.get('/foot', function (request, response) {
//     response.send('Theres a murderer afoot')
// });

function doMath(n1, n2, op) {
    n1 = Number(n1);
    n2 = Number(n2);
    let opHandler = {
        'plus': () => n1+n2,
        '-': () => n1-n2,
        '*': () => n1*n2,
        '/': () => n1/n2,
    };
    return opHandler[op](n1,n2);
}

function handleMathPath(req, res) {
    console.log( req.query );
    let n1 = req.query.n1;
    let n2 = req.query.n2;
    let op = req.query.op;
    console.log(n1, n2, op)

    return doMath(n1, n2, op);
}

webServer.get('/math', function (req, res) {
    let answer = handleMathPath(req, res);

    let mapKey = {
        'plus': '+',
        'minus': '-',
        'multiply': '*',
        'divide': '/',
    };

    res.send(`${req.query.n1} ${mapKey[req.query.op]} ${req.query.n2} = ${answer.toString()}`)
})

webServer.use( express.static(__dirname + '/html'));
// webServer.use( express.static(__dirname + '/mBoutique'));



webServer.listen(3000, () => console.log('hear'));







