/// <reference path="../../definitions/polyfill.d.ts" />

import * as testUtf8 from "./testUtf8";
import * as testTelnetClient from "./testTelnetClient";

export namespace test {
    testUtf8.test();
    testTelnetClient.test();
} // namespace test