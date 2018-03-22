"use strict";
//---------------------------------------------------------------------
// Webworker client
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
var eveSource = require("./eveSource");
var config_1 = require("../config");
var runtimeClient_1 = require("./runtimeClient");
var http_1 = require("./databases/http");
var browserSession_1 = require("./databases/browserSession");
//---------------------------------------------------------------------
// Responder
//---------------------------------------------------------------------
var WebworkerRuntimeClient = (function (_super) {
    __extends(WebworkerRuntimeClient, _super);
    function WebworkerRuntimeClient(showIDE) {
        var _this = this;
        var dbs = {
            "http": new http_1.HttpDatabase()
        };
        if (showIDE) {
            dbs["view"] = new browserSession_1.BrowserViewDatabase();
            dbs["editor"] = new browserSession_1.BrowserEditorDatabase();
            dbs["inspector"] = new browserSession_1.BrowserInspectorDatabase();
        }
        _this = _super.call(this, dbs) || this;
        return _this;
    }
    WebworkerRuntimeClient.prototype.send = function (json) {
        postMessage(json, undefined);
    };
    return WebworkerRuntimeClient;
}(runtimeClient_1.RuntimeClient));
//---------------------------------------------------------------------
// Init a program
//---------------------------------------------------------------------
function init(code, showIDE) {
    global["browser"] = true;
    exports.responder = new WebworkerRuntimeClient(showIDE);
    exports.responder.load(code || "", "user");
}
exports.init = init;
//---------------------------------------------------------------------
// Messages
//---------------------------------------------------------------------
function onmessage(event) {
    var data = JSON.parse(event.data);
    if (typeof data !== "object") {
        console.error("WORKER: Unknown message: " + data);
        return;
    }
    if (data.type === "init") {
        // since we're working in a totally different context, we need to load the
        // workspace information that the browser normally has into the webworker
        // context
        eveSource.loadWorkspaces(data.workspaces);
        global["_workspaceCache"] = data.workspaceCache;
        config_1.init(data.config);
        init(data.code, data.showIDE);
    }
    else if (data.type === "save") {
        var workspace = eveSource.getWorkspaceFromPath(data.path);
        global["_workspaceCache"][workspace][data.path] = data.code;
    }
    else if (data.type !== undefined) {
        exports.responder.handleEvent(event.data);
    }
    else {
        console.error("WORKER: Unknown message type: " + data.type);
    }
}
exports.onmessage = onmessage;
//# sourceMappingURL=webworker.js.map