/** Identifies the failed stage while retaining the original error as cause. */
export class AudioLoadError extends Error {
  constructor(stage, message, cause) {
    super(message, { cause });
    this.name = "AudioLoadError";
    this.stage = stage;
  }
}

function checkCancellation(signal) {
  if (signal?.aborted) {
    throw new DOMException("Audio loading was cancelled", "AbortError");
  }
}

/**
 * Build the queue's injected loader. The caller owns audioContext and fetchImpl.
 * No source nodes are created and the supplied context is never closed here.
 */
export function createAudioLoader({ audioContext, fetchImpl = globalThis.fetch } = {}) {
  if (typeof audioContext?.decodeAudioData !== "function") {
    throw new TypeError("audioContext must provide decodeAudioData");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetchImpl must be a function");
  }

  return async function load(url, { signal, onPhase = () => {} } = {}) {
    checkCancellation(signal);
    let bytes;
    try {
      const response = await fetchImpl(url, { signal });
      checkCancellation(signal);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`);
      }
      bytes = await response.arrayBuffer();
      checkCancellation(signal);
    } catch (error) {
      checkCancellation(signal);
      if (error?.name === "AbortError") throw error;
      throw new AudioLoadError("download", `Audio download failed: ${error?.message ?? String(error)}`, error);
    }

    try {
      onPhase("decoding");
      checkCancellation(signal);
      // decodeAudioData has no AbortSignal option; observe its completion.
      const buffer = await audioContext.decodeAudioData(bytes);
      checkCancellation(signal);
      return buffer;
    } catch (error) {
      checkCancellation(signal);
      if (error?.name === "AbortError") throw error;
      throw new AudioLoadError("decode", `Audio decode failed: ${error?.message ?? String(error)}`, error);
    }
  };
}
