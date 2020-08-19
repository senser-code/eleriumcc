const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const path = require("path");
const config = require("./config.json");
app.use(express.json());
app.use(fileUpload({
    limits: {fileSize: 5000 * 1024 * 1024}
}));

function GenerateString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

app.use(express.static(path.join(__dirname, "uploads")));
app.get("/", (req, res) => res.end(""));
app.get("*", (req, res) => res.status(404).end("Not Found"));

app.post("/upload", async (req, res) => {
    const Keys = require("./keys.json");
    if (!req.files.fdata) return res.status(400).end("fdata is required");
    if (!req.body.key) return res.status(400).end("Key is required");
    const File = req.files.fdata;
    const FileName = `${GenerateString(8)}${path.extname(File.name)}`;
    if (Keys.includes(req.body.key)) {
        await File.mv("./uploads/" + FileName);
        res.end(`${config.url}/${FileName}`);
    } else {
        res.status(401).end("Invaild Key");
    };
});

app.listen(config.port);