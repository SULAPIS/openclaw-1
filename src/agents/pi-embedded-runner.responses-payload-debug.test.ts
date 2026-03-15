import type { StreamFn } from "@mariozechner/pi-agent-core";
import type { Context, Model } from "@mariozechner/pi-ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rawStreamMocks = vi.hoisted(() => ({
  appendRawStream: vi.fn<(payload: Record<string, unknown>) => void>(),
}));

vi.mock("./pi-embedded-subscribe.raw-stream.js", () => ({
  appendRawStream: rawStreamMocks.appendRawStream,
}));

describe("Responses payload raw stream debug", () => {
  beforeEach(() => {
    rawStreamMocks.appendRawStream.mockReset();
  });

  it("records the final Responses payload after extra param wrappers run", async () => {
    const { applyExtraParamsToAgent } = await import("./pi-embedded-runner/extra-params.js");

    const payload: Record<string, unknown> = {
      tools: [{ type: "function", name: "read", description: "Read files", parameters: {} }],
    };
    const baseStreamFn: StreamFn = (model, _context, options) => {
      options?.onPayload?.(payload, model);
      return {} as ReturnType<StreamFn>;
    };
    const agent = { streamFn: baseStreamFn };

    applyExtraParamsToAgent(
      agent,
      {
        agents: {
          defaults: {
            models: {
              "custom-qwen/qwen3-coder-plus": {
                params: {
                  parallelToolCalls: true,
                  tools: [
                    { type: "web_search" },
                    { type: "web_extractor" },
                    { type: "code_interpreter" },
                  ],
                },
              },
            },
          },
        },
      },
      "custom-qwen",
      "qwen3-coder-plus",
    );

    const context: Context = { messages: [] };
    void agent.streamFn?.(
      {
        api: "openai-responses",
        provider: "custom-qwen",
        id: "qwen3-coder-plus",
        baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      } as unknown as Model<"openai-responses">,
      context,
      {},
    );

    expect(rawStreamMocks.appendRawStream).toHaveBeenCalledTimes(1);
    expect(rawStreamMocks.appendRawStream).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "responses_payload",
        provider: "custom-qwen",
        model: "qwen3-coder-plus",
        api: "openai-responses",
        payload: {
          parallel_tool_calls: true,
          tools: [
            { type: "function", name: "read", description: "Read files", parameters: {} },
            { type: "web_search" },
            { type: "web_extractor" },
            { type: "code_interpreter" },
          ],
        },
      }),
    );
  });

  it("does not record non-Responses payloads", async () => {
    const { applyExtraParamsToAgent } = await import("./pi-embedded-runner/extra-params.js");

    const baseStreamFn: StreamFn = (model, _context, options) => {
      options?.onPayload?.({}, model);
      return {} as ReturnType<StreamFn>;
    };
    const agent = { streamFn: baseStreamFn };

    applyExtraParamsToAgent(
      agent,
      {
        agents: {
          defaults: {
            models: {
              "custom-qwen/qwen3-coder-plus": {
                params: {
                  tools: [{ type: "web_search" }],
                },
              },
            },
          },
        },
      },
      "custom-qwen",
      "qwen3-coder-plus",
    );

    const context: Context = { messages: [] };
    void agent.streamFn?.(
      {
        api: "openai-completions",
        provider: "custom-qwen",
        id: "qwen3-coder-plus",
      } as Model<"openai-completions">,
      context,
      {},
    );

    expect(rawStreamMocks.appendRawStream).not.toHaveBeenCalled();
  });
});
