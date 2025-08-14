import React, { useEffect, useState } from 'react';
import api from '../services/api';

type Cat = { 
  id: number; 
  name: string; 
  parentId: number; 
  leaf: boolean; 
};

type Node = Cat & { 
  expanded?: boolean; 
  loading?: boolean; 
  children?: Node[] 
};

interface CategoryTreeProps {
  onSelect?: (c: Cat) => void;
  className?: string;
}

export default function CategoryTree({ onSelect, className = '' }: CategoryTreeProps) {
  const [roots, setRoots] = useState<Node[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kök kategoriler: parentId=0
    loadRootCategories();
  }, []);

  const loadRootCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await api.get('/trendyol/categories/children', { 
        params: { parentId: 0 } 
      });
      
      if (res.data.success) {
        const items: Cat[] = res.data.data || [];
        setRoots(items.map(i => ({ 
          ...i, 
          expanded: false, 
          loading: false, 
          children: [] 
        })));
      } else {
        throw new Error(res.data.error || 'Kök kategoriler alınamadı');
      }
    } catch (e: any) {
      setError(e?.message || 'Kök kategoriler alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (node: Node, levelRoots: Node[], setLevel: (v: Node[]) => void) => {
    if (node.loading) return;
    
    if (node.expanded) {
      // Sadece kapat
      setLevel(levelRoots.map(n => (n.id === node.id ? { ...n, expanded: false } : n)));
      return;
    }
    
    // Açarken altları getir
    try {
      setLevel(levelRoots.map(n => (n.id === node.id ? { ...n, loading: true } : n)));
      
      const res = await api.get('/trendyol/categories/children', { 
        params: { parentId: node.id } 
      });
      
      if (res.data.success) {
        const kids: Cat[] = res.data.data || [];
        setLevel(levelRoots.map(n => (n.id === node.id ? {
          ...n,
          expanded: true,
          loading: false,
          children: kids.map(k => ({ 
            ...k, 
            expanded: false, 
            loading: false, 
            children: [] 
          }))
        } : n)));
      } else {
        throw new Error(res.data.error || 'Alt kategoriler alınamadı');
      }
    } catch (e: any) {
      setLevel(levelRoots.map(n => (n.id === node.id ? { ...n, loading: false } : n)));
      setError(e?.message || 'Alt kategoriler alınamadı');
    }
  };

  const renderLevel = (nodes: Node[], setLevel: (v: Node[]) => void, depth = 0) => {
    return (
      <ul className="pl-2">
        {nodes.map(n => (
          <li key={n.id} className="my-1">
            <div className="flex items-center gap-2">
              {!n.leaf ? (
                <button
                  className="border rounded px-2 py-0.5 text-xs hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => toggle(n, nodes, setLevel)}
                  disabled={n.loading}
                >
                  {n.loading ? '...' : n.expanded ? '−' : '+'}
                </button>
              ) : (
                <span className="w-6 inline-block" />
              )}
              
              <span
                className={`cursor-pointer hover:text-blue-600 transition-colors ${
                  n.leaf ? 'font-normal' : 'font-medium'
                }`}
                onClick={() => onSelect?.(n)}
                title={`#${n.id}`}
              >
                {n.name}
              </span>
            </div>
            
            {n.expanded && n.children && n.children.length > 0 && (
              <div className="pl-4">
                {renderLevel(n.children, (v) => {
                  // Çocuk dizisini doğrudan güncelle
                  setLevel(nodes.map(x => (x.id === n.id ? { 
                    ...n, 
                    children: v, 
                    expanded: true 
                  } : x)));
                }, depth + 1)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className={`border rounded p-3 ${className}`}>
        <div className="font-semibold mb-2">Trendyol Kategori Ağacı</div>
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className={`border rounded p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Trendyol Kategori Ağacı</div>
        <button
          onClick={loadRootCategories}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Yenile
        </button>
      </div>
      
      {error && (
        <div className="text-red-600 text-sm mb-2 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
      
      {roots.length === 0 && !error ? (
        <div className="text-gray-500 text-sm">Kategori bulunamadı</div>
      ) : (
        renderLevel(roots, setRoots)
      )}
    </div>
  );
}
