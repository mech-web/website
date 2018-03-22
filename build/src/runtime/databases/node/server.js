"use strict";
//---------------------------------------------------------------------
// Node Server Database
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
var actions_1 = require("../../actions");
var runtime_1 = require("../../runtime");
var ServerDatabase = (function (_super) {
    __extends(ServerDatabase, _super);
    function ServerDatabase() {
        var _this = _super.call(this) || this;
        _this.handling = false;
        _this.requestId = 0;
        _this.receiving = false;
        _this.requestToResponse = {};
        return _this;
    }
    ServerDatabase.prototype.handleHttpRequest = function (request, response) {
        if (!this.receiving)
            return;
        var scopes = ["server"];
        var requestId = "request|" + this.requestId++ + "|" + (new Date()).getTime();
        this.requestToResponse[requestId] = response;
        var actions = [
            new actions_1.InsertAction("server|tag", requestId, "tag", "request", undefined, scopes),
            new actions_1.InsertAction("server|url", requestId, "url", request.url, undefined, scopes),
        ];
        if (request.headers) {
            var headerId = requestId + "|body";
            for (var _i = 0, _a = Object.keys(request.headers); _i < _a.length; _i++) {
                var key = _a[_i];
                actions.push(new actions_1.InsertAction("server|header", headerId, key, request.headers[key], undefined, scopes));
            }
            actions.push(new actions_1.InsertAction("server|headers", requestId, "headers", headerId, undefined, scopes));
        }
        if (request.body) {
            var body = request.body;
            if (typeof body === "string") {
                // nothing we need to do
            }
            else {
                var bodyId = requestId + "|body";
                for (var _b = 0, _c = Object.keys(body); _b < _c.length; _b++) {
                    var key = _c[_b];
                    actions.push(new actions_1.InsertAction("server|request-body-entry", bodyId, key, body[key], undefined, scopes));
                }
                body = bodyId;
            }
            actions.push(new actions_1.InsertAction("server|request-body", requestId, "body", body, undefined, scopes));
        }
        var evaluation = this.evaluations[0];
        evaluation.executeActions(actions);
    };
    ServerDatabase.prototype.analyze = function (evaluation, db) {
        for (var _i = 0, _a = db.blocks; _i < _a.length; _i++) {
            var block = _a[_i];
            for (var _b = 0, _c = block.parse.scanLike; _b < _c.length; _b++) {
                var scan = _c[_b];
                if (scan.type === "record" && scan.scopes.indexOf("server") > -1) {
                    for (var _d = 0, _e = scan.attributes; _d < _e.length; _d++) {
                        var attribute = _e[_d];
                        if (attribute.attribute === "tag" && attribute.value.value === "request") {
                            this.receiving = true;
                        }
                    }
                }
            }
        }
    };
    ServerDatabase.prototype.sendResponse = function (evaluation, requestId, status, body) {
        var response = this.requestToResponse[requestId];
        response.statusCode = status;
        response.end(body);
    };
    ServerDatabase.prototype.onFixpoint = function (evaluation, changes) {
        var name = evaluation.databaseToName(this);
        var result = changes.result((_a = {}, _a[name] = true, _a));
        var handled = {};
        var index = this.index;
        var actions = [];
        for (var _i = 0, _b = result.insert; _i < _b.length; _i++) {
            var insert = _b[_i];
            var e = insert[0], a = insert[1], v = insert[2];
            if (!handled[e]) {
                handled[e] = true;
                if (index.lookup(e, "tag", "request") && !index.lookup(e, "tag", "sent")) {
                    var responses = index.asValues(e, "response");
                    if (responses || index.lookup(e, "tag", "handling"))
                        this.handling = true;
                    if (responses === undefined)
                        continue;
                    var response = responses[0];
                    var _c = index.asObject(response), status_1 = _c.status, body = _c.body;
                    actions.push(new actions_1.InsertAction("server|sender", e, "tag", "sent", undefined, [name]));
                    this.sendResponse(evaluation, e, status_1[0], body[0]);
                }
            }
        }
        if (actions.length) {
            process.nextTick(function () {
                evaluation.executeActions(actions);
                // because this database is created per http request, we need to destroy this
                // evaluation once a response has been sent and we've dealt with any consequences
                // of the send.
                evaluation.close();
            });
        }
        var _a;
    };
    return ServerDatabase;
}(runtime_1.Database));
exports.ServerDatabase = ServerDatabase;
//# sourceMappingURL=server.js.map