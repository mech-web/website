"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var config_1 = require("./config");
var renderer_1 = require("./renderer");
var ide_1 = require("./ide");
var db_1 = require("./db");
function analyticsEvent(kind, label, value) {
    var ga = window["ga"];
    if (!ga)
        return;
    ga("send", "event", "ide", kind, label, value);
}
//---------------------------------------------------------
// Connect the websocket, send the ui code
//---------------------------------------------------------
exports.DEBUG = false;
exports.indexes = {
    records: new db_1.IndexScalar(),
    dirty: new db_1.IndexList(),
    byName: new db_1.IndexList(),
    byTag: new db_1.IndexList(),
    // renderer indexes
    byClass: new db_1.IndexList(),
    byStyle: new db_1.IndexList(),
    byChild: new db_1.IndexScalar() // child -> E
};
function handleDiff(state, diff) {
    var diffEntities = 0;
    var entitiesWithUpdatedValues = {};
    var records = exports.indexes.records;
    var dirty = exports.indexes.dirty;
    for (var _i = 0, _a = diff.remove; _i < _a.length; _i++) {
        var remove = _a[_i];
        var e = remove[0], a = remove[1], v = remove[2];
        if (!records.index[e]) {
            console.error("Attempting to remove an attribute of an entity that doesn't exist: " + e);
            continue;
        }
        var entity = records.index[e];
        var values = entity[a];
        if (!values)
            continue;
        dirty.insert(e, a);
        if (values.length <= 1 && values[0] === v) {
            delete entity[a];
        }
        else {
            var ix = values.indexOf(v);
            if (ix === -1)
                continue;
            values.splice(ix, 1);
        }
        // Update indexes
        if (a === "tag")
            exports.indexes.byTag.remove(v, e);
        else if (a === "name")
            exports.indexes.byName.remove(v, e);
        else if (a === "class")
            exports.indexes.byClass.remove(v, e);
        else if (a === "style")
            exports.indexes.byStyle.remove(v, e);
        else if (a === "value")
            entitiesWithUpdatedValues[e] = true;
    }
    for (var _b = 0, _c = diff.insert; _b < _c.length; _b++) {
        var insert = _c[_b];
        var e = insert[0], a = insert[1], v = insert[2];
        var entity = records.index[e];
        if (!entity) {
            entity = {};
            records.insert(e, entity);
            diffEntities++; // Nuke this and use records.dirty
        }
        dirty.insert(e, a);
        if (!entity[a])
            entity[a] = [];
        entity[a].push(v);
        // Update indexes
        if (a === "tag")
            exports.indexes.byTag.insert(v, e);
        else if (a === "name")
            exports.indexes.byName.insert(v, e);
        else if (a === "class")
            exports.indexes.byClass.insert(v, e);
        else if (a === "style")
            exports.indexes.byStyle.insert(v, e);
        else if (a === "children")
            exports.indexes.byChild.insert(v, e);
        else if (a === "value")
            entitiesWithUpdatedValues[e] = true;
    }
    // Update value syncing
    for (var e in entitiesWithUpdatedValues) {
        var a = "value";
        var entity = records.index[e];
        if (!entity[a]) {
            renderer_1.sentInputValues[e] = [];
        }
        else {
            if (entity[a].length > 1)
                console.error("Unable to set 'value' multiple times on entity", e, entity[a]);
            var value = entity[a][0];
            var sent = renderer_1.sentInputValues[e];
            if (sent && sent[0] === value) {
                dirty.remove(e, a);
                sent.shift();
            }
            else {
                renderer_1.sentInputValues[e] = [];
            }
        }
    }
    // Trigger all the subscribers of dirty indexes
    for (var indexName in exports.indexes) {
        exports.indexes[indexName].dispatchIfDirty();
    }
    // Clear dirty states afterwards so a subscriber of X can see the dirty state of Y reliably
    for (var indexName in exports.indexes) {
        exports.indexes[indexName].clearDirty();
    }
    // Finally, wipe the dirty E -> A index
    exports.indexes.dirty.clearIndex();
}
var prerendering = false;
var frameRequested = false;
//---------------------------------------------------------
// EveClient
//---------------------------------------------------------
var EveClient = (function () {
    function EveClient(url) {
        var _this = this;
        this.socketQueue = [];
        this.localEve = false;
        this.localControl = false;
        this.showIDE = true;
        var loc = url ? url : this.getUrl();
        this.socket = new WebSocket(loc);
        this.socket.onerror = function (event) {
            _this.onError();
        };
        this.socket.onopen = function (event) {
            _this.onOpen();
        };
        this.socket.onmessage = function (event) {
            _this.onMessage(event);
        };
        this.socket.onclose = function (event) {
            _this.onClose();
        };
    }
    EveClient.prototype.getUrl = function () {
        var protocol = "ws://";
        if (location.protocol.indexOf("https") > -1) {
            protocol = "wss://";
        }
        return protocol + window.location.host + "/ws";
    };
    EveClient.prototype.socketSend = function (message) {
        if (this.socket && this.socket.readyState === 1) {
            this.socket.send(message);
        }
        else {
            this.socketQueue.push(message);
        }
    };
    EveClient.prototype.send = function (payload) {
        var message = JSON.stringify(payload);
        if (!this.localEve) {
            this.socketSend(message);
        }
        else {
            this.worker.postMessage(message);
        }
    };
    EveClient.prototype.sendControl = function (message) {
        if (!this.localControl) {
            this.socketSend(message);
        }
        else {
            // @TODO where do local control messages go?
        }
    };
    EveClient.prototype.save = function (documentId, code) {
        this.sendControl(JSON.stringify({ type: "save", path: documentId, code: code }));
        if (this.worker) {
            this.worker.postMessage(JSON.stringify({ type: "save", path: documentId, code: code }));
        }
    };
    EveClient.prototype.sendEvent = function (records) {
        if (!records || !records.length)
            return;
        var eavs = [];
        for (var _i = 0, records_1 = records; _i < records_1.length; _i++) {
            var record = records_1[_i];
            eavs.push.apply(eavs, recordToEAVs(record));
        }
        this.send({ type: "event", insert: eavs });
    };
    EveClient.prototype.injectNotice = function (type, message) {
        if (this.ide) {
            this.ide.injectNotice(type, message);
        }
        else {
            if (type === "error")
                console.error(message);
            else if (type === "warning")
                console.warn(message);
            else
                console.info(message);
        }
    };
    EveClient.prototype.onError = function () {
        this.localControl = true;
        this.localEve = true;
        if (!this.ide) {
            var path_1 = (window.location.hash || "").slice(1) || "/examples/quickstart.eve";
            ;
            this._initProgram({ config: { runtimeOwner: config_1.Owner.client, controlOwner: config_1.Owner.client, editor: true, path: path_1 }, path: (window.location.hash || "").slice(1) || "/examples/quickstart.eve", code: "", workspaces: window["_workspaceCache"] });
        }
        else {
            this.injectNotice("error", "Unexpectedly disconnected from the server. Please refresh the page.");
        }
    };
    EveClient.prototype.onOpen = function () {
        var _this = this;
        this.socketSend(JSON.stringify({ type: "init", url: location.pathname, hash: location.hash.substring(1) }));
        for (var _i = 0, _a = this.socketQueue; _i < _a.length; _i++) {
            var queued = _a[_i];
            this.socketSend(queued);
        }
        // ping the server so that the connection isn't overzealously
        // closed
        setInterval(function () {
            _this.socketSend(JSON.stringify({ type: "ping" }));
        }, 30000);
    };
    EveClient.prototype.onClose = function () {
        if (!this.localControl) {
            this.injectNotice("warning", "The editor has lost connection to the Eve server. All changes will be made locally.");
        }
    };
    EveClient.prototype.onMessage = function (event) {
        var data = JSON.parse(event.data);
        var handler = this["_" + data.type];
        if (handler) {
            handler.call(this, data);
        }
        else if (!this.ide || !this.ide.languageService.handleMessage(data)) {
            console.error("Unknown client message type: " + data.type);
        }
    };
    EveClient.prototype._result = function (data) {
        var state = { entities: exports.indexes.records.index, dirty: exports.indexes.dirty.index };
        handleDiff(state, data);
        var diffEntities = 0;
        if (exports.DEBUG) {
            console.groupCollapsed("Received Result +" + data.insert.length + "/-" + data.remove.length + " (\u2202Entities: " + diffEntities + ")");
            if (exports.DEBUG === true || exports.DEBUG === "diff") {
                console.table(data.insert);
                console.table(data.remove);
            }
            if (exports.DEBUG === true || exports.DEBUG === "state") {
                // we clone here to keep the entities fresh when you want to thumb through them in the log later (since they are rendered lazily)
                var copy = util_1.clone(state.entities);
                console.info("Entities", copy);
                console.info("Indexes", exports.indexes);
            }
            console.groupEnd();
        }
        if (document.readyState === "complete") {
            renderer_1.renderEve();
        }
        else if (!prerendering) {
            prerendering = true;
            document.addEventListener("DOMContentLoaded", function () {
                renderer_1.renderEve();
            });
        }
    };
    EveClient.prototype._initProgram = function (data) {
        var _this = this;
        config_1.init(data.config);
        this.localEve = config_1.config.runtimeOwner === config_1.Owner.client;
        this.localControl = config_1.config.controlOwner === config_1.Owner.client;
        this.showIDE = config_1.config.editor;
        if (this.localEve) {
            this.worker = new Worker("/build/src/loadWorker.js");
            this.worker.onmessage = function (event) {
                _this.onMessage(event);
            };
            this.send({ type: "init", code: data.code, showIDE: data.config.editor, workspaces: data.workspaces, config: config_1.config, workspaceCache: window["_workspaceCache"] });
        }
        if (this.showIDE) {
            var path_2 = data.path;
            if (path_2 === undefined)
                path_2 = location.hash && location.hash.slice(1);
            //history.replaceState({}, "", window.location.pathname);
            this.ide = new ide_1.IDE();
            this.ide.local = this.localControl;
            initIDE(this);
            this.ide.render();
            var found = false;
            if (path_2 && path_2.length > 2) {
                var currentHashChunks = path_2.split("#"); //.slice(1);
                var docId = currentHashChunks[0];
                if (docId && docId[docId.length - 1] === "/")
                    docId = docId.slice(0, -1);
                found = this.ide.loadFile(docId, data.code);
            }
            if (!found && config_1.config.internal) {
                this.ide.loadFile("/examples/quickstart.eve");
            }
        }
        onHashChange({});
    };
    EveClient.prototype._css = function (data) {
        document.getElementById("app-styles").innerHTML = data.css;
    };
    EveClient.prototype._parse = function (data) {
        if (!this.showIDE)
            return;
        this.ide.loadDocument(data.generation, data.text, data.spans, data.extraInfo, data.css); // @FIXME
    };
    EveClient.prototype._comments = function (data) {
        if (!this.showIDE)
            return;
        this.ide.injectSpans(data.spans, data.extraInfo);
    };
    EveClient.prototype._findNode = function (data) {
        if (!this.showIDE)
            return;
        this.ide.attachView(data.recordId, data.spanId);
    };
    EveClient.prototype._error = function (data) {
        this.injectNotice("error", data.message);
    };
    return EveClient;
}());
exports.EveClient = EveClient;
//---------------------------------------------------------
// Index handlers
//---------------------------------------------------------
function renderOnChange(index, dirty) {
    renderer_1.renderRecords();
}
exports.indexes.dirty.subscribe(renderOnChange);
function printDebugRecords(index, dirty) {
    for (var recordId in dirty) {
        var record = exports.indexes.records.index[recordId];
        if (record.tag && record.tag.indexOf("debug") !== -1) {
            console.info(record);
        }
    }
}
exports.indexes.dirty.subscribe(printDebugRecords);
function subscribeToTagDiff(tag, callback) {
    exports.indexes.dirty.subscribe(function (index, dirty) {
        var records = {};
        var inserts = [];
        var removes = [];
        var dirtyOldRecords = exports.indexes.byTag.dirty[tag] || [];
        for (var _i = 0, dirtyOldRecords_1 = dirtyOldRecords; _i < dirtyOldRecords_1.length; _i++) {
            var recordId = dirtyOldRecords_1[_i];
            var record = exports.indexes.records.index[recordId];
            if (!record || !record.tag || record.tag.indexOf(tag) === -1) {
                removes.push(recordId);
            }
        }
        for (var recordId in dirty) {
            var record = exports.indexes.records.index[recordId];
            if (record.tag && record.tag.indexOf(tag) !== -1) {
                inserts.push(recordId);
                records[recordId] = record;
            }
        }
        callback(inserts, removes, records);
    });
}
subscribeToTagDiff("editor", function (inserts, removes, records) {
    if (!exports.client.showIDE)
        return;
    exports.client.ide.updateActions(inserts, removes, records);
});
subscribeToTagDiff("view", function (inserts, removes, records) {
    if (!exports.client.showIDE)
        return;
    exports.client.ide.updateViews(inserts, removes, records);
});
//---------------------------------------------------------
// Communication helpers
//---------------------------------------------------------
function recordToEAVs(record) {
    if (!record)
        return;
    var eavs = [];
    if (record.id && record.id.constructor === Array)
        throw new Error("Unable to apply multiple ids to the same record: " + JSON.stringify(record));
    if (!record.id)
        record.id = util_1.uuid();
    record.id = "" + record.id + "";
    var e = record.id;
    for (var a in record) {
        if (record[a] === undefined)
            continue;
        if (a === "id")
            continue;
        if (record[a].constructor === Array) {
            for (var _i = 0, _a = record[a]; _i < _a.length; _i++) {
                var v = _a[_i];
                if (typeof v === "object") {
                    eavs.push.apply(eavs, recordToEAVs(v));
                    eavs.push([e, a, v.id]);
                }
                else if (v !== undefined) {
                    eavs.push([e, a, v]);
                }
            }
        }
        else {
            var v = record[a];
            if (typeof v === "object") {
                eavs.push.apply(eavs, recordToEAVs(v));
                eavs.push([e, a, v.id]);
            }
            else if (v !== undefined) {
                eavs.push([e, a, v]);
            }
        }
    }
    return eavs;
}
//---------------------------------------------------------
// Initialize an IDE
//---------------------------------------------------------
exports.client = new EveClient();
function initIDE(client) {
    var ide = client.ide;
    ide.onChange = function (ide) {
        var generation = ide.generation;
        var md = ide.editor.toMarkdown();
        console.groupCollapsed("SENT " + generation);
        console.info(md);
        console.groupEnd();
        client.send({ scope: "root", type: "parse", generation: generation, code: md, documentId: ide.documentId });
    };
    ide.onEval = function (ide, persist) {
        client.send({ type: "eval", persist: persist, documentId: ide.documentId });
    };
    ide.onLoadFile = function (ide, documentId, code) {
        client.send({ type: "close" });
        client.send({ scope: "root", type: "parse", code: code, documentId: ide.documentId });
        client.send({ type: "eval", persist: false, documentId: ide.documentId });
        var url = location.pathname + "#" + documentId;
        var currentHashChunks = location.hash.split("#").slice(1);
        var curId = currentHashChunks[0];
        if (curId && curId[curId.length - 1] === "/")
            curId = curId.slice(0, -1);
        if (curId === documentId && currentHashChunks[1]) {
            url += "/#" + currentHashChunks[1];
        }
        history.pushState({}, "", url + location.search);
        analyticsEvent("load-document", documentId);
    };
    ide.onSaveDocument = function (ide, documentId, code) {
        client.save(documentId, code);
    };
    ide.onTokenInfo = function (ide, tokenId) {
        client.send({ type: "tokenInfo", tokenId: tokenId });
    };
    var cache = window["_workspaceCache"];
    for (var workspace in cache || {}) {
        ide.loadWorkspace(workspace, cache[workspace]);
    }
}
function changeDocument() {
    if (!exports.client.showIDE)
        return;
    var ide = exports.client.ide;
    // @FIXME: This is not right in the non-internal case.
    var docId = "/examples/quickstart.eve";
    var path = location.hash && location.hash.split('?')[0].split("#")[1];
    if (path[path.length - 1] === "/")
        path = path.slice(0, -1);
    if (path && path.length > 2) {
        if (path[path.length - 1] === "/")
            path = path.slice(0, -1);
        docId = path;
    }
    if (!docId)
        return;
    if (docId === ide.documentId)
        return;
    try {
        ide.loadFile(docId);
    }
    catch (err) {
        exports.client.injectNotice("info", "Unable to load unknown file: " + docId);
    }
    ide.render();
}
//---------------------------------------------------------
// Handlers
//---------------------------------------------------------
function onHashChange(event) {
    if (exports.client.ide && exports.client.ide.loaded)
        changeDocument();
    var hash = window.location.hash.split("#/")[2];
    var queryParam = window.location.hash.split('?')[1];
    if (hash || queryParam) {
        var segments = (hash || '').split("/").map(function (seg, ix) {
            return { id: util_1.uuid(), index: ix + 1, value: seg };
        }), queries = (queryParam || '').split('&').map(function (kv) {
            var _a = kv.split('=', 2), k = _a[0], v = _a[1];
            return { id: util_1.uuid(), key: k, value: v };
        });
        exports.client.sendEvent([
            { tag: "url-change", "hash-segment": segments, "query-param": queries }
        ]);
    }
}
window.addEventListener("hashchange", onHashChange);
window.document.body.addEventListener("dragover", function (e) {
    e.preventDefault();
});
window.document.body.addEventListener("drop", function (e) {
    if (e.dataTransfer.files.length) {
        var reader_1 = new FileReader();
        reader_1.onload = function (event) {
            exports.socket.send("{\"type\": \"load\", \"info\": " + reader_1.result + "}");
        };
        reader_1.readAsText(e.dataTransfer.files[0]);
    }
    e.preventDefault();
    e.stopPropagation();
});
//# sourceMappingURL=client.js.map