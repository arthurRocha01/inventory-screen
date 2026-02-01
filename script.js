/**
 * Configurações Globais
 * Centraliza constantes para facilitar manutenção
 */
const CONFIG = {
  API_BASE_URL: "http://localhost:8080",
  ENDPOINTS: {
    UPDATE_STOCK: "/items",
  },
  ANIMATION: {
    DURATION_MS: 500,
    TOAST_DELAY_MS: 3000,
  },
  SELECTORS: {
    STOCK_DISPLAY: "stock-display",
    PRODUCT_TITLE: "product-title",
    SCANNER_INPUT: "scanner-input",
    QTY_INPUT: "adjustment-input",
    BTN_DECREMENT: "btn-decrease",
    BTN_INCREMENT: "btn-increase",
    BTN_CONFIRM: "btn-update",
    HISTORY_LIST: "history-list",
    TOAST: "toast-notification",
  },
};

/**
 * InventoryManager
 * Responsável pela orquestração entre Interface de Usuário (UI) e Lógica de Negócio
 */
class InventoryManager {
  constructor() {
    // Estado da Aplicação (Single Source of Truth)
    this.state = {
      productSku: "8839-22-BLK",
      currentStockLevel: 45,
      transactionQuantity: 1, // Quantidade a ser adicionada/removida
      isProcessing: false,
    };

    // Cache de Elementos do DOM
    this.ui = this.cacheDomElements();

    this.init();
  }

  /**
   * Mapeia os elementos do DOM baseados na configuração
   */
  cacheDomElements() {
    const els = {};
    for (const [key, id] of Object.entries(CONFIG.SELECTORS)) {
      els[key] = document.getElementById(id);
    }
    return els;
  }

  init() {
    this.renderUpdateButton();
    this.bindUserEvents();
    this.hideToast();
    console.info("Inventory Manager: Ready");
  }

  // --- Camada de Comunicação com API (Service Layer) ---

  /**
   * Wrapper centralizado para chamadas fetch
   */
  async performApiRequest(endpoint, method, payload = null) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;

    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    if (payload) {
      options.body = JSON.stringify(payload);
    }

    // Simulação de Latência (remover em produção)
    await new Promise((r) => setTimeout(r, 600));

