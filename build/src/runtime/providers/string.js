"use strict";
//---------------------------------------------------------------------
// String providers
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
//---------------------------------------------------------------------
// Providers
//---------------------------------------------------------------------
var Split = (function (_super) {
    __extends(Split, _super);
    function Split(id, args, returns) {
        var _this = _super.call(this, id, args, returns) || this;
        if (_this.returns[1] !== undefined && _this.returns[0] !== undefined) {
            _this.returnType = "both";
        }
        else if (_this.returns[1] !== undefined) {
            _this.returnType = "index";
        }
        else {
            _this.returnType = "token";
        }
        return _this;
    }
    Split.prototype.resolveProposal = function (proposal, prefix) {
        var returns = this.resolve(prefix).returns;
        var tokens = proposal.index;
        var results = tokens;
        if (this.returnType === "both") {
            results = [];
            var ix = 1;
            for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
                var token = tokens_1[_i];
                results.push([token, ix]);
                ix++;
            }
        }
        else if (this.returnType === "index") {
            results = [];
            var ix = 1;
            for (var _a = 0, tokens_2 = tokens; _a < tokens_2.length; _a++) {
                var token = tokens_2[_a];
                results.push(ix);
                ix++;
            }
        }
        return results;
    };
    Split.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        // @TODO: this is expensive, we should probably try to cache the split somehow
        return args[0].split(args[1])[returns[1]] === returns[0];
    };
    Split.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var args = this.resolve(prefix).args;
        var proposal = this.proposalObject;
        if (this.returnType === "both") {
            proposal.providing = [this.returns[0], this.returns[1]];
        }
        else if (this.returnType == "index") {
            proposal.providing = this.returns[1];
        }
        else {
            proposal.providing = this.returns[0];
        }
        proposal.index = args[0].split(args[1]);
        proposal.cardinality = proposal.index.length;
        return proposal;
    };
    Split.AttributeMapping = {
        "text": 0,
        "by": 1,
    };
    Split.ReturnMapping = {
        "token": 0,
        "index": 1,
    };
    return Split;
}(join_1.Constraint));
// substring over the field 'text', with the base index being 1, inclusive, 'from' defaulting
// to the beginning of the string, and 'to' the end
var Substring = (function (_super) {
    __extends(Substring, _super);
    function Substring() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // To resolve a proposal, we concatenate our resolved args
    Substring.prototype.resolveProposal = function (proposal, prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        var from = 0;
        var text = args[0];
        var to = text.length;
        if (args[1] != undefined)
            from = args[1] - 1;
        if (args[2] != undefined)
            to = args[2];
        return [text.substring(from, to)];
    };
    Substring.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        var from = 0;
        var text = args[0];
        if (typeof text !== "string")
            return false;
        var to = text.length;
        if (args[1] != undefined)
            from = args[1] - 1;
        if (args[2] != undefined)
            to = args[2];
        return text.substring(from, to) === returns[0];
    };
    // substring always returns cardinality 1
    Substring.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var proposal = this.proposalObject;
        var args = this.resolve(prefix).args;
        if (typeof args[0] !== "string") {
            proposal.cardinality = 0;
        }
        else {
            proposal.providing = proposed;
            proposal.cardinality = 1;
        }
        return proposal;
    };
    Substring.AttributeMapping = {
        "text": 0,
        "from": 1,
        "to": 2,
    };
    Substring.ReturnMapping = {
        "value": 0,
    };
    return Substring;
}(join_1.Constraint));
var Find = (function (_super) {
    __extends(Find, _super);
    function Find(id, args, returns) {
        var _this = _super.call(this, id, args, returns) || this;
        if (_this.returns[1] !== undefined && _this.returns[0] !== undefined) {
            _this.returnType = "both";
        }
        else if (_this.returns[0] !== undefined) {
            _this.returnType = "position";
        }
        return _this;
    }
    Find.prototype.resolveProposal = function (proposal, prefix) {
        return proposal.index;
    };
    Find.prototype.getIndexes = function (text, subtext, from, caseSensitive, withIx) {
        var start = (from || 1) - 1;
        var currentIndex;
        var ixs = [];
        var subLength = subtext.length;
        if (!caseSensitive) {
            text = text.toLowerCase();
            subtext = subtext.toLowerCase();
        }
        if (withIx) {
            while ((currentIndex = text.indexOf(subtext, start)) > -1) {
                ixs.push([currentIndex + 1, ixs.length + 1]);
                start = currentIndex + subLength;
            }
        }
        else {
            while ((currentIndex = text.indexOf(subtext, start)) > -1) {
                ixs.push(currentIndex + 1);
                start = currentIndex + subLength;
            }
        }
        return ixs;
    };
    Find.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        var text = args[Find.AttributeMapping["text"]];
        var subtext = args[Find.AttributeMapping["subtext"]];
        if (typeof text !== "string" || typeof subtext !== "string")
            return false;
        return text.indexOf(subtext, returns[0] - 1) === returns[0];
    };
    Find.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var proposal = this.proposalObject;
        var args = this.resolve(prefix).args;
        var text = args[Find.AttributeMapping["text"]];
        var subtext = args[Find.AttributeMapping["subtext"]];
        var caseSensitive = args[Find.AttributeMapping["case-sensitive"]];
        var from = args[Find.AttributeMapping["from"]];
        if (typeof text !== "string" || typeof subtext !== "string") {
            proposal.cardinality = 0;
            return;
        }
        var both = this.returnType === "both";
        var indexes = this.getIndexes(text, subtext, from, caseSensitive, both);
        if (both) {
            proposal.providing = [this.returns[0], this.returns[1]];
        }
        else {
            proposal.providing = this.returns[0];
        }
        proposal.cardinality = indexes.length;
        proposal.index = indexes;
        return proposal;
    };
    Find.AttributeMapping = {
        "text": 0,
        "subtext": 1,
        "case-sensitive": 2,
        "from": 3,
    };
    Find.ReturnMapping = {
        "string-position": 0,
        "result-index": 0,
    };
    return Find;
}(join_1.Constraint));
var Convert = (function (_super) {
    __extends(Convert, _super);
    function Convert() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Convert.prototype.resolveProposal = function (proposal, prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        var from = 0;
        var value = args[0];
        var to = args[1];
        var converted;
        if (to === "number") {
            converted = +value;
            if (isNaN(converted))
                throw new Error("Unable to deal with NaN in the proposal stage.");
        }
        else if (to === "string") {
            converted = "" + value;
        }
        return [converted];
    };
    Convert.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        var value = args[0];
        var to = args[1];
        var converted;
        if (to === "number") {
            converted = +value;
            if (isNaN(converted))
                return false;
            if (converted === "")
                return false;
            return;
        }
        else if (to === "string") {
            converted = "" + value;
        }
        else {
            return false;
        }
        return converted === returns[0];
    };
    // 1 if valid, 0 otherwise
    Convert.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var proposal = this.proposalObject;
        var args = this.resolve(prefix).args;
        var value = args[0];
        var to = args[1];
        proposal.cardinality = 1;
        proposal.providing = proposed;
        if (to === "number") {
            if (isNaN(+value) || value === "")
                proposal.cardinality = 0;
        }
        else if (to === "string") {
        }
        else {
            proposal.cardinality = 0;
        }
        return proposal;
    };
    Convert.AttributeMapping = {
        "value": 0,
        "to": 1,
    };
    Convert.ReturnMapping = {
        "converted": 0,
    };
    return Convert;
}(join_1.Constraint));
// Urlencode a string
var Urlencode = (function (_super) {
    __extends(Urlencode, _super);
    function Urlencode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // To resolve a proposal, we urlencode a text
    Urlencode.prototype.resolveProposal = function (proposal, prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        var value = args[0];
        var converted;
        converted = encodeURIComponent(value);
        return [converted];
    };
    Urlencode.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        var value = args[0];
        var converted = encodeURIComponent(value);
        return converted === returns[0];
    };
    // Urlencode always returns cardinality 1
    Urlencode.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var proposal = this.proposalObject;
        var args = this.resolve(prefix).args;
        var value = args[0];
        proposal.cardinality = 1;
        proposal.providing = proposed;
        return proposal;
    };
    Urlencode.AttributeMapping = {
        "text": 0
    };
    Urlencode.ReturnMapping = {
        "value": 0,
    };
    return Urlencode;
}(join_1.Constraint));
var Length = (function (_super) {
    __extends(Length, _super);
    function Length() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Length.prototype.validAsOption = function (az) {
        if (az === undefined || az === "symbols" || az === "code-points") {
            return true;
        }
        else {
            return false;
        }
    };
    Length.prototype.getLength = function (text, az) {
        if (az === "symbols") {
            return [this.countSymbols(text)];
        }
        else if (az === "code-points") {
            return [text.length];
        }
        return undefined;
    };
    Length.prototype.resolveProposal = function (proposal, prefix) {
        var args = this.resolve(prefix).args;
        var text = args[0], az = args[1];
        if (az === undefined) {
            az = "symbols";
        }
        return this.getLength(text, az);
    };
    Length.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        var text = args[0], az = args[1];
        if (!this.validAsOption(az))
            return false;
        if (typeof text !== "string")
            return false;
        return this.getLength(text, az) === returns[0];
    };
    Length.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var proposal = this.proposalObject;
        var args = this.resolve(prefix).args;
        var text = args[0], az = args[1];
        if (typeof args[0] !== "string") {
            proposal.cardinality = 0;
        }
        else if (!this.validAsOption(az)) {
            proposal.cardinality = 0;
        }
        else {
            proposal.providing = proposed;
            proposal.cardinality = 1;
        }
        return proposal;
    };
    // Adapted from: https://mathiasbynens.be/notes/javascript-unicode
    Length.prototype.countSymbols = function (string) {
        var index;
        var symbolCount = 0;
        for (index = 0; index < string.length - 1; ++index) {
            var charCode = string.charCodeAt(index);
            if (charCode >= 0xD800 && charCode <= 0xDBFF) {
                charCode = string.charCodeAt(index + 1);
                if (charCode >= 0xDC00 && charCode <= 0xDFFF) {
                    index++;
                    symbolCount++;
                    continue;
                }
            }
            symbolCount++;
        }
        if (string.charAt(index) !== "") {
            symbolCount++;
        }
        return symbolCount;
    };
    Length.AttributeMapping = {
        "text": 0,
        "as": 1,
    };
    return Length;
}(join_1.Constraint));
//---------------------------------------------------------------------
// Internal providers
//---------------------------------------------------------------------
// InternalConcat is used for the implementation of string embedding, e.g.
// "foo {{name}}". Args expects a set of variables/string constants
// to concatenate together and an array with a single return variable
var InternalConcat = (function (_super) {
    __extends(InternalConcat, _super);
    function InternalConcat() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // To resolve a proposal, we concatenate our resolved args
    InternalConcat.prototype.resolveProposal = function (proposal, prefix) {
        var args = this.resolve(prefix).args;
        return [args.join("")];
    };
    // We accept a prefix if the return is equivalent to concatentating
    // all the args
    InternalConcat.prototype.test = function (prefix) {
        var _a = this.resolve(prefix), args = _a.args, returns = _a.returns;
        return args.join("") === returns[0];
    };
    // concat always returns cardinality 1
    InternalConcat.prototype.getProposal = function (tripleIndex, proposed, prefix) {
        var proposal = this.proposalObject;
        proposal.providing = proposed;
        proposal.cardinality = 1;
        return proposal;
    };
    return InternalConcat;
}(join_1.Constraint));
//---------------------------------------------------------------------
// Mappings
//---------------------------------------------------------------------
providers.provide("split", Split);
providers.provide("substring", Substring);
providers.provide("convert", Convert);
providers.provide("urlencode", Urlencode);
providers.provide("length", Length);
providers.provide("find", Find);
providers.provide("eve-internal/concat", InternalConcat);
//# sourceMappingURL=string.js.map