"use strict";
//---------------------------------------------------------------------
// RuntimeClient
//---------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
var runtime_1 = require("./runtime");
var parser = require("./parser");
var builder = require("./builder");
var actions_1 = require("./actions");
var browserSession_1 = require("./databases/browserSession");
var system = require("./databases/system");
var analyzer = require("./analyzer");
var id_1 = require("./id");
var config_1 = require("../config");
var eveSource = require("./eveSource");
//---------------------------------------------------------------------
// Responder
//---------------------------------------------------------------------
var RuntimeClient = (function () {
    function RuntimeClient(extraDBs) {
        if (extraDBs === void 0) { extraDBs = {}; }
        this.extraDBs = extraDBs;
    }
    RuntimeClient.prototype.load = function (code, context) {
        code = code || "";
        var _a = parser.parseDoc(code, context), results = _a.results, errors = _a.errors;
        if (errors && errors.length)
            console.error(errors);
        results.code = code;
        this.lastParse = results;
        this.send(JSON.stringify({ type: "css", css: this.enabledCss() }));
        this.makeEvaluation();
        this.evaluation.fixpoint();
    };
    RuntimeClient.prototype.makeEvaluation = function (parse) {
        var _this = this;
        if (parse === void 0) { parse = this.lastParse; }
        if (this.evaluation) {
            this.evaluation.close();
            this.evaluation = undefined;
        }
        var build = builder.buildDoc(parse);
        var blocks = build.blocks, errors = build.errors;
        this.sendErrors(errors);
        // TODO: What is the right way to gate analysis? This seems hacky, but I'm not sure
        // that the RuntimeClient should really know/care about whether or not the editor is
        // hooked up. Maybe there should be a flag for analysis instead?
        if (this.extraDBs["editor"]) {
            analyzer.analyze(blocks.map(function (block) { return block.parse; }), parse.spans, parse.extraInfo);
        }
        var ev = new runtime_1.Evaluation();
        var session = new runtime_1.Database();
        session.blocks = blocks;
        ev.registerDatabase("session", session);
        var extraDBs = this.extraDBs;
        if (!extraDBs["browser"]) {
            ev.registerDatabase("browser", new browserSession_1.BrowserSessionDatabase(this));
        }
        if (!extraDBs["event"]) {
            ev.registerDatabase("event", new browserSession_1.BrowserEventDatabase());
        }
        if (!extraDBs["system"]) {
            ev.registerDatabase("system", system.instance);
        }
        for (var _i = 0, _a = Object.keys(this.extraDBs); _i < _a.length; _i++) {
            var dbName = _a[_i];
            var db = extraDBs[dbName];
            ev.registerDatabase(dbName, db);
        }
        ev.errorReporter = function (kind, error) {
            _this.send(JSON.stringify({ type: "error", kind: kind, message: error }));
        };
        this.evaluation = ev;
        return ev;
    };
    RuntimeClient.prototype.sendErrors = function (errors) {
        if (!errors.length)
            return;
        var spans = [];
        var extraInfo = {};
        for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
            var error = errors_1[_i];
            error.injectSpan(spans, extraInfo);
        }
        this.send(JSON.stringify({ type: "comments", spans: spans, extraInfo: extraInfo }));
        return true;
    };
    RuntimeClient.prototype.enabledCss = function (code) {
        if (code === void 0) { code = ""; }
        if (!code && this.lastParse)
            code = this.lastParse.code;
        var css = "";
        code.replace(/(?:```|~~~)css\n([\w\W]*?)\n(?:```|~~~)/g, function (g0, g1) {
            css += g1 + "\n";
            return "";
        });
        // remove whitespace before open braces, and add a newline after open brace
        css = css.replace(/\s*{\s*/g, " {\n");
        css = css.split("\n").map(function (line) {
            var trimmedLine = line.trim();
            if ((line.indexOf("{") !== -1) &&
                ("0123456789@".indexOf(trimmedLine[0]) === -1) &&
                (["from", "to"].indexOf(trimmedLine.split(" ")[0]) === -1)) {
                return trimmedLine.split(",").map(function (section) {
                    return ".application-container > .program " + section;
                }).join(", ");
            }
            return trimmedLine;
        }).join("\n");
        return css;
    };
    RuntimeClient.prototype.handleEvent = function (json) {
        var data = JSON.parse(json);
        // Events are expected to be objects that have a type property
        // if they aren't, we toss the event out
        if (typeof data !== "object" || data.type === undefined) {
            console.error("Got invalid JSON event: " + json);
            return;
        }
        if (data.type === "event") {
            if (!this.evaluation)
                return;
            // console.info("EVENT", json);
            var scopes = ["event"];
            var actions = [];
            for (var _i = 0, _a = data.insert; _i < _a.length; _i++) {
                var insert = _a[_i];
                var e = insert[0], a = insert[1], v = insert[2];
                // @TODO: this is a hack to deal with external ids. We should really generate
                // a local id for them
                if (e[0] === "⍦")
                    e = id_1.ids.get([e]);
                if (v[0] === "⍦")
                    v = id_1.ids.get([v]);
                actions.push(new actions_1.ActionImplementations["+="]("event", e, a, v, "event", scopes));
            }
            this.evaluation.executeActions(actions);
        }
        else if (data.type === "close") {
            if (!this.evaluation)
                return;
            this.evaluation.close();
            this.evaluation = undefined;
        }
        else if (data.type === "parse") {
            var _b = parser.parseDoc(data.code || "", "user"), results = _b.results, errors = _b.errors;
            var text = results.text, spans = results.spans, extraInfo = results.extraInfo;
            var build = builder.buildDoc(results);
            var blocks = build.blocks, buildErrors = build.errors;
            results.code = data.code;
            this.lastParse = results;
            this.lastParse.documentId = data.documentId;
            for (var _c = 0, buildErrors_1 = buildErrors; _c < buildErrors_1.length; _c++) {
                var error = buildErrors_1[_c];
                error.injectSpan(spans, extraInfo);
            }
            this.send(JSON.stringify({ type: "parse", generation: data.generation, text: text, spans: spans, extraInfo: extraInfo, css: this.lastCss + this.enabledCss() }));
        }
        else if (data.type === "eval") {
            var parse = this.lastParse;
            if (config_1.config.multiDoc) {
                var code = "";
                var documents = eveSource.fetchAll("root");
                var css = "";
                var currentCss = "";
                for (var documentId in documents) {
                    code += "# !!! " + documentId + " !!! \n";
                    code += documents[documentId] + "\n\n";
                    if (this.lastParse && documentId !== this.lastParse.documentId) {
                        css += this.enabledCss(documents[documentId]) + "\n\n";
                    }
                    else {
                        currentCss = this.enabledCss(documents[documentId]) + "\n\n";
                    }
                }
                var _d = parser.parseDoc(code || "", "user"), results = _d.results, errors = _d.errors;
                var text = results.text, spans = results.spans, extraInfo = results.extraInfo;
                var build = builder.buildDoc(results);
                var blocks = build.blocks, buildErrors = build.errors;
                results.code = code;
                parse = results;
                for (var _e = 0, buildErrors_2 = buildErrors; _e < buildErrors_2.length; _e++) {
                    var error = buildErrors_2[_e];
                    error.injectSpan(spans, extraInfo);
                }
                this.lastCss = css;
                this.send(JSON.stringify({ type: "css", css: css + currentCss }));
            }
            if (this.evaluation !== undefined && data.persist) {
                var changes = this.evaluation.createChanges();
                var session = this.evaluation.getDatabase("session");
                for (var _f = 0, _g = session.blocks; _f < _g.length; _f++) {
                    var block = _g[_f];
                    if (block.bindActions.length) {
                        block.updateBinds({ positions: {}, info: [] }, changes);
                    }
                }
                var build = builder.buildDoc(parse);
                var blocks = build.blocks, errors = build.errors;
                var spans = [];
                var extraInfo = {};
                if (this.extraDBs["editor"]) {
                    analyzer.analyze(blocks.map(function (block) { return block.parse; }), spans, extraInfo);
                }
                this.sendErrors(errors);
                for (var _h = 0, blocks_1 = blocks; _h < blocks_1.length; _h++) {
                    var block = blocks_1[_h];
                    if (block.singleRun)
                        block.dormant = true;
                }
                session.blocks = blocks;
                this.evaluation.unregisterDatabase("session");
                this.evaluation.registerDatabase("session", session);
                changes.commit();
                this.evaluation.fixpoint(changes);
            }
            else {
                var spans = [];
                var extraInfo = {};
                this.makeEvaluation(parse);
                this.evaluation.fixpoint();
            }
        }
        else if (data.type === "tokenInfo") {
            var spans = [];
            var extraInfo = {};
            analyzer.tokenInfo(this.evaluation, data.tokenId, spans, extraInfo);
            this.send(JSON.stringify({ type: "comments", spans: spans, extraInfo: extraInfo }));
        }
        else if (data.type === "findNode") {
            var recordId = data.recordId, node = data.node;
            var spans = [];
            var extraInfo = {};
            var spanId = analyzer.nodeIdToRecord(this.evaluation, data.node, spans, extraInfo);
            this.send(JSON.stringify({ type: "findNode", recordId: recordId, spanId: spanId }));
        }
        else if (data.type === "findSource") {
            var spans = [];
            var extraInfo = {};
            var spanId = analyzer.findSource(this.evaluation, data, spans, extraInfo);
            this.send(JSON.stringify(data));
        }
        else if (data.type === "findRelated") {
            var spans = [];
            var extraInfo = {};
            var spanId = analyzer.findRelated(this.evaluation, data, spans, extraInfo);
            this.send(JSON.stringify(data));
        }
        else if (data.type === "findValue") {
            var spans = [];
            var extraInfo = {};
            var spanId = analyzer.findValue(this.evaluation, data, spans, extraInfo);
            this.send(JSON.stringify(data));
        }
        else if (data.type === "findCardinality") {
            var spans = [];
            var extraInfo = {};
            var spanId = analyzer.findCardinality(this.evaluation, data, spans, extraInfo);
            this.send(JSON.stringify(data));
        }
        else if (data.type === "findAffector") {
            var spans = [];
            var extraInfo = {};
            var spanId = analyzer.findAffector(this.evaluation, data, spans, extraInfo);
            this.send(JSON.stringify(data));
        }
        else if (data.type === "findFailure") {
            var spans = [];
            var extraInfo = {};
            var spanId = analyzer.findFailure(this.evaluation, data, spans, extraInfo);
            this.send(JSON.stringify(data));
        }
        else if (data.type === "findRootDrawers") {
            var spans = [];
            var extraInfo = {};
            var spanId = analyzer.findRootDrawers(this.evaluation, data, spans, extraInfo);
            this.send(JSON.stringify(data));
        }
        else if (data.type === "findMaybeDrawers") {
            var spans = [];
            var extraInfo = {};
            var spanId = analyzer.findMaybeDrawers(this.evaluation, data, spans, extraInfo);
            this.send(JSON.stringify(data));
        }
        else if (data.type === "findPerformance") {
            var perf = this.evaluation.perf;
            var userBlocks = {};
            for (var _j = 0, _k = this.evaluation.getDatabase("session").blocks; _j < _k.length; _j++) {
                var block = _k[_j];
                userBlocks[block.id] = true;
            }
            var perfInfo = perf.asObject(userBlocks);
            perfInfo.type = "findPerformance";
            perfInfo.requestId = data.requestId;
            this.send(JSON.stringify(perfInfo));
        }
        else if (data.type === "findRecordsFromToken") {
            var spans = [];
            var extraInfo = {};
            var spanId = analyzer.findRecordsFromToken(this.evaluation, data, spans, extraInfo);
            this.send(JSON.stringify(data));
        }
        else if (data.type === "dumpState") {
            var dbs = this.evaluation.save();
            var code = this.lastParse.code;
            var output = JSON.stringify({ code: code, databases: { "session": dbs.session } });
            this.send(JSON.stringify({ type: "dumpState", state: output }));
        }
        else if (data.type === "load") {
            var spans = [];
            var extraInfo = {};
            this.makeEvaluation();
            var blocks = this.evaluation.getDatabase("session").blocks;
            for (var _l = 0, blocks_2 = blocks; _l < blocks_2.length; _l++) {
                var block = blocks_2[_l];
                if (block.singleRun) {
                    block.dormant = true;
                }
            }
            this.evaluation.load(data.info.databases);
        }
        else {
            console.error("Unhandled message type: " + json);
        }
    };
    return RuntimeClient;
}());
exports.RuntimeClient = RuntimeClient;
//# sourceMappingURL=runtimeClient.js.map