    try {
      const response = await fetch(url, options);

      // Tratamento básico de erro HTTP
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // Se a API retornar JSON, faz o parse, senão retorna true
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
      }
      return { success: true };
    } catch (error) {
      console.error("API Communication Error:", error);
      throw error;
    }
  }

  // --- Lógica de Eventos (Controller) ---

  bindUserEvents() {
    // Botões de Incremento/Decremento
    this.ui.BTN_DECREMENT.addEventListener("click", () =>
      this.adjustTransactionQuantity(-1),
    );
    this.ui.BTN_INCREMENT.addEventListener("click", () =>
      this.adjustTransactionQuantity(1),
    );

    // Input Manual de Quantidade
    this.ui.QTY_INPUT.addEventListener("change", (e) => {
      const val = parseInt(e.target.value) || 1;
      this.updateLocalQuantityState(val < 1 ? 1 : val);
    });

    // Ação de Atualizar Estoque (Commit)
    this.ui.BTN_CONFIRM.addEventListener("click", () =>
      this.commitTransaction(),
    );

    // Scanner de Código de Barras
    this.ui.SCANNER_INPUT.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.fetchProductBySku(e.target.value);
      }
    });
  }

  // --- Regras de Negócio (Core Logic) ---

  adjustTransactionQuantity(delta) {
    const newValue = this.state.transactionQuantity + delta;
    this.updateLocalQuantityState(newValue);
  }

  updateLocalQuantityState(value) {
    // Regra: Quantidade mínima é 1
    const validValue = value < 1 ? 1 : value;

    this.state.transactionQuantity = validValue;
    this.ui.QTY_INPUT.value = validValue;
    this.renderUpdateButton(); // Atualiza texto do botão
  }

  /**
   * Executa a atualização do estoque
   */
  async commitTransaction() {
    if (this.state.isProcessing) return;

    this.setLoadingState(true);

    try {
      // 1. Prepara Payload
      const payload = {
        barcode: this.state.productSku,
        quantity: this.state.transactionQuantity, // Backend deve tratar soma/subtração
      };

      // 2. Chama API
      await this.performApiRequest(
        CONFIG.ENDPOINTS.UPDATE_STOCK,
        "PATCH",
        payload,
      );

      // 3. Sucesso: Atualiza Estado Local e UI
      const previousStock = this.state.currentStockLevel;
      this.state.currentStockLevel += this.state.transactionQuantity;

      this.animateStockCounter(previousStock, this.state.currentStockLevel);
      this.addTransactionToHistory(
        this.state.transactionQuantity,
        "Manual Input",
      );
      this.showToast("Estoque atualizado com sucesso");
    } catch (error) {
      this.showToast("Falha ao atualizar estoque", true);
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Reverte uma transação anterior
   */
  async revertTransaction(historyElement, originalAmount) {
    if (!confirm("Confirmar estorno desta movimentação?")) return;

    // Inverte a operação matemática
    const revertAmount = originalAmount * -1;
    this.setLoadingState(true);

    try {
      await this.performApiRequest(CONFIG.ENDPOINTS.UPDATE_STOCK, "PATCH", {
        barcode: this.state.productSku,
        quantity: revertAmount,
      });

      // Atualiza UI
      const previousStock = this.state.currentStockLevel;
      this.state.currentStockLevel += revertAmount;
      this.animateStockCounter(previousStock, this.state.currentStockLevel);

      // Atualiza visual do histórico (Soft Delete visual)
      this.markHistoryItemAsReverted(historyElement);
      this.showToast("Transação estornada");
    } catch (error) {
      this.showToast("Erro ao estornar transação", true);
    } finally {
      this.setLoadingState(false);
    }
  }

  // --- Manipulação de UI (View) ---

  setLoadingState(isLoading) {
    this.state.isProcessing = isLoading;
    const btn = this.ui.BTN_CONFIRM;

    if (isLoading) {
      btn.innerHTML = `<i class="w-4 h-4 animate-spin" data-lucide="loader-2"></i> Processando...`;
      btn.classList.add("cursor-wait", "opacity-80");
      btn.disabled = true;
    } else {
      this.renderUpdateButton();
      btn.disabled = false;
    }

    if (window.lucide) lucide.createIcons();
  }

  renderUpdateButton() {
    const btn = this.ui.BTN_CONFIRM;
    // Remove classes de loading
    btn.classList.remove("cursor-wait", "opacity-80");
    btn.innerHTML = `Confirmar Entrada (+${this.state.transactionQuantity})`;
  }

  animateStockCounter(start, end) {
    const duration = CONFIG.ANIMATION.DURATION_MS;
    const obj = this.ui.STOCK_DISPLAY;

    if (start === end) return;

    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));

    const timer = setInterval(
      () => {
        current += increment;
        obj.textContent = current;
        if (current == end) {
          clearInterval(timer);
        }
      },
      Math.max(stepTime, 20),
    ); // Garante atualização mínima de 20ms
  }

  addTransactionToHistory(amount, userLabel) {
    const historyContainer = this.ui.HISTORY_LIST;
    const htmlString = this.createHistoryItemHTML(amount, userLabel);

    historyContainer.insertAdjacentHTML("afterbegin", htmlString);

    // Bind do evento de reversão no novo elemento
    const newEntry = historyContainer.firstElementChild;
    const revertBtn = newEntry.querySelector(".btn-revert");

    if (revertBtn) {
      revertBtn.addEventListener("click", () =>
        this.revertTransaction(newEntry, amount),
      );
    }

    if (window.lucide) lucide.createIcons();
  }

  markHistoryItemAsReverted(element) {
    element.style.opacity = "0.5";
    element.style.pointerEvents = "none";
    element.classList.add("line-through", "decoration-slate-400");
    const btn = element.querySelector("button");
    if (btn) btn.remove();
  }

  /**
   * Gera o HTML string para um item do histórico
   * Separado para facilitar leitura
   */
  createHistoryItemHTML(amount, user) {
    const isPositive = amount > 0;
    const theme = isPositive
      ? {
          text: "text-green-700",
          bg: "bg-green-50",
          border: "border-green-100",
          sign: "+",
        }
      : {
          text: "text-red-700",
          bg: "bg-red-50",
          border: "border-red-100",
          sign: "",
        };

    return `
      <div class="history-item group p-3 rounded-xl bg-white dark:bg-[#1f2937] hover:shadow-md transition-all border border-slate-100 dark:border-slate-700/50 flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-900 dark:text-white">Ajuste de Estoque</p>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-[10px] text-slate-500 font-medium">Agora</span>
            <span class="text-[10px] text-slate-300">•</span>
            <span class="text-[10px] text-slate-500">${user}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="px-1.5 py-0.5 rounded-md ${theme.text} ${theme.bg} ${theme.border} text-[10px] font-bold border min-w-[28px] text-center">
            ${theme.sign}${amount}
          </div>
          <button class="btn-revert size-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center border border-transparent hover:border-slate-200" title="Estornar Transação">
            <i class="w-4 h-4" data-lucide="rotate-ccw"></i>
          </button>
        </div>
      </div>
    `;
  }

  showToast(message, isError = false) {
    const toast = this.ui.TOAST;
    const textEl = toast.querySelector("p");

    // Reset de classes
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 opacity-100 flex items-center gap-3 ${
      isError
        ? "bg-red-50 border-red-200 text-red-800"
        : "bg-slate-900 text-white border-slate-800"
    }`;

    textEl.innerText = message;
    toast.classList.remove("hidden");

    // Limpa timeout anterior se existir
    if (this._toastTimer) clearTimeout(this._toastTimer);

    // Auto-hide
    this._toastTimer = setTimeout(
      () => this.hideToast(),
      CONFIG.ANIMATION.TOAST_DELAY_MS,
    );
  }

  hideToast() {
    const toast = this.ui.TOAST;
    toast.classList.add("translate-y-full", "opacity-0");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }
}

// Inicialização segura
document.addEventListener("DOMContentLoaded", () => {
  window.inventoryApp = new InventoryManager();
});
