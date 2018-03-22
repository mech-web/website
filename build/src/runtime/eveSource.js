"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaces = {};
//---------------------------------------------------------
// Public
//---------------------------------------------------------
function loadWorkspaces(neue) {
    for (var key in neue) {
        var value = neue[key];
        exports.workspaces[key] = value;
    }
}
exports.loadWorkspaces = loadWorkspaces;
function add(name, directory) {
    // If we're running on a windows server, normalize slashes
    if (typeof window === "undefined") {
        if (process.platform.indexOf("win") === 0) {
            directory = directory.replace(/\\/g, "/");
        }
    }
    if (directory[directory.length - 1] !== "/")
        directory += "/";
    if (exports.workspaces[name] && exports.workspaces[name] !== directory)
        throw new Error("Unable to link pre-existing workspace '$[name}' to '" + directory + "' (currently '" + exports.workspaces[name] + "')");
    exports.workspaces[name] = directory;
}
exports.add = add;
/** Given an explicit workspace, return the contents of the file. */
function get(file, workspace) {
    if (workspace === void 0) { workspace = "eve"; }
    if (!exports.workspaces[workspace]) {
        console.error("Unable to get '" + file + "' from unregistered workspace '" + workspace + "'");
        return;
    }
    return fetchFile(file, workspace);
}
exports.get = get;
/** Using the inferred workspace from the file path, return the contents of the file. */
function find(file) {
    var workspace = getWorkspaceFromPath(file);
    if (!workspace)
        return;
    return get(file, workspace);
}
exports.find = find;
/** Given an explicit workspace, update the contents of the file. */
function set(file, content, workspace) {
    if (workspace === void 0) { workspace = "eve"; }
    if (!exports.workspaces[workspace]) {
        console.error("Unable to set '" + file + "' from unregistered workspace '" + workspace + "'");
        return;
    }
    saveFile(file, content, workspace);
}
exports.set = set;
/** Using the inferred workspace from the file path, update the contents of the file. */
function save(file, content) {
    var workspace = getWorkspaceFromPath(file);
    if (!workspace)
        return;
    return set(file, content, workspace);
}
exports.save = save;
//---------------------------------------------------------
// Utilities
//---------------------------------------------------------
function getWorkspaceFromPath(file) {
    var parts = file.split("/");
    var basename = parts.pop();
    var workspace = parts[1];
    if (!basename || !workspace)
        return;
    if (!exports.workspaces[workspace]) {
        console.error("Unable to get '" + file + "' from unregistered workspace '" + workspace + "'");
    }
    return workspace;
}
exports.getWorkspaceFromPath = getWorkspaceFromPath;
function getRelativePath(file, workspace) {
    var directory = exports.workspaces[workspace];
    if (!directory) {
        console.error("Unable to get relative path for '" + file + "' in unregistered workspace '" + workspace + "'");
        return;
    }
    if (file.indexOf("./") === 0) {
        file = file.slice(2);
    }
    if (file.indexOf(directory) === 0) {
        file = file.slice(directory.length);
    }
    return "/" + workspace + "/" + file;
}
exports.getRelativePath = getRelativePath;
function getAbsolutePath(file, workspace) {
    var directory = exports.workspaces[workspace];
    if (file.indexOf(directory) === 0)
        return file;
    if (file.indexOf("/" + workspace + "/") === 0)
        file = file.slice(workspace.length + 2);
    return directory + file;
}
exports.getAbsolutePath = getAbsolutePath;
//---------------------------------------------------------
// Server/Client Implementations
//---------------------------------------------------------
var saveFile = function (file, content, workspace) {
    var cache = global["_workspaceCache"][workspace];
    cache = global["_workspaceCache"][workspace] = {};
    file = getRelativePath(file, workspace);
    cache[file] = content;
};
// If we're running on the client, we use the global _workspaceCache, created in the build phase or served by the server.
var fetchFile = function (file, workspace) {
    var cache = global["_workspaceCache"][workspace];
    file = getRelativePath(file, workspace);
    return cache && cache[file];
};
var fetchWorkspace = function (workspace) {
    return global["_workspaceCache"][workspace];
};
var fs = require("fs");
// If we're running on the server, we use the actual file-system.
if (fs.readFileSync) {
    var glob_1 = require("glob");
    var path_1 = require("path");
    var mkdirp_1 = require("mkdirp");
    saveFile = function (file, content, workspace) {
        try {
            var filepath = getAbsolutePath(file, workspace);
            var dirname = path_1.dirname(filepath);
            mkdirp_1.sync(dirname);
            fs.writeFileSync(filepath, content);
        }
        catch (err) {
            console.warn("Unable to save file '" + file + "' in '" + workspace + "' containing:\n" + content);
        }
    };
    fetchFile = function (file, workspace) {
        try {
            var filepath = getAbsolutePath(file, workspace);
            return fs.readFileSync(filepath).toString();
        }
        catch (err) {
            console.warn("Unable to find file '" + file + "' in '" + workspace + "'");
        }
    };
    fetchWorkspace = function (workspace) {
        var directory = exports.workspaces[workspace];
        var files = {};
        var patterns = ["/**/*.eve", "/**/*.eve.md"];
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            for (var _a = 0, _b = glob_1.sync(directory + pattern, { ignore: directory + "**/node_modules" + pattern }); _a < _b.length; _a++) {
                var file = _b[_a];
                var rel = path_1.relative(directory, file);
                files["/" + workspace + "/" + rel] = fs.readFileSync(file).toString();
            }
        }
        return files;
    };
}
function pack() {
    var packaged = {};
    for (var workspace in exports.workspaces) {
        packaged[workspace] = fetchWorkspace(workspace);
    }
    return "var _workspaceCache = " + JSON.stringify(packaged, null, 2) + ";\n";
}
exports.pack = pack;
function fetchAll(workspace) {
    return fetchWorkspace(workspace);
}
exports.fetchAll = fetchAll;
// If we're running on the client, load the server's workspaces from the cache it passes us.
if (global["_workspaceCache"]) {
    for (var workspace in global["_workspaceCache"]) {
        add(workspace, workspace);
    }
}
//# sourceMappingURL=eveSource.js.map