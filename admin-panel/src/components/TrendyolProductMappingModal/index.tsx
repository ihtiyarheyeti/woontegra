import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

type Cat = { id: number; name: string; parentId: number; leaf: boolean };
type AttrVal = { id: number; name: string };
type Attr = {
  id: number;
  name: string;
  required: boolean;
  allowCustom: boolean;
  variant: boolean;
  values: AttrVal[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  storeId: number | string;
  onSaved?: (payload: {
    categoryId: number | null;
    attributes: { attributeId: number; attributeValueId: number | null }[];
  }) => void;
};



export default function TrendyolProductMappingModal({
  isOpen,
  onClose,
  product,
  storeId,
  onSaved,
}: Props) {
  const [rootCats, setRootCats] = useState<Cat[]>([]);
  const [lvl2Cats, setLvl2Cats] = useState<Cat[]>([]);
  const [lvl3Cats, setLvl3Cats] = useState<Cat[]>([]);
  const [selLvl1, setSelLvl1] = useState<number | null>(null);
  const [selLvl2, setSelLvl2] = useState<number | null>(null);
  const [selLvl3, setSelLvl3] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [attrLoading, setAttrLoading] = useState(false);
  const [attrs, setAttrs] = useState<Attr[]>([]);
  const [attrMap, setAttrMap] = useState<Record<number, number | null>>({});
  const [error, setError] = useState<string>('');

  const selectedCategoryId = useMemo<number | null>(() => {
    if (selLvl3) return selLvl3;
    if (selLvl2) return selLvl2;
    if (selLvl1) return selLvl1;
    return null;
  }, [selLvl1, selLvl2, selLvl3]);

  const selectedCategoryLeaf = useMemo<boolean>(() => {
    const findIn = (arr: Cat[], id?: number|null) => arr.find(c => c.id === id);
    const c3 = selLvl3 ? findIn(lvl3Cats, selLvl3) : null;
    const c2 = selLvl2 ? findIn(lvl2Cats, selLvl2) : null;
    const c1 = selLvl1 ? findIn(rootCats, selLvl1) : null;
    return Boolean((c3 && c3.leaf) || (!c3 && c2 && c2.leaf) || (!c3 && !c2 && c1 && c1.leaf));
  }, [selLvl1, selLvl2, selLvl3, rootCats, lvl2Cats, lvl3Cats]);

  // Kategori seçilince attributes'ları getir (yalnızca leaf için)
  useEffect(() => {
    if (!selectedCategoryId) {
      setAttrs([]);
      setAttrMap({});
      return;
    }
    // Leaf değilse attribute çağırma, uyarı göster
    if (!selectedCategoryLeaf) {
      setAttrs([]);
      setAttrMap({});
      setError('Seçilen kategori alt kırılım istiyor. Lütfen en alt (leaf) kategoriyi seçin veya "Otomatik leaf bul" deyin.');
      return;
    }
    (async () => {
      try {
        setAttrLoading(true);
        const res = await api.get('/api/trendyol/category-attributes', {
          params: { storeId, categoryId: selectedCategoryId },
        });
        const items: Attr[] = res.data?.attributes || [];
        setAttrs(items);
        setAttrMap({});
        setError('');
      } catch (e: any) {
        const apiErr = e?.response?.data;
        const msg = apiErr?.error || e?.message || 'Özellikler yüklenemedi';
        const det = Array.isArray(apiErr?.details) ? `\nDetay: ${apiErr.details.join(' | ')}` : '';
        setError(`${msg}${det}`);
      } finally {
        setAttrLoading(false);
      }
    })();
  }, [selectedCategoryId, selectedCategoryLeaf, storeId]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        setLoading(true);
        setError('');
        // 1) Önce cacheOnly ile dene (upstream'e gitmeden)
        try {
          const res = await api.get('/api/trendyol/categories/children', {
            params: { storeId, parentId: 0, cacheOnly: true },
          });
          setRootCats(res.data?.categories || []);
        } catch (_ignore) {
          // 2) Fallback: flat list al, local filtre ile kökleri çıkar
          const flatRes = await api.get('/api/trendyol/categories', {
            params: { storeId, format: 'flat', cacheOnly: false },
          });
          const flat: Cat[] = flatRes.data?.categories || [];
          const roots = flat.filter(c => Number(c.parentId || 0) === 0);
          setRootCats(roots);
        }
      } catch (e: any) {
        setError(e?.message || 'Kategoriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, storeId]);

  useEffect(() => {
    if (!selLvl1) {
      setLvl2Cats([]);
      setSelLvl2(null);
      setLvl3Cats([]);
      setSelLvl3(null);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        // children -> cacheOnly dene, olmazsa flat'ten lokal filtrele
        try {
          const res = await api.get('/api/trendyol/categories/children', {
            params: { storeId, parentId: selLvl1, cacheOnly: true },
          });
          setLvl2Cats(res.data?.categories || []);
        } catch (_ignore) {
          const flatRes = await api.get('/api/trendyol/categories', { params: { storeId, format: 'flat', cacheOnly: false }});
          const flat: Cat[] = flatRes.data?.categories || [];
          setLvl2Cats(flat.filter(c => Number(c.parentId || 0) === Number(selLvl1)));
        }
        setSelLvl2(null);
        setLvl3Cats([]);
        setSelLvl3(null);
      } catch (e: any) {
        setError(e?.message || 'Alt kategoriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    })();
  }, [selLvl1, storeId]);

  useEffect(() => {
    if (!selLvl2) {
      setLvl3Cats([]);
      setSelLvl3(null);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        try {
          const res = await api.get('/api/trendyol/categories/children', {
            params: { storeId, parentId: selLvl2, cacheOnly: true },
          });
          setLvl3Cats(res.data?.categories || []);
        } catch (_ignore) {
          const flatRes = await api.get('/api/trendyol/categories', { params: { storeId, format: 'flat', cacheOnly: false }});
          const flat: Cat[] = flatRes.data?.categories || [];
          setLvl3Cats(flat.filter(c => Number(c.parentId || 0) === Number(selLvl2)));
        }
        setSelLvl3(null);
      } catch (e: any) {
        setError(e?.message || 'Alt kategoriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    })();
  }, [selLvl2, storeId]);

  const canSave = useMemo(() => {
    if (!selectedCategoryId) return false;
    const required = attrs.filter((a) => a.required);
    for (const a of required) if (!attrMap[a.id]) return false;
    return true;
  }, [selectedCategoryId, attrs, attrMap]);

  const handleSave = () => {
    if (!selectedCategoryId) {
      setError('Lütfen bir kategori seçin');
      return;
    }
    const payload = {
      categoryId: selectedCategoryId,
      attributes: attrs.map((attr) => ({
        attributeId: attr.id,
        attributeValueId: attrMap[attr.id],
      })),
    };
    onSaved?.(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">
            Trendyol Ürün Eşleştirme – {product?.name || 'Ürün'}
          </h2>
          <button onClick={onClose} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">
            Kapat
          </button>
        </div>
        {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-red-700 text-sm">{error}</div>}
        {/* Kategori Seçimi */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Kategori Seçimi</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ana Kategori */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ana Kategori
              </label>
              <select
                value={selLvl1 || ''}
                onChange={(e) => setSelLvl1(Number(e.target.value) || null)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={loading}
              >
                <option value="">Seçiniz</option>
                {rootCats.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}{cat.leaf ? ' (leaf)' : ''}
                  </option>
                ))}
              </select>
              {selLvl1 && !selectedCategoryLeaf && !selLvl2 && (
                <p className="text-xs text-amber-700 mt-1">Bu kategori alt kırılım gerektirir.</p>
              )}
            </div>

            {/* Alt Kategori */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alt Kategori
              </label>
              <select
                value={selLvl2 || ''}
                onChange={(e) => setSelLvl2(Number(e.target.value) || null)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={!selLvl1 || loading}
              >
                <option value="">Seçiniz</option>
                {lvl2Cats.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}{cat.leaf ? ' (leaf)' : ''}
                  </option>
                ))}
              </select>
              {selLvl2 && !selectedCategoryLeaf && !selLvl3 && (
                <p className="text-xs text-amber-700 mt-1">Bu kategori alt kırılım gerektirir.</p>
              )}
            </div>

            {/* Alt Alt Kategori */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alt Alt Kategori
              </label>
              <select
                value={selLvl3 || ''}
                onChange={(e) => setSelLvl3(Number(e.target.value) || null)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={!selLvl2 || loading}
              >
                <option value="">Seçiniz</option>
                {lvl3Cats.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}{cat.leaf ? ' (leaf)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Yardımcı aksiyonlar */}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  setLoading(true);
                  setError('');
                  const res = await api.get('/api/trendyol/categories/ensure-leaf', {
                    params: { storeId, categoryId: selectedCategoryId || selLvl2 || selLvl1 },
                  });
                  const used = res.data?.usedCategoryId;
                  if (used) {
                    // path'i çek ve select'leri doldur
                    const pathRes = await api.get('/api/trendyol/categories/path', { params: { storeId, categoryId: used }});
                    const p: Cat[] = pathRes.data?.path || [];
                    // path 1..n → Select'leri doldur (ilk 3 seviye)
                    setSelLvl1(p[0]?.id || null);
                    // Lvl2/Lvl3 için children'ı çek
                    if (p[1]) {
                      const c2 = await api.get('/api/trendyol/categories/children', { params: { storeId, parentId: p[0].id }});
                      setLvl2Cats(c2.data?.categories || []);
                      setSelLvl2(p[1].id || null);
                    }
                    if (p[2]) {
                      const c3 = await api.get('/api/trendyol/categories/children', { params: { storeId, parentId: p[1].id }});
                      setLvl3Cats(c3.data?.categories || []);
                      setSelLvl3(p[2].id || null);
                    }
                  } else {
                    setError('Bu kategorinin altında leaf bulunamadı.');
                  }
                } catch (e:any) {
                  setError(e?.response?.data?.error || e?.message || 'Leaf bulma hatası');
                } finally {
                  setLoading(false);
                }
              }}
              className="px-3 py-2 border rounded text-sm"
              disabled={!selectedCategoryId || loading}
            >
              Otomatik leaf bul
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  setLoading(true);
                  setError('');
                  const res = await api.get('/api/trendyol/category-attributes/scan', {
                    params: { storeId, parentId: selLvl3 || selLvl2 || selLvl1 || 0, limit: 3 },
                  });
                  const ex = res.data?.examples?.[0];
                  if (!ex) {
                    setError('Bu dalda attribute\'lu leaf örneği bulunamadı. Farklı alt dal deneyin.');
                    return;
                  }
                  // path ile select'leri doldur
                  const p: {id:number; name:string}[] = ex.path || [];
                  setSelLvl1(p[0]?.id || null);
                  if (p[1]) {
                    const c2 = await api.get('/api/trendyol/categories/children', { params: { storeId, parentId: p[0].id }});
                    setLvl2Cats(c2.data?.categories || []);
                    setSelLvl2(p[1].id || null);
                  }
                  if (p[2]) {
                    const c3 = await api.get('/api/trendyol/categories/children', { params: { storeId, parentId: p[1].id }});
                    setLvl3Cats(c3.data?.categories || []);
                    setSelLvl3(p[2].id || null);
                  }
                } catch (e:any) {
                  setError(e?.response?.data?.error || e?.message || 'Örnek kategori tarama hatası');
                } finally {
                  setLoading(false);
                }
              }}
              className="px-3 py-2 border rounded text-sm"
              disabled={loading}
            >
              Örnek kategori bul
            </button>
          </div>
        </div>
        {selectedCategoryId && (<div className="mb-4 rounded border p-3 text-sm">Seçilen Kategori ID: <span className="font-medium">{selectedCategoryId}</span></div>)}
        {/* Kategori Özellikleri */}
        {selectedCategoryId && !selectedCategoryLeaf && (
          <div className="mb-4 p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            Seçilen kategori leaf değil. Lütfen bir alt kırılım seçin ya da <b>Otomatik leaf bul</b> deyin.
          </div>
        )}
        {attrs.length > 0 && selectedCategoryLeaf && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Kategori Özellikleri</h3>
            <div className="space-y-3">
              {attrs.map((attr) => (
                <div key={attr.id} className="border rounded p-3">
                  <label className="block text-sm font-medium mb-2">
                    {attr.name}
                    {attr.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <select
                    value={attrMap[attr.id] || ''}
                    onChange={(e) => setAttrMap(prev => ({ ...prev, [attr.id]: Number(e.target.value) || null }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Seçiniz</option>
                    {attr.values?.map((val) => (
                      <option key={val.id} value={val.id}>
                        {val.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kaydet Butonu */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedCategoryId || !selectedCategoryLeaf || loading || attrLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
