(function () {
  const existing = document.getElementById("afruheritage-ai-widget");
  if (existing) return;

  const script = document.currentScript;
  const apiBase = script?.dataset?.apiBase || window.location.origin;
  const host = window.location.hostname;

  async function fetchConfig() {
    const res = await fetch(`${apiBase}/api/v1/ai/widget/config?host=${encodeURIComponent(host)}`);
    if (!res.ok) throw new Error("Failed to load widget config");
    return res.json();
  }

  function createWidgetShell(config) {
    const root = document.createElement("div");
    root.id = "afruheritage-ai-widget";
    root.innerHTML = `
      <style>
        #afruheritage-ai-widget * { box-sizing: border-box; font-family: Arial, sans-serif; }
        #afruheritage-ai-toggle {
          position: fixed;
          right: 20px;
          bottom: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          background: ${config.primary_color || "#0ea5e9"};
          color: white;
          font-size: 24px;
          z-index: 999999;
          box-shadow: 0 8px 20px rgba(0,0,0,.2);
        }
        #afruheritage-ai-panel {
          position: fixed;
          right: 20px;
          bottom: 90px;
          width: 360px;
          max-width: calc(100vw - 40px);
          height: 520px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0,0,0,.2);
          display: none;
          flex-direction: column;
          z-index: 999999;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        #afruheritage-ai-header {
          background: ${config.primary_color || "#0ea5e9"};
          color: white;
          padding: 14px 16px;
          font-weight: bold;
        }
        #afruheritage-ai-messages {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          background: #f8fafc;
        }
        .afruheritage-ai-msg {
          margin-bottom: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          max-width: 90%;
          white-space: pre-wrap;
        }
        .afruheritage-ai-bot {
          background: white;
          border: 1px solid #e5e7eb;
        }
        .afruheritage-ai-user {
          background: ${config.primary_color || "#0ea5e9"};
          color: white;
          margin-left: auto;
        }
        #afruheritage-ai-input-wrap {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }
        #afruheritage-ai-input {
          flex: 1;
          resize: none;
          min-height: 44px;
          max-height: 120px;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
        }
        #afruheritage-ai-send {
          background: ${config.primary_color || "#0ea5e9"};
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0 16px;
          cursor: pointer;
        }
      </style>
      <button id="afruheritage-ai-toggle">💬</button>
      <div id="afruheritage-ai-panel">
        <div id="afruheritage-ai-header">Assistant</div>
        <div id="afruheritage-ai-messages"></div>
        <div id="afruheritage-ai-input-wrap">
          <textarea id="afruheritage-ai-input" placeholder="Ask a question..."></textarea>
          <button id="afruheritage-ai-send">Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    const toggle = document.getElementById("afruheritage-ai-toggle");
    const panel = document.getElementById("afruheritage-ai-panel");
    const messages = document.getElementById("afruheritage-ai-messages");
    const input = document.getElementById("afruheritage-ai-input");
    const send = document.getElementById("afruheritage-ai-send");

    function addMessage(text, cls) {
      const div = document.createElement("div");
      div.className = `afruheritage-ai-msg ${cls}`;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    async function sendMessage() {
      const value = input.value.trim();
      if (!value) return;

      addMessage(value, "afruheritage-ai-user");
      input.value = "";

      try {
        const res = await fetch(`${apiBase}${config.api_endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: value,
            tenant_scope: config.scope,
            tenant_slug: config.tenant_slug,
            model: config.model,
            page_url: window.location.href
          })
        });

        const data = await res.json();
        addMessage(data.answer || "No response returned.", "afruheritage-ai-bot");
      } catch (err) {
        addMessage("The assistant is temporarily unavailable.", "afruheritage-ai-bot");
      }
    }

    toggle.addEventListener("click", () => {
      panel.style.display = panel.style.display === "flex" ? "none" : "flex";
      if (panel.style.display === "flex" && messages.children.length === 0) {
        addMessage(config.welcome_message || "How can I help you today?", "afruheritage-ai-bot");
      }
    });

    send.addEventListener("click", sendMessage);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  fetchConfig()
    .then((config) => {
      if (!config.enabled) return;
      createWidgetShell(config);
    })
    .catch(() => {});
})();
