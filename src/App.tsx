import { useState } from "react";
import { Scan, Undo2 } from "lucide-react";
import { Card } from "./components/card";
import { Input } from "./components/input";
import { Button } from "./components/button";
import { Toast } from "./components/toast";

interface HistoryItem {
  id: string;
  code: string;
  productName: string;
  quantity: number;
  timestamp: Date;
}

// Banco de dados simulado de produtos
const productDatabase: Record<string, string> = {
  "7891234567890": "Essência Lavanda Premium 50ml",
  "7891234567891": "Óleo Essencial Bergamota 30ml",
  "7891234567892": "Vela Aromática Sândalo Luxo",
  "7891234567893": "Difusor Ambiente Vanilla 100ml",
  "7891234567894": "Sabonete Artesanal Rosa Mosqueta",
};

function App() {
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Simula busca de produto
  const currentProduct = code.trim()
    ? productDatabase[code] || `Produto ${code.slice(0, 8)}...`
    : null;

  const handleUpdate = () => {
    const qty = parseInt(quantity) || 0;
    if (!code.trim() || qty < 1) return;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      code: code.trim(),
      productName: currentProduct || "Produto Desconhecido",
      quantity: qty,
      timestamp: new Date(),
    };

    setHistory([newItem, ...history]);
    setCode("");
    setQuantity("");
  };

  const handleReset = (id: string) => {
    setHistory(history.filter((item) => item.id !== id));
    setToast("Alteração desfeita");
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite campo vazio ou apenas números positivos
    if (value === "" || /^[1-9]\d*$/.test(value)) {
      setQuantity(value);
    }
  };

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-8 bg-stone-50">
      <div className="w-full max-w-6xl flex gap-6">
        {/* Seção de Input (Esquerda) */}
        <div className="w-full max-w-md space-y-6">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Scan size={16} className="text-slate-400" />
                Código de Barras/SKU
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Digite o código..."
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
              />

              {/* Display do produto simulado */}
              {currentProduct && (
                <div className="pt-2 pb-1 px-1">
                  <p className="text-sm font-medium text-slate-800">
                    {currentProduct}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">
                Quantidade
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={handleQuantityChange}
                placeholder="Digite a quantidade..."
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
              />
            </div>

            <Button
              onClick={handleUpdate}
              disabled={!code.trim() || !quantity || parseInt(quantity) < 1}
              className="w-full font-sans font-medium"
            >
              Atualizar Estoque
            </Button>
          </Card>
        </div>

        {/* Seção de Histórico (Direita com scroll próprio) */}
        <div className="flex-1 min-w-0 space-y-4">
          <h2 className="text-2xl font-serif font-semibold text-slate-800 sticky top-0 bg-stone-50 py-2 z-10">
            Histórico de Sessão
          </h2>

          <div className="h-[calc(100vh-12rem)] overflow-y-auto pr-2 space-y-3">
            {history.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-400 text-sm">
                  Nenhuma alteração realizada ainda
                </p>
              </Card>
            ) : (
              <>
                {history.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.code}
                        </p>
                      </div>

                      <div className="text-center px-3">
                        <span className="text-sm font-semibold text-slate-700">
                          +{item.quantity} un
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        onClick={() => handleReset(item.id)}
                        className="shrink-0"
                      >
                        <Undo2 size={16} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </main>
  );
}

export default App;
