"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Owner;
(function (Owner) {
    Owner[Owner["client"] = 0] = "client";
    Owner[Owner["server"] = 1] = "server";
})(Owner = exports.Owner || (exports.Owner = {}));
;
var Mode;
(function (Mode) {
    Mode[Mode["workspace"] = 0] = "workspace";
    Mode[Mode["file"] = 1] = "file";
})(Mode = exports.Mode || (exports.Mode = {}));
;
exports.config = {};
function init(opts) {
    for (var key in opts) {
        exports.config[key] = opts[key];
    }
}
exports.init = init;
//# sourceMappingURL=config.js.map