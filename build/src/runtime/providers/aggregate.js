"use strict";
//---------------------------------------------------------------------
// Aggregate providers
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
var Aggregate = (function (_super) {
    __extends(Aggregate, _super);
    function Aggregate(id, args, returns) {
        var _this = _super.call(this, id, args, returns) || this;
        var value = args[0], given = args[1], per = args[2];
        if (given === undefined) {
            _this.projectionVars = [];
        }
        else if (join_1.isVariable(given)) {
            _this.projectionVars = [given];
        }
        else {
            _this.projectionVars = given;
        }
        if (per === undefined) {
            _this.groupVars = [];
        }
        else if (join_1.isVariable(per)) {
            _this.groupVars = [per];
        }
        else {
            _this.groupVars = per;
        }
        _this.value = value;
        _this.resolvedGroup = [];
        _this.resolvedProjection = [];
        _this.resolvedAggregate = { group: _this.resolvedGroup, projection: _this.resolvedProjection, value: undefined };
        _this.aggregateResults = {};
        return _this;
    }
    Aggregate.prototype.resolveAggregate = function (prefix) {
        join_1.resolve(this.projectionVars, prefix, this.resolvedProjection);
        join_1.resolve(this.groupVars, prefix, this.resolvedGroup);
        var resolved = this.resolvedAggregate;
        resolved.value = join_1.toValue(this.value, prefix);
        return resolved;
    };
    Aggregate.prototype.aggregate = function (rows) {
        var groupKeys = [];
        var groups = {};
        for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
            var row = rows_1[_i];
            var _a = this.resolveAggregate(row), group = _a.group, projection = _a.projection, value = _a.value;
            var groupKey = "[]";
            if (group.length !== 0) {
                groupKey = JSON.stringify(group);
            }
            var groupValues = groups[groupKey];
            if (groupValues === undefined) {
                groupKeys.push(groupKey);
                groupValues = groups[groupKey] = {};
            }
            var projectionKey = JSON.stringify(projection);
            if (groupValues[projectionKey] === undefined) {
                groupValues[projectionKey] = true;
                this.adjustAggregate(groupValues, value, projection);
            }
        }
        for (var _b = 0, groupKeys_1 = groupKeys; _b < groupKeys_1.length; _b++) {
            var key = groupKeys_1[_b];
            this.finalizeGroup(groups[key]);
        }
        this.aggregateResults = groups;
        return groups;
    };
    Aggregate.prototype.resolveProposal = function (proposal, prefix) {
        if (proposal.index) {
            return [proposal.index.result];
        }
        return [];
    };
    Aggregate.prototype.test = function (prefix) {
        var group = this.resolveAggregate(prefix).group;
        var resultGroup = this.aggregateResults[JSON.stringify(group)];
        if (resultGroup !== undefined) {
            var returns = join_1.resolve(this.returns, prefix, this.resolvedReturns);
            return returns[0] === resultGroup.result;
        }
    };
    Aggregate.prototype.getProposal = function (multiIndex, proposed, prefix) {
        var group = this.resolveAggregate(prefix).group;
        var resultGroup = this.aggregateResults[JSON.stringify(group)];
        var proposal = this.proposalObject;
        if (resultGroup) {
            proposal.index = resultGroup;
            proposal.providing = proposed;
            proposal.cardinality = 1;
        }
        else {
            proposal.index = undefined;
            proposal.providing = proposed;
            proposal.cardinality = 0;
        }
        return proposal;
    };
    Aggregate.prototype.finalizeGroup = function (group) { };
    Aggregate.isAggregate = true;
    Aggregate.AttributeMapping = {
        "value": 0,
        "given": 1,
        "per": 2,
    };
    return Aggregate;
}(join_1.Constraint));
exports.Aggregate = Aggregate;
var Sum = (function (_super) {
    __extends(Sum, _super);
    function Sum() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Sum.prototype.adjustAggregate = function (group, value, projection) {
        if (group.result === undefined) {
            group.result = value;
        }
        else {
            group.result += value;
        }
        return group.result;
    };
    return Sum;
}(Aggregate));
exports.Sum = Sum;
var Count = (function (_super) {
    __extends(Count, _super);
    function Count() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Count.prototype.adjustAggregate = function (group, value, projection) {
        if (group.result === undefined) {
            group.result = 1;
        }
        else {
            group.result += 1;
        }
        return group.result;
    };
    return Count;
}(Aggregate));
exports.Count = Count;
var Average = (function (_super) {
    __extends(Average, _super);
    function Average() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Average.prototype.adjustAggregate = function (group, value, projection) {
        if (group.count === undefined) {
            group.count = 1;
            group.sum = value;
            group.result = group.sum / group.count;
        }
        else {
            group.count += 1;
            group.sum += value;
            group.result = group.sum / group.count;
        }
        return group.result;
    };
    return Average;
}(Aggregate));
exports.Average = Average;
var Min = (function (_super) {
    __extends(Min, _super);
    function Min() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Min.prototype.adjustAggregate = function (group, value, projection) {
        if (group.result === undefined) {
            group.result = value;
        }
        else if (value < group.result) {
            group.result = value;
        }
        return group.result;
    };
    return Min;
}(Aggregate));
exports.Min = Min;
var Max = (function (_super) {
    __extends(Max, _super);
    function Max() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Max.prototype.adjustAggregate = function (group, value, projection) {
        if (group.result === undefined) {
            group.result = value;
        }
        else if (value > group.result) {
            group.result = value;
        }
        return group.result;
    };
    return Max;
}(Aggregate));
exports.Max = Max;
var Join = (function (_super) {
    __extends(Join, _super);
    function Join(id, args, returns) {
        var _this = _super.call(this, id, args, returns) || this;
        _this.token = args[0];
        _this.index = args[3];
        _this.sepwith = args[4];
        return _this;
    }
    Join.prototype.aggregate = function (rows) {
        var groupKeys = [];
        var groups = {};
        for (var _i = 0, rows_2 = rows; _i < rows_2.length; _i++) {
            var row = rows_2[_i];
            join_1.resolve(this.projectionVars, row, this.resolvedProjection);
            join_1.resolve(this.groupVars, row, this.resolvedGroup);
            var group = this.resolvedAggregate.group;
            var projection = this.resolvedAggregate.projection;
            var token = join_1.toValue(this.token, row);
            var index = join_1.toValue(this.index, row);
            var sepwith = join_1.toValue(this.sepwith, row);
            if (sepwith === undefined)
                sepwith = "";
            var groupKey = "[]";
            if (group.length !== 0) {
                groupKey = JSON.stringify(group);
            }
            var groupValues = groups[groupKey];
            if (groupValues === undefined) {
                groupKeys.push(groupKey);
                groupValues = groups[groupKey] = { result: [] };
            }
            var projectionKey = JSON.stringify(projection);
            if (groupValues[projectionKey] === undefined) {
                groupValues[projectionKey] = true;
                groupValues.result.push({ token: token, index: index, sepwith: sepwith });
            }
        }
        for (var g in groups) {
            var s = groups[g].result.sort(function (a, b) {
                if (a.index > b.index)
                    return 1;
                if (a.index === b.index)
                    return 0;
                return -1;
            });
            var len = s.length;
            var result = "";
            for (var i = 0; i < len; ++i) {
                // this means that the sep assocated with a value
                // is the one which occurs before the value
                if (i != 0)
                    result += s[i].sepwith;
                result += s[i].token;
            }
            groups[g].result = result;
        }
        this.aggregateResults = groups;
        return groups;
    };
    // unused but to keep mr. class happy
    Join.prototype.adjustAggregate = function (group, value, projection) { };
    Join.AttributeMapping = {
        "value": 0,
        "given": 1,
        "per": 2,
        "index": 3,
        "with": 4,
        "token": 0
    };
    return Join;
}(Aggregate));
exports.Join = Join;
providers.provide("sum", Sum);
providers.provide("count", Count);
providers.provide("average", Average);
providers.provide("join", Join);
providers.provide("min", Min);
providers.provide("max", Max);
//# sourceMappingURL=aggregate.js.map