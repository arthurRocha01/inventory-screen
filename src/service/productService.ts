export interface ProductInfo {
  id: number;
  name: string;
  price: number;
}

// Idealmente, mova isso para um .env no futuro (ex: import.meta.env.VITE_GDOOR_TOKEN)
const TOKEN = import.meta.env.VITE_GDOOR_TOKEN;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${TOKEN}`,
};

const buildProductPayload = (data: any, newPrice: number) => {
  return {
    name: data.name,
    product_type: data.product_type || "00",
    measure_unit: data.measure_unit || "UNID",
    commission: Number(data.commission) || 0,
    ippt: data.ippt || "T",
    active: Boolean(data.active),
    ghub_sync: Boolean(data.ghub_sync),
    obs: data.obs || null,
    has_grid: Boolean(data.has_grid),
    has_weigth: Boolean(data.has_weigth),
    has_serial_numbers: Boolean(data.has_serial_numbers),
    units: Array.isArray(data.units) ? data.units : [],

    details: data.details.map((detail: any, index: number) => {
      const targetPrice = index === 0 ? newPrice : Number(detail.price);

      return {
        id: detail.id,
        description: detail.description || null,
        reference: detail.reference || null,
        current_quantity: Number(detail.current_quantity) || 0,
        minimum_quantity: Number(detail.minimum_quantity) || 0,
        reserved_quantity: Number(detail.reserved_quantity) || 0,
        price: targetPrice,
        wholesale_price: Number(detail.wholesale_price) || 0,
        wholesale_quantity: Number(detail.wholesale_quantity) || 0,
        validity_days: detail.validity_days || null,
        cost_price: Number(detail.cost_price) || 0,
        average_cost: Number(detail.average_cost) || 0,
        profit_margin: Number(detail.profit_margin) || 0,
        net_weight: Number(detail.net_weight) || 0,
        gross_weight: Number(detail.gross_weight) || 0,
        origin: Number(detail.origin) || 0,
        ncm_code: detail.ncm_code ? Number(detail.ncm_code) : null,
        ex_ncm_code: detail.ex_ncm_code || null,
        cest_code: detail.cest_code || null,
        classification_code: detail.classification_code || null,
        fci_code: detail.fci_code || null,
        cest_ind_escala: detail.cest_ind_escala || null,
        manufacturer_cnpj: detail.manufacturer_cnpj || null,
        barcodes: Array.isArray(detail.barcodes)
          ? detail.barcodes.map((b: any) => ({
              id: b.id,
              master_id: b.master_id,
              product_id: b.product_id,
              barcode: String(b.barcode),
              multiplier: Number(b.multiplier) || 1,
              default: Boolean(b.default),
            }))
          : [],
        tax_rule_relations: [],
        kits: [],
        fuel_origins: [],
        anvisa: detail.anvisa || null,
        serial_numbers: [],
      };
    }),
    use_composition: Boolean(data.use_composition),
    composition: data.composition || null,
  };
};

export const fetchProductBySku = async (sku: string): Promise<ProductInfo> => {
  const searchRes = await fetch(
    `/api/v1/products?page=1&limit=1&search=${sku}`,
    { headers }
  );
  if (!searchRes.ok) throw new Error("Erro na busca");

  const { data: searchData } = await searchRes.json();
  if (!searchData?.length) throw new Error("Produto não encontrado");

  const productId = searchData[0].id;
  const detailRes = await fetch(`/api/v1/products/${productId}`, { headers });
  if (!detailRes.ok) throw new Error("Erro ao buscar detalhes");

  const { data: detailData } = await detailRes.json();
  const mainDetail = detailData.details[0];

  return {
    id: detailData.id,
    name: mainDetail.name || searchData[0].name,
    price: mainDetail.price,
  };
};

export const updateProductPrice = async (
  productId: number,
  newPrice: number
): Promise<boolean> => {
  try {
    const getRes = await fetch(`/api/v1/products/${productId}`, { headers });
    if (!getRes.ok) return false;

    const { data: productData } = await getRes.json();
    const updatedProduct = buildProductPayload(productData, newPrice);

    const putRes = await fetch(`/api/v1/products/${productId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updatedProduct),
    });

    if (!putRes.ok) {
      console.error("Erro na API ao atualizar:", await putRes.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro no processamento da atualização:", error);
    return false;
  }
};
