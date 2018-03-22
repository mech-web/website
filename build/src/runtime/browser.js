"use strict";
//---------------------------------------------------------------------
// Browser
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
var client_1 = require("../client");
var runtimeClient_1 = require("./runtimeClient");
var http_1 = require("./databases/http");
var browserSession_1 = require("./databases/browserSession");
//---------------------------------------------------------------------
// Utils
//---------------------------------------------------------------------
// this makes me immensely sad...
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
//---------------------------------------------------------------------
// Responder
//---------------------------------------------------------------------
var BrowserRuntimeClient = (function (_super) {
    __extends(BrowserRuntimeClient, _super);
    function BrowserRuntimeClient(client) {
        var _this = this;
        var dbs = {
            "http": new http_1.HttpDatabase()
        };
        if (client.showIDE) {
            dbs["view"] = new browserSession_1.BrowserViewDatabase();
            dbs["editor"] = new browserSession_1.BrowserEditorDatabase();
            dbs["inspector"] = new browserSession_1.BrowserInspectorDatabase();
        }
        _this = _super.call(this, dbs) || this;
        _this.client = client;
        return _this;
    }
    BrowserRuntimeClient.prototype.send = function (json) {
        var _this = this;
        setTimeout(function () {
            _this.client.onMessage({ data: json });
        }, 0);
    };
    return BrowserRuntimeClient;
}(runtimeClient_1.RuntimeClient));
//---------------------------------------------------------------------
// Init a program
//---------------------------------------------------------------------
function init(code) {
    global["browser"] = true;
    exports.responder = new BrowserRuntimeClient(client_1.client);
    exports.responder.load(code || "", "user");
    global["evaluation"] = exports.responder;
    global["save"] = function () {
        exports.responder.handleEvent(JSON.stringify({ type: "dumpState" }));
    };
    // client.socket.onopen();
    // responder.handleEvent(JSON.stringify({type: "findPerformance", requestId: 2}));
}
exports.init = init;
//# sourceMappingURL=browser.js.map