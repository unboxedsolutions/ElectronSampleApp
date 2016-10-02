"use strict";

const events_1 = require("events");
const child_process_1 = require("child_process");
const path = require("path");
const os_1 = require("os");
const semver = require("semver");
const httpRequest_1 = require("../../src/util/httpRequest");
const BintrayProvider_1 = require("./BintrayProvider");
const bluebird_1 = require("bluebird");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("../../src/util/awaiter");
class NsisUpdater extends events_1.EventEmitter {
    constructor(updateUrl) {
        super();
        this.updateUrl = updateUrl;
        this.updateAvailable = false;
        this.quitAndInstallCalled = false;
        this.app = global.__test_app || require("electron").app;
    }
    getFeedURL() {
        return this.updateUrl;
    }
    setFeedURL(value) {
        this.updateUrl = value.toString();
        this.client = new BintrayProvider_1.BintrayProvider(value);
    }
    checkForUpdates() {
        if (this.updateUrl == null) {
            const message = "Update URL is not set";
            this.emitError(message);
            return bluebird_1.Promise.reject(new Error(message));
        }
        this.emit("checking-for-update");
        return this.doCheckForUpdates().catch(error => this.emitError(error));
    }
    doCheckForUpdates() {
        return __awaiter(this, void 0, void 0, function* () {
            const versionInfo = yield this.client.getLatestVersion();
            const latestVersion = semver.valid(versionInfo.version);
            if (latestVersion == null) {
                throw new Error(`Latest version (from update server) is not valid semver version: "${ latestVersion }`);
            }
            const currentVersion = semver.valid(this.app.getVersion());
            if (currentVersion == null) {
                throw new Error(`App version is not valid semver version: "${ currentVersion }`);
            }
            if (semver.gte(currentVersion, latestVersion)) {
                this.updateAvailable = false;
                this.emit("update-not-available");
                return {
                    versionInfo: versionInfo
                };
            }
            const fileInfo = yield this.client.getUpdateFile(versionInfo);
            this.updateAvailable = true;
            this.emit("update-available");
            const mkdtemp = bluebird_1.Promise.promisify(require("fs").mkdtemp);
            return {
                versionInfo: versionInfo,
                fileInfo: fileInfo,
                downloadPromise: mkdtemp(`${ path.join(os_1.tmpdir(), "up") }-`).then(it => {
                    this.setupPath = path.join(it, fileInfo.name);
                    return httpRequest_1.download(fileInfo.url, this.setupPath);
                })
            };
        });
    }
    quitAndInstall() {
        const setupPath = this.setupPath;
        if (!this.updateAvailable || setupPath == null) {
            this.emitError("No update available, can't quit and install");
            return;
        }
        if (this.quitAndInstallCalled) {
            return;
        }
        // prevent calling several times
        this.quitAndInstallCalled = true;
        child_process_1.spawn(setupPath, ["/S"], {
            detached: true,
            stdio: "ignore"
        }).unref();
        this.app.quit();
    }
    // emit both error object and message, this is to keep compatibility with old APIs
    emitError(message) {
        return this.emit("error", new Error(message), message);
    }
}
exports.NsisUpdater = NsisUpdater;
//# sourceMappingURL=nsis-updater.js.map