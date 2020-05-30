import * as testUtf8 from "./testUtf8";
import * as testTelnetClient from "./testTelnetClient";
import * as testContactWin from "./testContactWin";

export namespace test {
    testUtf8.test();
    testTelnetClient.test();
    testContactWin.test();
} // namespace test