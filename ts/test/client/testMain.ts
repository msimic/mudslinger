import * as testUtf8 from "./testUtf8";
import * as testTelnetClient from "./testTelnetClient";
import * as testContactWin from "./testContactWin";
import * as testJsScript from "./testJsScript";

export namespace test {
    testUtf8.test();
    testTelnetClient.test();
    testContactWin.test();
    testJsScript.test();
} // namespace test