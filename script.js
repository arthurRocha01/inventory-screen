/**
 * InventoryManager
 * Gerencia a lógica de interface e comunicação com a API
 */
class InventoryManager {
  constructor() {
    // Estado inicial da aplicação
    this.state = {
      sku: "8839-22-BLK",
      currentStock: 45,
      adjustmentValue: 1,
      isLoading: false,
    };

    // Elementos do DOM
    this.elements = {
      stockDisplay: document.getElementById("stock-display"),
      productTitle: document.getElementById("product-title"),
      scannerInput: document.getElementById("scanner-input"),
      adjustInput: document.getElementById("adjustment-input"),
      btnDecrease: document.getElementById("btn-decrease"),
      btnIncrease: document.getElementById("btn-increase"),
      btnUpdate: document.getElementById("btn-update"),
      historyList: document.getElementById("history-list"),
      toast: document.getElementById("toast-notification"),
    };

    this.init();
  }

  init() {
    this.resetUpdateButton();
    this.bindEvents();
    this.hideToast();
    console.log("Sistema de Inventário Iniciado");
  }

  // --- Simulação de API (Substituir por fetch real) ---
  async apiCall(endpoint, method, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`API [${method}]: ${endpoint}`, data);
        resolve({ success: true, timestamp: new Date() });
      }, 800); // Simula delay de rede de 800ms
    });
  }

  // --- Lógica de Eventos ---
  bindEvents() {
    // Controles de +/-
    this.elements.btnDecrease.addEventListener("click", () =>
      this.updateAdjustment(-1),
    );
    this.elements.btnIncrease.addEventListener("click", () =>
      this.updateAdjustment(1),
    );

    // Input manual de quantidade
    this.elements.adjustInput.addEventListener("change", (e) => {
      let val = parseInt(e.target.value);
      if (val < 1) val = 1;
      this.state.adjustmentValue = val;
      this.elements.adjustInput.value = val;
    });

    // Botão Principal de Atualizar
    this.elements.btnUpdate.addEventListener("click", () =>
      this.handleStockUpdate(),
    );

    // Scanner (Input de busca)
    this.elements.scannerInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.loadProduct(e.target.value);
      }
    });
  }

  // --- Funcionalidades Core ---

  updateAdjustment(amount) {
    let newValue = this.state.adjustmentValue + amount;
    if (newValue < 1) newValue = 1;
    this.state.adjustmentValue = newValue;
    this.elements.adjustInput.value = newValue;
  }

  async handleStockUpdate() {
    if (this.state.isLoading) return;

    // 1. UI Loading State
    this.setLoading(true);

    try {
      // 2. Chamada à API
      // Exemplo real: await fetch('/api/inventory/update', { method: 'POST', body: ... })
      const response = await this.apiCall("/update-stock", "POST", {
        sku: this.state.sku,
        qty: this.state.adjustmentValue,
      });

      if (response.success) {
        // 3. Atualiza Estado Local
        const oldStock = this.state.currentStock;
        this.state.currentStock += this.state.adjustmentValue;

        // 4. Atualiza UI
        this.animateValue(oldStock, this.state.currentStock, 500);
        this.addToHistory(this.state.adjustmentValue, "Manual Update");
        this.showToast();
      }
    } catch (error) {
      console.error("Erro ao atualizar estoque", error);
      alert("Falha na conexão com a API");
    } finally {
      this.setLoading(false);
    }
  }

  async revertTransaction(element, amount) {
    if (!confirm("Deseja reverter esta transação?")) return;

    // Inverte o valor para reverter
    const revertAmount = amount * -1;

    this.setLoading(true);

    // Chama API para reverter
    await this.apiCall("/revert-transaction", "POST", { amount: revertAmount });

    // Atualiza UI
    const oldStock = this.state.currentStock;
    this.state.currentStock += revertAmount;
    this.animateValue(oldStock, this.state.currentStock, 500);

    // Remove item do histórico visualmente
    element.style.opacity = "0.5";
    element.style.pointerEvents = "none";
    element.querySelector("button").remove(); // Remove botão de reverter

    this.setLoading(false);
    this.showToast("Transação revertida com sucesso");
  }

  // --- Manipulação de UI ---

  setLoading(loading) {
    this.state.isLoading = loading;
    const btn = this.elements.btnUpdate;

    if (loading) {
      btn.innerHTML = `<i class="w-4 h-4 animate-spin" data-lucide="loader-2"></i> Updating...`;
      btn.classList.add("cursor-wait", "opacity-80");
    } else {
      this.resetUpdateButton();
    }
    lucide.createIcons(); // Recarrega ícones
  }

  resetUpdateButton() {
    const btn = this.elements.btnUpdate;
    btn.innerHTML = `Update Stock (+${this.state.adjustmentValue})`;
    btn.classList.remove("cursor-wait", "opacity-80", "bg-slate-900/90");
    btn.classList.add("bg-primary", "hover:bg-blue-600");
  }

  // Função visual para contar números subindo
  animateValue(start, end, duration) {
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    const obj = this.elements.stockDisplay;

    const timer = setInterval(
      () => {
        current += increment;
        obj.textContent = current;
        if (current == end) {
          clearInterval(timer);
        }
      },
      stepTime > 20 ? stepTime : 20,
    ); // Mínimo de 20ms
  }

  addToHistory(amount, user) {
    const isPositive = amount > 0;
    const colorClass = isPositive
      ? "text-green-700 bg-green-50 border-green-100"
      : "text-red-700 bg-red-50 border-red-100";
    const sign = isPositive ? "+" : "";

    const itemHTML = `
            <div class="history-item group p-3 rounded-xl bg-white dark:bg-[#1f2937] hover:shadow-md transition-all border border-slate-100 dark:border-slate-700/50 flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-900 dark:text-white">Estoque Atualizado</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] text-slate-500 font-medium">Agora mesmo</span>
                  <span class="text-[10px] text-slate-300">•</span>
                  <span class="text-[10px] text-slate-500">${user}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="px-1.5 py-0.5 rounded-md ${colorClass} text-[10px] font-bold border min-w-[28px] text-center">
                  ${sign}${amount}
                </div>
                <button class="btn-revert size-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center border border-slate-100" title="Reverter">
                  <i class="w-4 h-4" data-lucide="rotate-ccw"></i>
                </button>
              </div>
            </div>
        `;

    this.elements.historyList.insertAdjacentHTML("afterbegin", itemHTML);

    // Adicionar evento ao novo botão de reverter
    const newEntry = this.elements.historyList.firstElementChild;
    const revertBtn = newEntry.querySelector(".btn-revert");
    revertBtn.addEventListener("click", () =>
      this.revertTransaction(newEntry, amount),
    );

    lucide.createIcons();
  }

  showToast(msg = "Database Updated") {
    const toast = this.elements.toast;

    // Remove hidden se existir e garante reset de animação
    toast.classList.remove("hidden");
    toast.classList.remove("animate-out", "fade-out", "slide-out-to-bottom");
    toast.classList.add("animate-in", "slide-in-from-bottom-8", "fade-in");

    if (msg) toast.querySelector("p").innerText = "API Action Success";

    // Auto-hide após 3 segundos
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  hideToast() {
    const toast = this.elements.toast;
    toast.classList.remove("animate-in", "slide-in-from-bottom-8", "fade-in");
    toast.classList.add("animate-out", "fade-out", "slide-out-to-bottom");
    setTimeout(() => toast.classList.add("hidden"), 500);
  }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  window.inventoryApp = new InventoryManager();
});
