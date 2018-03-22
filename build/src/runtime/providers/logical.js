"use strict";
//---------------------------------------------------------------------
// Logical providers
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
var join_1 = require("../join");
var providers = require("./index");
var BooleanOperation = (function (_super) {
    __extends(BooleanOperation, _super);
    function BooleanOperation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BooleanOperation.prototype.resolveProposal = function (proposal, prefix) {
        var args = this.resolve(prefix).args;
        return [this.compare(args[0], args[1])];
    };
    BooleanOperation.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        if (this.returns.length) {
            var proposal = this.proposalObject;
            proposal.providing = proposed;
            proposal.cardinality = 1;
            return proposal;
        }
        return;
    };
    BooleanOperation.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        var result = this.compare(args[0], args[1]);
        if (returns.length) {
            return result === returns[0];
        }
        return result;
    };
    return BooleanOperation;
}(join_1.Constraint));
var Equal = (function (_super) {
    __extends(Equal, _super);
    function Equal() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Equal.prototype.compare = function (a, b) { return a === b; };
    return Equal;
}(BooleanOperation));
var NotEqual = (function (_super) {
    __extends(NotEqual, _super);
    function NotEqual() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NotEqual.prototype.compare = function (a, b) { return a !== b; };
    return NotEqual;
}(BooleanOperation));
var GreaterThan = (function (_super) {
    __extends(GreaterThan, _super);
    function GreaterThan() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GreaterThan.prototype.compare = function (a, b) { return a > b; };
    return GreaterThan;
}(BooleanOperation));
var LessThan = (function (_super) {
    __extends(LessThan, _super);
    function LessThan() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LessThan.prototype.compare = function (a, b) { return a < b; };
    return LessThan;
}(BooleanOperation));
var GreaterThanEqualTo = (function (_super) {
    __extends(GreaterThanEqualTo, _super);
    function GreaterThanEqualTo() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GreaterThanEqualTo.prototype.compare = function (a, b) { return a >= b; };
    return GreaterThanEqualTo;
}(BooleanOperation));
var LessThanEqualTo = (function (_super) {
    __extends(LessThanEqualTo, _super);
    function LessThanEqualTo() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LessThanEqualTo.prototype.compare = function (a, b) { return a <= b; };
    return LessThanEqualTo;
}(BooleanOperation));
var AssertValue = (function (_super) {
    __extends(AssertValue, _super);
    function AssertValue() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AssertValue.prototype.resolveProposal = function (proposal, prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        return [args[0]];
    };
    AssertValue.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        return args[0] === returns[0];
    };
    AssertValue.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var proposal = this.proposalObject;
        proposal.providing = proposed;
        proposal.cardinality = 1;
        return proposal;
    };
    return AssertValue;
}(join_1.Constraint));
var Toggle = (function (_super) {
    __extends(Toggle, _super);
    function Toggle() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Toggle.prototype.resolveProposal = function (proposal, prefix) {
        var args = this.resolve(prefix).args;
        return [!(args[0] === true)];
    };
    Toggle.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        return !(args[0] === true) === returns[0];
    };
    Toggle.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var proposal = this.proposalObject;
        proposal.providing = proposed;
        proposal.cardinality = 1;
        return proposal;
    };
    Toggle.AttributeMapping = {
        "value": 0,
    };
    return Toggle;
}(join_1.Constraint));
//---------------------------------------------------------------------
// Internal logical providers
//---------------------------------------------------------------------
// InternalAnd is used as the function that is evaluated for is() forms.
// Is causes all boolean operators to return and then we wrap the returned
// values in InternalAnd
var InternalAnd = (function (_super) {
    __extends(InternalAnd, _super);
    function InternalAnd() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InternalAnd.prototype.resolveProposal = function (proposal, prefix) {
        var args = this.resolve(prefix).args;
        var result = true;
        for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
            var arg = args_1[_i];
            if (arg === false) {
                result = false;
                break;
            }
        }
        return [result];
    };
    InternalAnd.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        var result = true;
        for (var _i = 0, args_2 = args; _i < args_2.length; _i++) {
            var arg = args_2[_i];
            if (arg === false) {
                result = false;
                break;
            }
        }
        return result === returns[0];
    };
    InternalAnd.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var proposal = this.proposalObject;
        proposal.providing = proposed;
        proposal.cardinality = 1;
        return proposal;
    };
    return InternalAnd;
}(join_1.Constraint));
//---------------------------------------------------------------------
// Mappings
//---------------------------------------------------------------------
providers.provide(">", GreaterThan);
providers.provide("<", LessThan);
providers.provide("<=", LessThanEqualTo);
providers.provide(">=", GreaterThanEqualTo);
providers.provide("!=", NotEqual);
providers.provide("=", Equal);
providers.provide("toggle", Toggle);
providers.provide("eve-internal/and", InternalAnd);
//# sourceMappingURL=logical.js.map