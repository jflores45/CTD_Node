const http = require("http");
const url = require("url");

const htmlString = `
<!DOCTYPE html>
<html>
<body>
<h1>Clock</h1>
<button id="getTimeBtn">Get the Time</button>
<p id="time"></p>
<script>
document.getElementById('getTimeBtn').addEventListener('click', async () => {
    const res = await fetch('/time');
    const timeObj = await res.json();
    console.log(timeObj);
    const timeP = document.getElementById('time');
    timeP.textContent = timeObj.time;
});
</script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === "/time") {
        res.writeHead(200, {
            "Content-Type": "application/json"
        });
        res.end(JSON.stringify({ time: new Date().toString() }));
    }

    else if (pathname === "/timePage") {
        res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8"
        });
        res.end(htmlString);
    }

    else {
        res.writeHead(404, {
            "Content-Type": "text/plain"
        });
        res.end();
    }
});

server.listen(8000);
