"use strict";
//---------------------------------------------------------------------
// Math providers
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
var TotalFunctionConstraint = (function (_super) {
    __extends(TotalFunctionConstraint, _super);
    function TotalFunctionConstraint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Proposes the return value of the total function as the value for the
    // proposed variable.
    TotalFunctionConstraint.prototype.resolveProposal = function (proposal, prefix) {
        var args = this.resolve(prefix).args;
        var result = this.getReturnValue(args);
        if (isNaN(result)) {
            return [];
        }
        return [result];
    };
    // Check if our return is equivalent to the result of the total function.
    TotalFunctionConstraint.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        return this.getReturnValue(args) === returns[0];
    };
    // Total functions always have a cardinality of 1
    TotalFunctionConstraint.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var proposal = this.proposalObject;
        proposal.providing = proposed;
        proposal.cardinality = 1;
        return proposal;
    };
    return TotalFunctionConstraint;
}(join_1.Constraint));
var TrigConstraint = (function (_super) {
    __extends(TrigConstraint, _super);
    function TrigConstraint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TrigConstraint.prototype.resolveTrigAttributes = function (args) {
        var degrees = args[0];
        var radians = args[1];
        //degrees which overrides radians. 
        if (!isNaN(degrees)) {
            radians = degreesToRadians(degrees);
        }
        return radians;
    };
    TrigConstraint.AttributeMapping = {
        "degrees": 0,
        "radians": 1
    };
    return TrigConstraint;
}(TotalFunctionConstraint));
var ValueOnlyConstraint = (function (_super) {
    __extends(ValueOnlyConstraint, _super);
    function ValueOnlyConstraint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ValueOnlyConstraint.AttributeMapping = {
        "value": 0
    };
    return ValueOnlyConstraint;
}(TotalFunctionConstraint));
function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}
var Add = (function (_super) {
    __extends(Add, _super);
    function Add() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Add.prototype.getReturnValue = function (args) {
        if ((typeof (args[0]) === "number") && (typeof (args[1]) === "number")) {
            return args[0] + args[1];
        }
        else {
            return NaN;
        }
    };
    return Add;
}(TotalFunctionConstraint));
var Subtract = (function (_super) {
    __extends(Subtract, _super);
    function Subtract() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Subtract.prototype.getReturnValue = function (args) {
        return args[0] - args[1];
    };
    return Subtract;
}(TotalFunctionConstraint));
var Multiply = (function (_super) {
    __extends(Multiply, _super);
    function Multiply() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Multiply.prototype.getReturnValue = function (args) {
        return args[0] * args[1];
    };
    return Multiply;
}(TotalFunctionConstraint));
var Divide = (function (_super) {
    __extends(Divide, _super);
    function Divide() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Divide.prototype.resolveProposal = function (proposal, prefix) {
        var args = this.resolve(prefix).args;
        //Handle divide by zero
        if (args[1] === 0) {
            return [];
        }
        ;
        return [this.getReturnValue(args)];
    };
    Divide.prototype.getReturnValue = function (args) {
        if (args[1] === 0) {
            return;
        }
        ;
        return args[0] / args[1];
    };
    return Divide;
}(TotalFunctionConstraint));
var Sin = (function (_super) {
    __extends(Sin, _super);
    function Sin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Sin.prototype.getReturnValue = function (args) {
        return Math.sin(this.resolveTrigAttributes(args));
    };
    return Sin;
}(TrigConstraint));
var Cos = (function (_super) {
    __extends(Cos, _super);
    function Cos() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Cos.prototype.getReturnValue = function (args) {
        return Math.cos(this.resolveTrigAttributes(args));
    };
    return Cos;
}(TrigConstraint));
var Tan = (function (_super) {
    __extends(Tan, _super);
    function Tan() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Tan.prototype.getReturnValue = function (args) {
        return Math.tan(this.resolveTrigAttributes(args));
    };
    return Tan;
}(TrigConstraint));
var ASin = (function (_super) {
    __extends(ASin, _super);
    function ASin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ASin.prototype.getReturnValue = function (args) {
        return Math.asin(args[0]);
    };
    return ASin;
}(ValueOnlyConstraint));
var ACos = (function (_super) {
    __extends(ACos, _super);
    function ACos() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ACos.prototype.getReturnValue = function (args) {
        return Math.acos(args[0]);
    };
    return ACos;
}(ValueOnlyConstraint));
var ATan = (function (_super) {
    __extends(ATan, _super);
    function ATan() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ATan.prototype.getReturnValue = function (args) {
        return Math.atan(args[0]);
    };
    return ATan;
}(ValueOnlyConstraint));
var ATan2 = (function (_super) {
    __extends(ATan2, _super);
    function ATan2() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ATan2.prototype.getReturnValue = function (args) {
        return (Math.atan2(args[0], args[1]));
    };
    ATan2.AttributeMapping = {
        "x": 0,
        "y": 1
    };
    return ATan2;
}(TotalFunctionConstraint));
//Hyperbolic Functions
var SinH = (function (_super) {
    __extends(SinH, _super);
    function SinH() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SinH.prototype.sinh = function (x) {
        var y = Math.exp(x);
        return (y - 1 / y) / 2;
    };
    SinH.prototype.getReturnValue = function (args) {
        return (this.sinh(args[0]));
    };
    return SinH;
}(ValueOnlyConstraint));
var CosH = (function (_super) {
    __extends(CosH, _super);
    function CosH() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CosH.prototype.cosh = function (x) {
        var y = Math.exp(x);
        return (y + 1 / y) / 2;
    };
    CosH.prototype.getReturnValue = function (args) {
        return (this.cosh(args[0]));
    };
    return CosH;
}(ValueOnlyConstraint));
var TanH = (function (_super) {
    __extends(TanH, _super);
    function TanH() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TanH.prototype.tanh = function (x) {
        if (x === Infinity) {
            return 1;
        }
        else if (x === -Infinity) {
            return -1;
        }
        else {
            var y = Math.exp(2 * x);
            return (y - 1) / (y + 1);
        }
    };
    TanH.prototype.getReturnValue = function (args) {
        return (this.tanh(args[0]));
    };
    return TanH;
}(ValueOnlyConstraint));
//Inverse Hyperbolic
var ASinH = (function (_super) {
    __extends(ASinH, _super);
    function ASinH() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ASinH.prototype.asinh = function (x) {
        if (x === -Infinity) {
            return x;
        }
        else {
            return Math.log(x + Math.sqrt(x * x + 1));
        }
    };
    ASinH.prototype.getReturnValue = function (args) {
        return this.asinh(args[0]);
    };
    return ASinH;
}(ValueOnlyConstraint));
var ACosH = (function (_super) {
    __extends(ACosH, _super);
    function ACosH() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ACosH.prototype.acosh = function (x) {
        //How do we handle number outside of range in Eve? 
        if (x < 1) {
            return NaN;
        }
        return Math.log(x + Math.sqrt(x * x - 1));
    };
    ACosH.prototype.getReturnValue = function (args) {
        return this.acosh(args[0]);
    };
    return ACosH;
}(ValueOnlyConstraint));
var ATanH = (function (_super) {
    __extends(ATanH, _super);
    function ATanH() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ATanH.prototype.atanh = function (x) {
        //How do we handle number outside of range in Eve? 
        if (Math.abs(x) > 1) {
            return NaN;
        }
        return Math.log((1 + x) / (1 - x)) / 2;
    };
    ATanH.prototype.getReturnValue = function (args) {
        return this.atanh(args[0]);
    };
    return ATanH;
}(ValueOnlyConstraint));
var Log = (function (_super) {
    __extends(Log, _super);
    function Log() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Log.prototype.getReturnValue = function (args) {
        var baselog = 1;
        if (!(isNaN(args[1]))) {
            baselog = Math.log(args[1]);
        }
        return (Math.log(args[0]) / baselog);
    };
    Log.AttributeMapping = {
        "value": 0,
        "base": 1
    };
    return Log;
}(TotalFunctionConstraint));
var Exp = (function (_super) {
    __extends(Exp, _super);
    function Exp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Exp.prototype.getReturnValue = function (args) {
        return (Math.exp(args[0]));
    };
    return Exp;
}(ValueOnlyConstraint));
var Pow = (function (_super) {
    __extends(Pow, _super);
    function Pow() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Pow.prototype.getReturnValue = function (args) {
        return Math.pow(args[0], args[1]);
    };
    Pow.AttributeMapping = {
        "value": 0,
        "by": 1,
    };
    return Pow;
}(TotalFunctionConstraint));
var Mod = (function (_super) {
    __extends(Mod, _super);
    function Mod() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Mod.prototype.getReturnValue = function (args) {
        return args[0] % args[1];
    };
    Mod.AttributeMapping = {
        "value": 0,
        "by": 1,
    };
    return Mod;
}(TotalFunctionConstraint));
var Abs = (function (_super) {
    __extends(Abs, _super);
    function Abs() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Abs.prototype.getReturnValue = function (args) {
        return Math.abs(args[0]);
    };
    return Abs;
}(ValueOnlyConstraint));
var Floor = (function (_super) {
    __extends(Floor, _super);
    function Floor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Floor.prototype.getReturnValue = function (args) {
        return Math.floor(args[0]);
    };
    return Floor;
}(ValueOnlyConstraint));
var Ceiling = (function (_super) {
    __extends(Ceiling, _super);
    function Ceiling() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Ceiling.prototype.getReturnValue = function (args) {
        return Math.ceil(args[0]);
    };
    return Ceiling;
}(ValueOnlyConstraint));
var Random = (function (_super) {
    __extends(Random, _super);
    function Random() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Random.prototype.getReturnValue = function (args) {
        var seed = args[0];
        var found = Random.cache[seed];
        if (found)
            return found;
        return Random.cache[seed] = Math.random();
    };
    Random.AttributeMapping = {
        "seed": 0,
    };
    Random.cache = {};
    return Random;
}(TotalFunctionConstraint));
var Gaussian = (function (_super) {
    __extends(Gaussian, _super);
    function Gaussian() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Gaussian.prototype.getReturnValue = function (args) {
        var seed = args[0], sigma = args[1], mu = args[2];
        if (sigma === undefined)
            sigma = 1.0;
        if (mu === undefined)
            mu = 0.0;
        var key = "" + seed + sigma + mu;
        var found = Gaussian.cache[key];
        if (found)
            return found;
        var u1 = Math.random();
        var u2 = Math.random();
        var z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(Math.PI * 2 * u2);
        var res = z0 * sigma + mu;
        Gaussian.cache[key] = res;
        return res;
    };
    Gaussian.AttributeMapping = {
        "seed": 0,
        "stdev": 1,
        "mean": 2
    };
    Gaussian.cache = {};
    return Gaussian;
}(TotalFunctionConstraint));
var Round = (function (_super) {
    __extends(Round, _super);
    function Round() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Round.prototype.getReturnValue = function (args) {
        return Math.round(args[0]);
    };
    return Round;
}(ValueOnlyConstraint));
var Fix = (function (_super) {
    __extends(Fix, _super);
    function Fix() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Fix.prototype.getReturnValue = function (args) {
        var x = args[0];
        return x - x % 1;
    };
    return Fix;
}(ValueOnlyConstraint));
var ToFixed = (function (_super) {
    __extends(ToFixed, _super);
    function ToFixed() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ToFixed.prototype.getReturnValue = function (args) {
        return args[0].toFixed(args[1]);
    };
    ToFixed.AttributeMapping = {
        "value": 0,
        "places": 1,
    };
    return ToFixed;
}(TotalFunctionConstraint));
var Range = (function (_super) {
    __extends(Range, _super);
    function Range() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Range.prototype.resolveProposal = function (proposal, prefix) {
        var args = this.resolve(prefix).args;
        var from = args[0], to = args[1], increment = args[2];
        increment = increment || 1;
        var results = [];
        if (from <= to) {
            for (var val = from; val <= to; val += increment) {
                results.push(val);
            }
        }
        else {
            for (var val = from; val >= to; val += increment) {
                results.push(val);
            }
        }
        return results;
    };
    Range.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        var from = args[0], to = args[1], increment = args[2];
        increment = increment || 1;
        var val = returns[0];
        var member = from <= val && val <= to &&
            ((val - from) % increment) == 0;
        return member;
    };
    Range.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var args = this.resolve(prefix).args;
        var from = args[0], to = args[1], increment = args[2];
        increment = args[2] || 1;
        var proposal = this.proposalObject;
        proposal.providing = proposed;
        if (from <= to && increment < 0) {
            proposal.cardinality = 0;
            return proposal;
        }
        else if (from > to && increment > 0) {
            proposal.cardinality = 0;
            return proposal;
        }
        proposal.cardinality = Math.ceil(Math.abs((to - from + 1) / increment));
        return proposal;
    };
    Range.AttributeMapping = {
        "from": 0,
        "to": 1,
        "increment": 2,
    };
    return Range;
}(join_1.Constraint));
//Constants
var PI = (function (_super) {
    __extends(PI, _super);
    function PI() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PI.prototype.getReturnValue = function (args) {
        return Math.PI;
    };
    return PI;
}(TotalFunctionConstraint));
var E = (function (_super) {
    __extends(E, _super);
    function E() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    E.prototype.getReturnValue = function (args) {
        return Math.E;
    };
    return E;
}(TotalFunctionConstraint));
var LN2 = (function (_super) {
    __extends(LN2, _super);
    function LN2() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LN2.prototype.getReturnValue = function (args) {
        return Math.LN2;
    };
    return LN2;
}(TotalFunctionConstraint));
var LN10 = (function (_super) {
    __extends(LN10, _super);
    function LN10() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LN10.prototype.getReturnValue = function (args) {
        return Math.LN10;
    };
    return LN10;
}(TotalFunctionConstraint));
var LOG2E = (function (_super) {
    __extends(LOG2E, _super);
    function LOG2E() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LOG2E.prototype.getReturnValue = function (args) {
        return Math.LOG2E;
    };
    return LOG2E;
}(TotalFunctionConstraint));
var LOG10E = (function (_super) {
    __extends(LOG10E, _super);
    function LOG10E() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LOG10E.prototype.getReturnValue = function (args) {
        return Math.LOG10E;
    };
    return LOG10E;
}(TotalFunctionConstraint));
var SQRT1_2 = (function (_super) {
    __extends(SQRT1_2, _super);
    function SQRT1_2() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SQRT1_2.prototype.getReturnValue = function (args) {
        return Math.SQRT1_2;
    };
    return SQRT1_2;
}(TotalFunctionConstraint));
var SQRT2 = (function (_super) {
    __extends(SQRT2, _super);
    function SQRT2() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SQRT2.prototype.getReturnValue = function (args) {
        return Math.SQRT2;
    };
    return SQRT2;
}(TotalFunctionConstraint));
providers.provide("+", Add);
providers.provide("-", Subtract);
providers.provide("*", Multiply);
providers.provide("/", Divide);
providers.provide("log", Log);
providers.provide("exp", Exp);
//Trig and Inverse Trig
providers.provide("sin", Sin);
providers.provide("cos", Cos);
providers.provide("tan", Tan);
providers.provide("asin", ASin);
providers.provide("acos", ACos);
providers.provide("atan", ATan);
providers.provide("atan2", ATan2);
//Hyperbolic Functions.
providers.provide("sinh", SinH);
providers.provide("cosh", CosH);
providers.provide("tanh", TanH);
providers.provide("asinh", ASinH);
providers.provide("acosh", ACosH);
providers.provide("atanh", ATanH);
providers.provide("floor", Floor);
providers.provide("ceiling", Ceiling);
providers.provide("abs", Abs);
providers.provide("mod", Mod);
providers.provide("pow", Pow);
providers.provide("random", Random);
providers.provide("range", Range);
providers.provide("round", Round);
providers.provide("fix", Fix);
providers.provide("gaussian", Gaussian);
providers.provide("to-fixed", ToFixed);
//Constants
providers.provide("pi", PI);
providers.provide("e", E);
providers.provide("ln2", LN2);
providers.provide("ln10", LN10);
providers.provide("log2e", LOG2E);
providers.provide("log10e", LOG10E);
providers.provide("sqrt1/2", SQRT1_2);
providers.provide("sqrt2", SQRT2);
//# sourceMappingURL=math.js.map