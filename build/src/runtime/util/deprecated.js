"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function deprecated(message) {
    if (message === void 0) { message = 'Function {name} is deprecated.'; }
    return function (instance, name, descriptor) {
        var original = descriptor.value;
        var localMessage = message.replace('{name}', name);
        descriptor.value = function () {
            console.warn(localMessage);
            return original.apply(instance, arguments);
        };
        return descriptor;
    };
}
exports.deprecated = deprecated;
//# sourceMappingURL=deprecated.js.map