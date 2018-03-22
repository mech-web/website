"use strict";
//---------------------------------------------------------------------
// Server
//---------------------------------------------------------------------
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var fs = require("fs");
var path = require("path");
var express = require("express");
var bodyParser = require("body-parser");
var config_1 = require("../config");
var persisted_1 = require("./databases/persisted");
var http_1 = require("./databases/node/http");
var server_1 = require("./databases/node/server");
var runtime_1 = require("./runtime");
var runtimeClient_1 = require("./runtimeClient");
var browserSession_1 = require("./databases/browserSession");
var eveSource = require("./eveSource");
//---------------------------------------------------------------------
// Constants
//---------------------------------------------------------------------
var contentTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".map": "application/javascript",
    ".css": "text/css",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
};
var shared = new persisted_1.PersistedDatabase();
global["browser"] = false;
//---------------------------------------------------------------------
// HTTPRuntimeClient
//---------------------------------------------------------------------
var HTTPRuntimeClient = (function (_super) {
    __extends(HTTPRuntimeClient, _super);
    function HTTPRuntimeClient() {
        var _this = this;
        var server = new server_1.ServerDatabase();
        var dbs = {
            "http": new http_1.HttpDatabase(),
            "server": server,
            "shared": shared,
            "browser": new runtime_1.Database(),
        };
        _this = _super.call(this, dbs) || this;
        _this.server = server;
        return _this;
    }
    HTTPRuntimeClient.prototype.handle = function (request, response) {
        this.server.handleHttpRequest(request, response);
    };
    HTTPRuntimeClient.prototype.send = function (json) {
        // there's nothing for this to do.
    };
    return HTTPRuntimeClient;
}(runtimeClient_1.RuntimeClient));
//---------------------------------------------------------------------
// Express app
//---------------------------------------------------------------------
function handleStatic(request, response) {
    var url = request['_parsedUrl'].pathname;
    var roots = [".", config_1.config.eveRoot];
    var completed = 0;
    var results = {};
    var _loop_1 = function (root) {
        var filepath = path.join(root, url);
        fs.stat(filepath, function (err, result) {
            completed += 1;
            if (!err)
                results[root] = fs.readFileSync(filepath);
            if (completed === roots.length) {
                for (var _i = 0, roots_1 = roots; _i < roots_1.length; _i++) {
                    var root_1 = roots_1[_i];
                    if (results[root_1]) {
                        response.setHeader("Content-Type", contentTypes[path.extname(url)] + "; charset=utf-8");
                        response.end(results[root_1]);
                        return;
                    }
                }
                return response.status(404).send("Looks like that asset is missing.");
            }
        });
    };
    for (var _i = 0, roots_2 = roots; _i < roots_2.length; _i++) {
        var root = roots_2[_i];
        _loop_1(root);
    }
    ;
}
function createExpressApp() {
    var filepath = config_1.config.path;
    var app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.get("/build/workspaces.js", function (request, response) {
        var packaged = eveSource.pack();
        response.setHeader("Content-Type", "application/javascript; charset=utf-8");
        response.end(packaged);
    });
    app.get("/assets/*", handleStatic);
    app.get("/build/*", handleStatic);
    app.get("*", function (request, response) {
        var client;
        // @FIXME: When Owner.both is added this needs updated.
        if (config_1.config.runtimeOwner === config_1.Owner.server) {
            client = new HTTPRuntimeClient();
            var content = "";
            if (filepath)
                content = fs.readFileSync(filepath).toString();
            client.load(content, "user");
            client.handle(request, response);
        }
        if (config_1.config.runtimeOwner === config_1.Owner.client || client && !client.server.handling) {
            response.setHeader("Content-Type", contentTypes["html"] + "; charset=utf-8");
            response.end(fs.readFileSync(path.join(config_1.config.eveRoot, "index.html")));
        }
    });
    app.post("*", function (request, response) {
        var client;
        // @FIXME: When Owner.both is added this needs updated.
        if (config_1.config.runtimeOwner === config_1.Owner.server) {
            client = new HTTPRuntimeClient();
            var content = "";
            if (filepath)
                content = fs.readFileSync(filepath).toString();
            client.load(content, "user");
            client.handle(request, response);
        }
        if (config_1.config.runtimeOwner === config_1.Owner.client || client && !client.server.handling) {
            return response.status(404).send("Looks like that asset is missing.");
        }
    });
    return app;
}
//---------------------------------------------------------------------
// Websocket
//---------------------------------------------------------------------
var SocketRuntimeClient = (function (_super) {
    __extends(SocketRuntimeClient, _super);
    function SocketRuntimeClient(socket, withIDE) {
        var _this = this;
        var dbs = {
            "http": new http_1.HttpDatabase(),
            "shared": shared,
        };
        if (withIDE) {
            dbs["view"] = new browserSession_1.BrowserViewDatabase();
            dbs["editor"] = new browserSession_1.BrowserEditorDatabase();
            dbs["inspector"] = new browserSession_1.BrowserInspectorDatabase();
        }
        _this = _super.call(this, dbs) || this;
        _this.socket = socket;
        return _this;
    }
    SocketRuntimeClient.prototype.send = function (json) {
        if (this.socket && this.socket.readyState === 1) {
            this.socket.send(json);
        }
    };
    return SocketRuntimeClient;
}(runtimeClient_1.RuntimeClient));
function IDEMessageHandler(client, message) {
    var ws = client.socket;
    var data = JSON.parse(message);
    if (data.type === "init") {
        var editor = config_1.config.editor, runtimeOwner = config_1.config.runtimeOwner, controlOwner = config_1.config.controlOwner, internal = config_1.config.internal, mode = config_1.config.mode;
        var hash = data.hash;
        var content = void 0;
        var path_1;
        var isLocal = hash.indexOf("gist:") === 0;
        // If we're in file mode, the only valid file to serve is the one specified in `config.path`.
        if (mode === config_1.Mode.file) {
            content = eveSource.find(config_1.config.path);
            path_1 = config_1.config.path;
        }
        // Otherwise, anything goes. First we check if the client has requested a specific file in the URL hash.
        if (!isLocal && mode === config_1.Mode.workspace && hash) {
            // @FIXME: This code to strip the editor hash segment out really needs to be abstacted.
            var filepath = hash.split("#")[0];
            if (filepath[filepath.length - 1] === "/")
                filepath = filepath.slice(0, -1);
            content = filepath && eveSource.find(filepath);
            path_1 = hash;
        }
        // If we've got a path to run with, use it as the default.
        if (!isLocal && !content && config_1.config.path) {
            var workspace = "root";
            // @FIXME: This hard-coding isn't technically wrong right now, but it's brittle and poor practice.
            content = eveSource.get(config_1.config.path, workspace);
            path_1 = eveSource.getRelativePath(config_1.config.path, workspace);
        }
        // If we can't find the config path in a workspace, try finding it on disk.
        if (!isLocal && !content && config_1.config.path && fs.existsSync("." + path_1)) {
            content = fs.readFileSync("." + path_1).toString();
        }
        ws.send(JSON.stringify({ type: "initProgram", path: path_1, code: content, config: config_1.config, workspaces: eveSource.workspaces }));
        if (runtimeOwner === config_1.Owner.server) {
            client.load(content, "user");
        }
    }
    else if (data.type === "save") {
        eveSource.save(data.path, data.code);
    }
    else if (data.type === "ping") {
        // we don't need to do anything with pings, they're just to make sure hosts like
        // Heroku don't shutdown our server.
    }
    else {
        client.handleEvent(message);
    }
}
function MessageHandler(client, message) {
    var ws = client.socket;
    var data = JSON.parse(message);
    if (data.type === "init") {
        var editor = config_1.config.editor, runtimeOwner = config_1.config.runtimeOwner, controlOwner = config_1.config.controlOwner, filepath = config_1.config.path;
        // we do nothing here since the server is in charge of handling init.
        var content = fs.readFileSync(filepath).toString();
        ws.send(JSON.stringify({ type: "initProgram", path: filepath, code: content, config: config_1.config, workspaces: eveSource.workspaces }));
        if (runtimeOwner === config_1.Owner.server) {
            client.load(content, "user");
        }
    }
    else if (data.type === "event") {
        client.handleEvent(message);
    }
    else if (data.type === "ping") {
        // we don't need to do anything with pings, they're just to make sure hosts like
        // Heroku don't shutdown our server.
    }
    else {
        console.error("Invalid message sent: " + message);
    }
}
function initWebsocket(wss, withIDE) {
    wss.on('connection', function connection(ws) {
        var client = new SocketRuntimeClient(ws, withIDE);
        var handler = withIDE ? IDEMessageHandler : MessageHandler;
        if (!withIDE) {
            // we need to initialize
        }
        ws.on('message', function (message) {
            handler(client, message);
        });
        ws.on("close", function () {
            if (client.evaluation) {
                client.evaluation.close();
            }
        });
    });
}
//---------------------------------------------------------------------
// Go!
//---------------------------------------------------------------------
function run() {
    // @FIXME: Split these out!
    eveSource.add("eve", path.join(config_1.config.eveRoot, "examples"));
    if (config_1.config.internal) {
        eveSource.add("root", path.join(config_1.config.eveRoot, "examples"));
        eveSource.add("examples", path.join(config_1.config.eveRoot, "examples"));
    }
    else {
        eveSource.add("root", config_1.config.root);
    }
    // If a file was passed in, we need to make sure it actually exists
    // now instead of waiting for the user to submit a request and then
    // blowing up
    if (config_1.config.path) {
        try {
            fs.statSync(config_1.config.path);
        }
        catch (e) {
            throw new Error("Can't load " + config_1.config.path);
        }
    }
    var app = createExpressApp();
    var server = http.createServer(app);
    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({ server: server });
    initWebsocket(wss, config_1.config.editor);
    server.listen(config_1.config.port, function () {
        console.log("Eve is available at http://localhost:" + config_1.config.port + ". Point your browser there to access the Eve editor.");
    });
    // If the port is already in use, display an error message
    process.on('uncaughtException', function handleAddressInUse(err) {
        if (err.errno === 'EADDRINUSE') {
            console.log("ERROR: Eve couldn't start because port " + config_1.config.port + " is already in use.\n\nYou can select a different port for Eve using the \"port\" argument.\nFor example:\n\n> eve --port 1234");
        }
        else {
            throw err;
        }
        process.exit(1);
    });
}
exports.run = run;
if (require.main === module) {
    console.error("Please run eve using the installed eve binary.");
}
//# sourceMappingURL=server.js.map