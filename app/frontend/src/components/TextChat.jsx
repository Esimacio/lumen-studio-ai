import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Download, LoaderCircle, MessageSquare, Play, Send, Square, Trash2, Upload } from "lucide-react";
import {
  chatWithLlm,
  deleteLlmModel,
  downloadLlmModel,
  getDownloadProgress,
  getLlmStatus,
  importLlmModel,
  listLlmModels,
  startLlm,
  stopLlm,
} from "../services/api";

const RECOMMENDED_MODELS = [
  {
    name: "Qwen2.5 Coder 0.5B Instruct Q4_K_M",
    size: "491 MB",
    url: "https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-0.5b-instruct-q4_k_m.gguf",
  },
  {
    name: "SmolLM2 1.7B Instruct Q4_K_M",
    size: "1.1 GB",
    url: "https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF/resolve/main/smollm2-1.7b-instruct-q4_k_m.gguf",
  },
];

function TextChat({ specs, showAlert, showConfirm }) {
  const [models, setModels] = useState([]);
  const [status, setStatus] = useState({ ready: false, running: false, settings: {} });
  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful local AI assistant.");
  const [isBusy, setIsBusy] = useState(false);
  const [download, setDownload] = useState(null);
  const [customUrl, setCustomUrl] = useState("");
  const [importProgress, setImportProgress] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const completedDownloadRef = useRef("");

  const refresh = useCallback(async () => {
    const [nextModels, nextStatus] = await Promise.all([listLlmModels(), getLlmStatus()]);
    setModels(nextModels);
    setStatus(nextStatus);
    const active = nextStatus.settings?.model;
    setSelectedModel((current) => active || current || nextModels[0]?.filename || "");
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
    const timer = setInterval(() => {
      getLlmStatus().then(setStatus).catch(() => {});
      getDownloadProgress().then((state) => {
        if (state.kind === "text" && (state.active || state.error || state.progress === 100)) {
          setDownload(state);
          const completionKey = `${state.filename || ""}:${state.downloadedBytes || 0}`;
          if (!state.active && !state.error && completedDownloadRef.current !== completionKey) {
            completedDownloadRef.current = completionKey;
            refresh().catch(() => {});
          }
        }
      }).catch(() => {});
    }, 1500);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBusy]);

  const loadModel = async () => {
    if (!selectedModel || isBusy) return;
    setIsBusy(true);
    try {
      const result = await startLlm(selectedModel, {
        threads: specs.cpu_cores_physical || 4,
        contextSize: 4096,
        gpuLayers: -1,
      });
      setStatus({ ...status, ...result, ready: true, running: true, settings: result.settings });
    } catch (err) {
      showAlert({ title: "Text Model Load Failed", message: err.message, danger: true });
    } finally {
      setIsBusy(false);
    }
  };

  const unloadModel = async () => {
    setIsBusy(true);
    try {
      await stopLlm();
      setStatus((current) => ({ ...current, ready: false, running: false }));
    } finally {
      setIsBusy(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isBusy || !status.ready) return;
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setIsBusy(true);
    try {
      const requestMessages = [
        ...(systemPrompt.trim() ? [{ role: "system", content: systemPrompt.trim() }] : []),
        ...nextMessages,
      ];
      const content = await chatWithLlm(requestMessages, { temperature: 0.7, maxTokens: 768 });
      setMessages([...nextMessages, { role: "assistant", content }]);
    } catch (err) {
      setMessages([...nextMessages, { role: "assistant", content: `Error: ${err.message}`, error: true }]);
    } finally {
      setIsBusy(false);
    }
  };

  const startDownload = async (url) => {
    if (!url || download?.active) return;
    try {
      const result = await downloadLlmModel(url);
      setDownload({ active: true, filename: result.filename, progress: 0, kind: "text" });
      setCustomUrl("");
    } catch (err) {
      showAlert({ title: "Text Model Download Failed", message: err.message, danger: true });
    }
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".gguf")) {
      showAlert({ title: "Unsupported File", message: "Text models must use the .gguf format.", danger: true });
      return;
    }
    try {
      await importLlmModel(file, (progress) => setImportProgress(progress));
      setImportProgress(null);
      await refresh();
      setSelectedModel(file.name);
    } catch (err) {
      setImportProgress(null);
      showAlert({ title: "Text Model Import Failed", message: err.message, danger: true });
    }
  };

  const removeModel = async (filename) => {
    const confirmed = await showConfirm({
      title: "Delete Text Model?",
      message: `Delete "${filename}" from app/llm-models?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;
    await deleteLlmModel(filename);
    if (selectedModel === filename) setSelectedModel("");
    await refresh();
  };

  return (
    <div className="text-chat-layout">
      <section className="text-chat-main">
        <div className="text-chat-header">
          <div>
            <h2><MessageSquare size={22} /> Text Chat</h2>
            <p>Private chat powered by llama.cpp and local GGUF models.</p>
          </div>
          <span className={`text-engine-badge ${status.ready ? "ready" : ""}`}>
            {status.ready ? `${status.settings?.backendMode || status.backendMode || "llama.cpp"} ready` : status.backendInstalled ? "Backend installed" : "Run setup to install llama.cpp"}
          </span>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <Bot size={42} />
              <h3>Local text generation</h3>
              <p>Choose a GGUF model, load it, and start chatting. Loading text automatically unloads the image engine.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`chat-message ${message.role} ${message.error ? "error" : ""}`}>
              <strong>{message.role === "user" ? "You" : "Local AI"}</strong>
              <div>{message.content}</div>
            </div>
          ))}
          {isBusy && status.ready && <div className="chat-thinking"><LoaderCircle className="progress-spinner" size={16} /> Generating...</div>}
          <div ref={bottomRef} />
        </div>

        <div className="chat-composer">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder={status.ready ? "Message your local model..." : "Load a text model to begin"}
            disabled={!status.ready || isBusy}
          />
          <button className="m3-btn m3-btn-filled" onClick={sendMessage} disabled={!input.trim() || !status.ready || isBusy}>
            <Send size={17} /> Send
          </button>
        </div>
      </section>

      <aside className="text-chat-settings">
        <div className="m3-card">
          <h3 className="m3-card-title">Text Model</h3>
          <select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} disabled={status.running || isBusy}>
            <option value="">Select a GGUF model</option>
            {models.map((model) => <option key={model.filename} value={model.filename}>{model.filename} ({model.size})</option>)}
          </select>
          <div className="text-model-actions">
            {!status.running ? (
              <button className="m3-btn m3-btn-filled" onClick={loadModel} disabled={!selectedModel || isBusy}>
                {isBusy ? <LoaderCircle className="progress-spinner" size={16} /> : <Play size={16} />} Load
              </button>
            ) : (
              <button className="m3-btn m3-btn-error" onClick={unloadModel} disabled={isBusy}>
                <Square size={16} /> Unload
              </button>
            )}
            <button className="m3-btn m3-btn-outlined" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
              <Upload size={16} /> Import
            </button>
            <input ref={fileInputRef} type="file" accept=".gguf" hidden onChange={importFile} />
          </div>
          {importProgress && <p className="text-progress">Importing: {Math.round(importProgress.progress || 0)}%</p>}
          {models.map((model) => (
            <div className="text-local-model" key={model.filename}>
              <span title={model.filename}>{model.filename}</span>
              <button title="Delete model" onClick={() => removeModel(model.filename)} disabled={status.settings?.model === model.filename && status.running}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="m3-card">
          <h3 className="m3-card-title">System Prompt</h3>
          <textarea className="system-prompt" value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} />
        </div>

        <div className="m3-card">
          <h3 className="m3-card-title">Download GGUF</h3>
          {RECOMMENDED_MODELS.map((model) => (
            <button className="text-download-option" key={model.url} onClick={() => startDownload(model.url)} disabled={download?.active}>
              <span>{model.name}</span><small>{model.size}</small><Download size={16} />
            </button>
          ))}
          <div className="text-url-row">
            <input value={customUrl} onChange={(event) => setCustomUrl(event.target.value)} placeholder="Direct Hugging Face .gguf URL" />
            <button className="m3-btn m3-btn-tonal" onClick={() => startDownload(customUrl)} disabled={!customUrl || download?.active}>Download</button>
          </div>
          {download?.active && <p className="text-progress">Downloading {download.filename}: {download.progress < 0 ? "starting" : `${download.progress}%`} {download.speed || ""}</p>}
          {download?.error && !String(download.error).toLowerCase().includes("cancelled") && <p className="text-progress error">{download.error}</p>}
        </div>
      </aside>
    </div>
  );
}

export default TextChat;
