import { useState, useEffect, useRef } from "react";
import { Scan, Undo2, Loader2, Package } from "lucide-react";
import { Card } from "./components/card";
import { Input } from "./components/input";
import { Button } from "./components/button";
import { Toast } from "./components/toast";

interface HistoryItem {
  id: string;
  sku: string;
  description: string;
  quantityAdjusted: number;
}

export default function App() {
  const [sku, setSku] = useState("");
  const [quantityToAdjust, setQuantityToAdjust] = useState("");
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const skuInputRef = useRef<HTMLInputElement>(null);

  // 1. Busca produto e estoque atual (Debounce de 500ms)
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (sku.trim().length < 3) {
        setProductName(null);
        setCurrentStock(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/items/${sku.trim()}`);
        if (!response.ok) {
          setProductName("Produto não encontrado");
          setCurrentStock(null);
          return;
        }
        const data = await response.json();
        console.log(data);
        setProductName(data.description || data.name);
        setCurrentStock(data.quantity);
      } catch (error) {
        setProductName("Erro ao consultar servidor");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchProductDetails, 500);
    return () => clearTimeout(timer);
  }, [sku]);

  // Função genérica para atualizar o estoque na API
  const updateStockAPI = async (targetSku: string, newTotal: number) => {
    const response = await fetch(`api/items/${targetSku}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newTotal }),
    });
    return response.ok;
  };

  const handleUpdate = async () => {
    const qty = parseInt(quantityToAdjust);

    if (!sku.trim() || isNaN(qty) || qty < 1 || currentStock === null) return;

    setIsLoading(true);
    const newTotal = currentStock + qty;
    const success = await updateStockAPI(sku.trim(), newTotal);

    if (success) {
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          sku: sku.trim(),
          description: productName || "Sem nome",
          quantityAdjusted: qty,
        },
        ...prev,
      ]);

      // Reset para o próximo BIP
      setSku("");
      setQuantityToAdjust("");
      setProductName(null);
      setCurrentStock(null);
      setToast("Entrada registrada!");
      skuInputRef.current?.focus(); // Devolve o foco para o leitor
    } else {
      setToast("Erro ao atualizar estoque");
    }
    setIsLoading(false);
  };

  const handleUndo = async (item: HistoryItem) => {
    setIsLoading(true);
    try {
      // Busca o saldo atual antes de subtrair
      const response = await fetch(`http://localhost:8080/items/${item.sku}`);
      const data = await response.json();

      const revertedTotal = data.quantity - item.quantityAdjusted;
      const success = await updateStockAPI(item.sku, revertedTotal);

      if (success) {
        setHistory((prev) => prev.filter((h) => h.id !== item.id));
        setToast("Operação desfeita!");
      }
    } catch (error) {
      setToast("Falha ao desfazer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-8 bg-stone-50">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8">
        {/* Formulário de Entrada */}
        <div className="w-full max-w-md space-y-6">
          <Card className="p-6 space-y-4 shadow-sm border-slate-200">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Scan size={16} /> SKU / Código de Barras
              </label>
              <div className="relative">
                <Input
                  ref={skuInputRef}
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Bipe o código..."
                  autoFocus
                />
                {isLoading && (
                  <Loader2
                    className="absolute right-3 top-2.5 animate-spin text-slate-400"
                    size={18}
                  />
                )}
              </div>

              {productName && (
                <div
                  className={`mt-4 p-3 rounded-lg border ${productName.includes("não") ? "bg-red-50 border-red-100" : "bg-slate-100 border-slate-200"}`}
                >
                  <p className="text-sm font-bold text-slate-800">
                    {productName}
                  </p>
                  {currentStock !== null && (
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <Package size={14} />
                      <span className="text-xs font-medium">
                        Estoque Atual: {currentStock} un
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">
                Quantidade de Entrada
              </label>
              <Input
                type="number"
                value={quantityToAdjust}
                onChange={(e) => setQuantityToAdjust(e.target.value)}
                placeholder="0"
                className="text-lg font-bold text-emerald-700"
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
              />
            </div>

            <Button
              onClick={handleUpdate}
              disabled={!currentStock || !quantityToAdjust || isLoading}
              className="w-full h-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-700"
            >
              Confirmar Entrada
            </Button>
          </Card>
        </div>

        {/* Histórico da Sessão */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between sticky top-0 bg-stone-50 py-2 z-10 border-b border-stone-200">
            <h2 className="text-xl font-bold text-slate-800">
              Resumo da Sessão
            </h2>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              {history.length} itens processados
            </span>
          </div>

          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 space-y-3">
            {history.length === 0 && (
              <p className="text-center py-10 text-slate-400 italic">
                Nenhum ajuste realizado nesta sessão.
              </p>
            )}
            {history.map((item) => (
              <Card
                key={item.id}
                className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 truncate mr-4">
                  <p className="font-bold text-slate-800 truncate">
                    {item.description}
                  </p>
                  <p className="text-xs text-slate-500 font-mono tracking-tighter">
                    SKU: {item.sku}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-black text-emerald-600">
                    +{item.quantityAdjusted}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => handleUndo(item)}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                    title="Desfazer"
                  >
                    <Undo2 size={20} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </main>
  );
}
