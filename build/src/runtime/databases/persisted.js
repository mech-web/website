"use strict";
//---------------------------------------------------------------------
// Persisted Database
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
var runtime_1 = require("../runtime");
var PersistedDatabase = (function (_super) {
    __extends(PersistedDatabase, _super);
    function PersistedDatabase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PersistedDatabase.prototype.onFixpoint = function (evaluation, changes) {
        _super.prototype.onFixpoint.call(this, evaluation, changes);
    };
    return PersistedDatabase;
}(runtime_1.Database));
exports.PersistedDatabase = PersistedDatabase;
//# sourceMappingURL=persisted.js.map