import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import {
  applyModelStudioConfig,
  applyModelStudioProviderConfig,
} from "./onboard-auth.config-core.js";
import {
  MODELSTUDIO_DEFAULT_MODEL_REF,
  MODELSTUDIO_GLOBAL_BASE_URL,
} from "./onboard-auth.models.js";

const emptyCfg: OpenClawConfig = {};

describe("Model Studio provider config", () => {
  it("registers Model Studio with the expected baseUrl and default transport", () => {
    const result = applyModelStudioProviderConfig(emptyCfg);
    const provider = result.models?.providers?.modelstudio;

    expect(provider?.baseUrl).toBe(MODELSTUDIO_GLOBAL_BASE_URL);
    expect(provider?.api).toBe("openai-completions");
  });

  it("marks Qwen Responses-capable models with the responses transport", () => {
    const result = applyModelStudioProviderConfig(emptyCfg);
    const models = result.models?.providers?.modelstudio?.models ?? [];
    const defaultQwen = models.find((model) => model.id === "qwen3.5-plus");
    const coderQwen = models.find((model) => model.id === "qwen3-coder-plus");

    expect(defaultQwen?.api).toBe("openai-responses");
    expect(coderQwen?.api).toBe("openai-responses");
  });

  it("does not hardcode model-native tools into agent defaults", () => {
    const result = applyModelStudioProviderConfig(emptyCfg);
    const defaultQwen = result.agents?.defaults?.models?.["modelstudio/qwen3.5-plus"];
    const coderQwen = result.agents?.defaults?.models?.["modelstudio/qwen3-coder-plus"];

    expect(defaultQwen?.params).toBeUndefined();
    expect(coderQwen?.params).toBeUndefined();
  });

  it("sets the default Qwen alias without inventing tool defaults", () => {
    const result = applyModelStudioProviderConfig(emptyCfg);
    const defaultQwen = result.agents?.defaults?.models?.[MODELSTUDIO_DEFAULT_MODEL_REF];

    expect(defaultQwen?.alias).toBe("Qwen");
    expect(defaultQwen?.params).toBeUndefined();
  });

  it("sets Model Studio as the primary model when requested", () => {
    const result = applyModelStudioConfig(emptyCfg);
    const defaultModel = result.agents?.defaults?.model;

    expect(
      defaultModel && typeof defaultModel === "object" ? defaultModel.primary : undefined,
    ).toBe(MODELSTUDIO_DEFAULT_MODEL_REF);
  });
});
