import { beforeEach, describe, expect, it } from "vitest";
import {
  clearHardwareBackHandlersForTest,
  dispatchHardwareBack,
  registerHardwareBackHandler,
} from "./hardwareBackStack";

describe("hardwareBackStack", () => {
  beforeEach(() => {
    clearHardwareBackHandlersForTest();
  });

  it("마지막 등록 핸들러가 먼저 호출되고 true면 중단한다", () => {
    const log: string[] = [];
    registerHardwareBackHandler(() => {
      log.push("older");
      return false;
    });
    registerHardwareBackHandler(() => {
      log.push("newer");
      return true;
    });
    expect(dispatchHardwareBack()).toBe(true);
    expect(log).toEqual(["newer"]);
  });

  it("모두 false면 소비하지 않는다", () => {
    registerHardwareBackHandler(() => false);
    expect(dispatchHardwareBack()).toBe(false);
  });

  it("해제한 핸들러는 호출되지 않는다", () => {
    const log: string[] = [];
    const un = registerHardwareBackHandler(() => {
      log.push("x");
      return true;
    });
    un();
    expect(dispatchHardwareBack()).toBe(false);
    expect(log).toEqual([]);
  });
});
