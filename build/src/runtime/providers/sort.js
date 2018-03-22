"use strict";
//---------------------------------------------------------------------
// Sort provider
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
var Sort = (function (_super) {
    __extends(Sort, _super);
    function Sort(id, args, returns) {
        var _this = _super.call(this, id, args, returns) || this;
        var value = args[0], direction = args[1], per = args[2];
        if (value === undefined) {
            _this.valueVars = [];
        }
        else if (join_1.isVariable(value)) {
            _this.valueVars = [value];
        }
        else {
            _this.valueVars = value;
        }
        if (direction === undefined) {
            _this.directionVars = [];
        }
        else if (direction.constructor === Array) {
            _this.directionVars = direction;
        }
        else {
            _this.directionVars = [direction];
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
        _this.resolvedGroup = [];
        _this.resolvedValue = [];
        _this.resolvedDirection = [];
        _this.resolvedAggregate = { group: _this.resolvedGroup, value: _this.resolvedValue, direction: _this.resolvedDirection };
        _this.aggregateResults = {};
        return _this;
    }
    Sort.prototype.resolveAggregate = function (prefix) {
        join_1.resolve(this.valueVars, prefix, this.resolvedValue);
        join_1.resolve(this.directionVars, prefix, this.resolvedDirection);
        join_1.resolve(this.groupVars, prefix, this.resolvedGroup);
        var resolved = this.resolvedAggregate;
        return resolved;
    };
    Sort.prototype.aggregate = function (rows) {
        var groupKeys = [];
        var groups = {};
        for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
            var row = rows_1[_i];
            var _a = this.resolveAggregate(row), group = _a.group, value = _a.value, direction = _a.direction;
            var groupKey = "[]";
            if (group.length !== 0) {
                groupKey = JSON.stringify(group);
            }
            var groupValues = groups[groupKey];
            if (groupValues === undefined) {
                groupKeys.push(groupKey);
                groupValues = groups[groupKey] = {};
            }
            var valueKey = JSON.stringify(value);
            if (groupValues[valueKey] === undefined) {
                groupValues[valueKey] = true;
                groupValues["direction"] = direction.slice();
                this.adjustAggregate(groupValues, value, valueKey);
            }
        }
        for (var _b = 0, groupKeys_1 = groupKeys; _b < groupKeys_1.length; _b++) {
            var key = groupKeys_1[_b];
            this.finalizeGroup(groups[key]);
        }
        this.aggregateResults = groups;
        return groups;
    };
    Sort.prototype.resolveProposal = function (proposal, prefix) {
        if (proposal.index) {
            var value = this.resolveAggregate(prefix).value;
            return [proposal.index[JSON.stringify(value)]];
        }
        return [];
    };
    Sort.prototype.test = function (prefix) {
        var _a = this.resolveAggregate(prefix), group = _a.group, value = _a.value;
        var resultGroup = this.aggregateResults[JSON.stringify(group)];
        if (resultGroup !== undefined) {
            var returns = join_1.resolve(this.returns, prefix, this.resolvedReturns);
            return returns[0] === resultGroup[JSON.stringify(value)];
        }
    };
    Sort.prototype.getProposal = function (multiIndex, proposed, prefix) {
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
    Sort.prototype.finalizeGroup = function (group) {
        var result = group.result;
        var direction = group.direction;
        var multi = 1;
        result.sort(function (a, b) {
            var ix = -1;
            for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
                var aItem = a_1[_i];
                ix++;
                if (direction[ix] !== undefined) {
                    if (direction[ix] === "down") {
                        multi = -1;
                    }
                    else {
                        multi = 1;
                    }
                }
                if (aItem === b[ix])
                    continue;
                if (aItem > b[ix]) {
                    return 1 * multi;
                }
                else {
                    return -1 * multi;
                }
            }
            return 0;
        });
        var ix = 1;
        for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
            var item = result_1[_i];
            group[JSON.stringify(item)] = ix;
            ix++;
        }
    };
    Sort.prototype.adjustAggregate = function (group, value, key) {
        if (!group.result) {
            group.result = [];
        }
        group.result.push(value.slice());
    };
    Sort.isAggregate = true;
    Sort.AttributeMapping = {
        "value": 0,
        "direction": 1,
        "per": 2,
    };
    return Sort;
}(join_1.Constraint));
exports.Sort = Sort;
providers.provide("sort", Sort);
//# sourceMappingURL=sort.js.map