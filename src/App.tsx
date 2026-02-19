// src/App.tsx
import { useState, useEffect, useRef } from "react";
import { Scan, Undo2, Loader2, Package } from "lucide-react";
import { Card } from "./components/card";
import { Input } from "./components/input";
import { Button } from "./components/button";
import { Toast } from "./components/toast";

// Importamos os serviços e as tipagens que extraímos!
import {
  fetchProductBySku,
  updateProductPrice,
  type ProductInfo,
} from "./service/productService";

interface HistoryItem {
  id: string;
  productId: number;
  sku: string;
  description: string;
  priceAdjusted: number;
  oldPrice: number;
}

export default function App() {
  const [sku, setSku] = useState("");
  const [priceToAdjust, setPriceToAdjust] = useState("1");
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const skuInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cleanSku = sku.trim();
    if (cleanSku.length < 3) {
      setProduct(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        // Chamada limpa para o service
        const data = await fetchProductBySku(cleanSku);
        setProduct(data);
      } catch {
        setProduct(null);
        setToast("Produto não encontrado");
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [sku]);

  const handleUpdate = async () => {
    if (!product) return;

    const priceAdjustment = parseFloat(priceToAdjust);
    if (isNaN(priceAdjustment) || priceAdjustment <= 0) return;

    setIsLoading(true);
    // Chamada limpa para o service
    const success = await updateProductPrice(product.id, priceAdjustment);

    if (success) {
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          productId: product.id,
          sku,
          description: product.name,
          priceAdjusted: priceAdjustment,
          oldPrice: product.price,
        },
        ...prev,
      ]);

      setProduct({ ...product, price: priceAdjustment });
      setSku("");
      setPriceToAdjust("1");
      setToast("Preço atualizado com sucesso!");
      skuInputRef.current?.focus();
    } else {
      setToast("Erro ao atualizar o preço.");
    }

    setIsLoading(false);
  };

  const handleUndo = async (item: HistoryItem) => {
    setIsLoading(true);

    // Chamada limpa para o service
    const success = await updateProductPrice(item.productId, item.oldPrice);

    if (success) {
      setHistory((prev) => prev.filter((h) => h.id !== item.id));
      if (product?.id === item.productId) {
        setProduct({ ...product, price: item.oldPrice });
      }
      setToast("Operação desfeita com sucesso.");
    } else {
      setToast("Falha ao desfazer operação.");
    }

    setIsLoading(false);
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

              {product?.name && (
                <div
                  className={`mt-4 p-3 rounded-lg border ${
                    product.name.toLowerCase().includes("não")
                      ? "bg-red-50 border-red-100"
                      : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <p className="text-sm font-bold text-slate-800">
                    {product.name}
                  </p>
                  {product.price !== null && (
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <Package size={14} />
                      <span className="text-xs font-medium">
                        Preço Atual: R$ {product.price}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">
                Preço a Ajustar
              </label>
              <Input
                type="number"
                value={priceToAdjust}
                onChange={(e) => setPriceToAdjust(e.target.value)}
                placeholder="0"
                className="text-lg font-bold text-emerald-700"
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
              />
            </div>

            {product && (
              <Button
                onClick={handleUpdate}
                disabled={!product.price || !priceToAdjust || isLoading}
                className="w-full h-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-700"
              >
                Confirmar Entrada
              </Button>
            )}
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
                    +{item.priceAdjusted}
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
