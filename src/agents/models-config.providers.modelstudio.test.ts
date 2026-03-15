import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { withEnvAsync } from "../test-utils/env.js";
import { resolveImplicitProvidersForTest } from "./models-config.e2e-harness.js";
import { buildModelStudioProvider } from "./models-config.providers.js";

const modelStudioApiKeyEnv = ["MODELSTUDIO_API", "KEY"].join("_");

describe("Model Studio implicit provider", () => {
  it("should include modelstudio when MODELSTUDIO_API_KEY is configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const modelStudioApiKey = "test-key"; // pragma: allowlist secret
    await withEnvAsync({ [modelStudioApiKeyEnv]: modelStudioApiKey }, async () => {
      const providers = await resolveImplicitProvidersForTest({ agentDir });
      expect(providers?.modelstudio).toBeDefined();
      expect(providers?.modelstudio?.apiKey).toBe("MODELSTUDIO_API_KEY");
      expect(providers?.modelstudio?.baseUrl).toBe("https://coding-intl.dashscope.aliyuncs.com/v1");
    });
  });

  it("should build the static Model Studio provider catalog", () => {
    const provider = buildModelStudioProvider();
    const modelIds = provider.models.map((model) => model.id);
    const defaultQwen = provider.models.find((model) => model.id === "qwen3.5-plus");
    const coderQwen = provider.models.find((model) => model.id === "qwen3-coder-plus");
    expect(provider.api).toBe("openai-completions");
    expect(provider.baseUrl).toBe("https://coding-intl.dashscope.aliyuncs.com/v1");
    expect(defaultQwen?.api).toBe("openai-responses");
    expect(coderQwen?.api).toBe("openai-responses");
    expect(modelIds).toContain("qwen3.5-plus");
    expect(modelIds).toContain("qwen3-coder-plus");
    expect(modelIds).toContain("kimi-k2.5");
  });
});
