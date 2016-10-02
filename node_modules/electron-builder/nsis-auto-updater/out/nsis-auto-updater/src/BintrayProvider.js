"use strict";

const bintray_1 = require("../../src/publish/bintray");
const restApiRequest_1 = require("../../src/publish/restApiRequest");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("../../src/util/awaiter");
class BintrayProvider {
    constructor(configuration) {
        this.client = new bintray_1.BintrayClient(configuration.user, configuration.package, configuration.repo);
    }
    getLatestVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.client.getVersion("_latest");
                return {
                    version: data.name
                };
            } catch (e) {
                if (e instanceof restApiRequest_1.HttpError && e.response.statusCode === 404) {
                    throw new Error(`No latest version, please ensure that user, package and repository correctly configured. Or at least one version is published. ${ e.stack || e.message }`);
                }
                throw e;
            }
        });
    }
    getUpdateFile(versionInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const files = yield this.client.getVersionFiles(versionInfo.version);
                const suffix = `${ versionInfo.version }.exe`;
                for (let file of files) {
                    if (file.name.endsWith(suffix) && file.name.indexOf("Setup") !== -1) {
                        return {
                            name: file.name,
                            url: `https://dl.bintray.com/${ this.client.user }/${ this.client.repo }/${ file.name }`
                        };
                    }
                }
                //noinspection ExceptionCaughtLocallyJS
                throw new Error(`Cannot find suitable file for version ${ versionInfo.version } in: ${ JSON.stringify(files, null, 2) }`);
            } catch (e) {
                if (e instanceof restApiRequest_1.HttpError && e.response.statusCode === 404) {
                    throw new Error(`No latest version, please ensure that user, package and repository correctly configured. Or at least one version is published. ${ e.stack || e.message }`);
                }
                throw e;
            }
        });
    }
}
exports.BintrayProvider = BintrayProvider;
//# sourceMappingURL=BintrayProvider.js.map