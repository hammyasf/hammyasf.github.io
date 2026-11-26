// In-browser sentence embeddings with transformers.js. Loaded lazily, after first paint;
// the page never waits on it (the guide answers with keyword search until `ready`).
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/+esm'; // jsDelivr rewrites onnxruntime-web's bare imports
const MODEL = 'Xenova/all-MiniLM-L6-v2';

export function createEmbedder({ onStatus = () => {} } = {}) {
  let extractor = null, loading = null;
  const self = {
    ready: false,
    load() {
      loading ??= (async () => {
        onStatus('loading', 0);
        try {
          const { pipeline, env } = await import(LIB);
          env.allowLocalModels = false;
          const seen = new Map();
          extractor = await pipeline('feature-extraction', MODEL, {
            dtype: 'q8',
            progress_callback: (p) => {
              if (p.status !== 'progress' || !p.total) return;
              seen.set(p.file, [p.loaded, p.total]);
              let l = 0, t = 0;
              for (const [a, b] of seen.values()) { l += a; t += b; }
              onStatus('loading', t ? l / t : 0);
            },
          });
          self.ready = true;
          onStatus('ready', 1);
        } catch (e) {
          onStatus('failed', 0, e);
        }
      })();
      return loading;
    },
    async embed(text) {
      if (!extractor) throw new Error('embedder not ready');
      const out = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(out.data);
    },
  };
  return self;
}
