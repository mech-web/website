"use strict";
//---------------------------------------------------------------------
// Node HTTP Database
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
var eavs = require("../../util/eavs");
var httpRequest = require("request");
var HttpDatabase = (function (_super) {
    __extends(HttpDatabase, _super);
    function HttpDatabase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HttpDatabase.prototype.sendRequest = function (evaluation, requestId, request) {
        var _this = this;
        var options = { url: request.url[0], headers: {} };
        if (request.headers) {
            var headers = this.index.asObject(request.headers[0]);
            for (var header in headers) {
                options.headers[header] = headers[header];
            }
        }
        if (request.method) {
            options.method = request.method[0];
        }
        if (request.json) {
            var object = this.index.asObject(request.json[0], true, true);
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(object);
        }
        if (request.body) {
            options.body = request.body[0];
        }
        httpRequest(options, function (error, response, body) {
            if (error || !response) {
                // @TODO: expose errors and other weirdness into Eve instead of just bailing here.
                console.error(error || "ERROR: No response received from HTTP request");
                return;
            }
            var scope = "http";
            var responseId = requestId + "|response";
            var changes = evaluation.createChanges();
            changes.store(scope, requestId, "response", responseId, _this.id);
            changes.store(scope, responseId, "tag", "response", _this.id);
            var contentType = response.headers["content-type"];
            if (contentType && contentType.indexOf("application/json") > -1) {
                var id = eavs.fromJS(changes, JSON.parse(body), _this.id, scope, responseId + "|json");
                changes.store(scope, responseId, "json", id, _this.id);
            }
            changes.store(scope, responseId, "body", body, _this.id);
            evaluation.executeActions([], changes);
        });
    };
    HttpDatabase.prototype.onFixpoint = function (evaluation, changes) {
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
                    var request = index.asObject(e);
                    if (request.url) {
                        actions.push(new actions_1.InsertAction("http|sender", e, "tag", "sent", undefined, [name]));
                        this.sendRequest(evaluation, e, request);
                    }
                }
            }
        }
        if (actions.length) {
            process.nextTick(function () {
                evaluation.executeActions(actions);
            });
        }
        var _a;
    };
    return HttpDatabase;
}(runtime_1.Database));
exports.HttpDatabase = HttpDatabase;
//# sourceMappingURL=http.js.map