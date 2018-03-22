"use strict";
//---------------------------------------------------------------------
// Browser Session Database
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
var parser = require("../parser");
var builder = require("../builder");
var runtime_1 = require("../runtime");
var eveSource = require("../eveSource");
var BrowserEventDatabase = (function (_super) {
    __extends(BrowserEventDatabase, _super);
    function BrowserEventDatabase() {
        var _this = _super.call(this) || this;
        var source = eveSource.get("event.eve");
        if (source) {
            var _a = parser.parseDoc(source, "event"), results = _a.results, errors = _a.errors;
            if (errors && errors.length)
                console.error("EVENT ERRORS", errors);
            var _b = builder.buildDoc(results), blocks = _b.blocks, buildErrors = _b.errors;
            if (buildErrors && buildErrors.length)
                console.error("EVENT ERRORS", buildErrors);
            _this.blocks = blocks;
        }
        return _this;
    }
    return BrowserEventDatabase;
}(runtime_1.Database));
exports.BrowserEventDatabase = BrowserEventDatabase;
var BrowserViewDatabase = (function (_super) {
    __extends(BrowserViewDatabase, _super);
    function BrowserViewDatabase() {
        var _this = _super.call(this) || this;
        var source = eveSource.get("view.eve");
        if (source) {
            var _a = parser.parseDoc(source, "view"), results = _a.results, errors = _a.errors;
            if (errors && errors.length)
                console.error("View DB Errors", errors);
            var _b = builder.buildDoc(results), blocks = _b.blocks, buildErrors = _b.errors;
            if (buildErrors && buildErrors.length)
                console.error("View DB Errors", buildErrors);
            _this.blocks = blocks;
        }
        return _this;
    }
    return BrowserViewDatabase;
}(runtime_1.Database));
exports.BrowserViewDatabase = BrowserViewDatabase;
var BrowserEditorDatabase = (function (_super) {
    __extends(BrowserEditorDatabase, _super);
    function BrowserEditorDatabase() {
        var _this = _super.call(this) || this;
        var source = eveSource.get("editor.eve");
        if (source) {
            var _a = parser.parseDoc(source, "editor"), results = _a.results, errors = _a.errors;
            if (errors && errors.length)
                console.error("Editor DB Errors", errors);
            var _b = builder.buildDoc(results), blocks = _b.blocks, buildErrors = _b.errors;
            if (buildErrors && buildErrors.length)
                console.error("Editor DB Errors", buildErrors);
            _this.blocks = blocks;
        }
        return _this;
    }
    return BrowserEditorDatabase;
}(runtime_1.Database));
exports.BrowserEditorDatabase = BrowserEditorDatabase;
var BrowserInspectorDatabase = (function (_super) {
    __extends(BrowserInspectorDatabase, _super);
    function BrowserInspectorDatabase() {
        var _this = _super.call(this) || this;
        var source = eveSource.get("inspector.eve");
        if (source) {
            var _a = parser.parseDoc(source, "inspector"), results = _a.results, errors = _a.errors;
            if (errors && errors.length)
                console.error("Inspector DB Errors", errors);
            var _b = builder.buildDoc(results), blocks = _b.blocks, buildErrors = _b.errors;
            if (buildErrors && buildErrors.length)
                console.error("Inspector DB Errors", buildErrors);
            _this.blocks = blocks;
        }
        return _this;
    }
    return BrowserInspectorDatabase;
}(runtime_1.Database));
exports.BrowserInspectorDatabase = BrowserInspectorDatabase;
var BrowserSessionDatabase = (function (_super) {
    __extends(BrowserSessionDatabase, _super);
    function BrowserSessionDatabase(client) {
        var _this = _super.call(this) || this;
        _this.client = client;
        return _this;
    }
    BrowserSessionDatabase.prototype.onFixpoint = function (evaluation, changes) {
        _super.prototype.onFixpoint.call(this, evaluation, changes);
        var name = evaluation.databaseToName(this);
        var result = changes.result((_a = {}, _a[name] = true, _a));
        if (result.insert.length || result.remove.length) {
            this.client.send(JSON.stringify(result));
        }
        var _a;
    };
    BrowserSessionDatabase.prototype.unregister = function (evaluation) {
        var ix = this.evaluations.indexOf(evaluation);
        if (ix > -1) {
            this.evaluations.splice(ix, 1);
        }
        if (this.evaluations.length === 0) {
            this.client.send(JSON.stringify({ type: "result", insert: [], remove: this.index.toTriples() }));
        }
    };
    return BrowserSessionDatabase;
}(runtime_1.Database));
exports.BrowserSessionDatabase = BrowserSessionDatabase;
//# sourceMappingURL=browserSession.js.map