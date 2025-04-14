import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { toast } from "sonner";

interface Product {
  id: string;
  nombre: string;
  precio_venta: number;
  stock_total?: number;
  almacen_id?: string;
}

interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export default function PointOfSale() {
  const { hasRole } = useAuth();
  const { stores, isLoading } = useCurrentStores();
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Actualizar tienda seleccionada cuando se carguen las tiendas
  useEffect(() => {
    if (!isLoading && stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, isLoading, selectedStore]);

  // Cargar productos cuando se seleccione una tienda
  useEffect(() => {
    if (!selectedStore) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Intentamos obtener productos con su stock en la tienda seleccionada
        const { data, error } = await supabase
          .from('productos')
          .select(`
            id,
            nombre,
            precio_venta
          `);

        if (error) throw error;

        // Convertir los datos al formato esperado por la interfaz
        const productsWithStock = data.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          precio_venta: p.precio_venta,
          stock_total: 10, // Valor por defecto para desarrollo
          almacen_id: selectedStore
        }));

        setProducts(productsWithStock);
      } catch (error: any) {
        console.error("Error al cargar productos:", error.message);
        toast.error("Error al cargar productos");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedStore]);

  // Funciones para manipular el carrito
  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      // Incrementar cantidad si ya existe
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      // Añadir nuevo producto al carrito
      setCart([
        ...cart,
        {
          id: product.id,
          nombre: product.nombre,
          precio: product.precio_venta,
          cantidad: 1,
        },
      ]);
    }
    toast.success(`${product.nombre} añadido`);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, cantidad: quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Para desarrollo/demo
  if (!hasRole("sales") && !hasRole("admin")) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Acceso Restringido</h1>
        <p className="text-muted-foreground">
          No tienes permisos para acceder al Punto de Venta
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="py-4 px-4 border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Punto de Venta</h1>
          <div className="w-[200px]">
            <Select
              value={selectedStore}
              onValueChange={setSelectedStore}
              disabled={isLoading || stores.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                {stores
                  .filter(store => !!store.id && store.id !== "") // Añadir filtro para evitar valores vacíos
                  .map((store) => (
                    <SelectItem key={store.id} value={store.id || "store-sin-id"}>
                      {store.nombre || "Sucursal sin nombre"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/3 p-4 overflow-auto">
          <div className="mb-4">
            <Button size="sm" variant="outline" disabled={loading}>
              {loading ? "Cargando..." : `${products.length} productos`}
            </Button>
          </div>
          <div className="h-full overflow-auto">
            {/* ProductGrid actualizado para usar la interfaz correcta */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div 
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className="cursor-pointer border rounded-md p-4 hover:bg-accent"
                >
                  <h3 className="font-medium">{product.nombre}</h3>
                  <p className="mt-1 text-lg">${product.precio_venta}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {product.stock_total || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-1/3 border-l">
          {/* Componente de carrito adaptado a la interfaz actual */}
          <div className="p-4 h-full flex flex-col">
            <h2 className="text-lg font-bold mb-4">Carrito</h2>
            <div className="flex-1 overflow-auto">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  Carrito vacío
                </p>
              ) : (
                <ul className="space-y-2">
                  {cart.map((item) => (
                    <li key={item.id} className="border-b pb-2">
                      <div className="flex justify-between">
                        <span>{item.nombre}</span>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.cantidad - 1))}
                            className="px-2 border rounded"
                          >
                            -
                          </button>
                          <span className="px-2">{item.cantidad}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                            className="px-2 border rounded"
                          >
                            +
                          </button>
                        </div>
                        <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>
                  $
                  {cart
                    .reduce((sum, item) => sum + item.precio * item.cantidad, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleClearCart} 
                  disabled={cart.length === 0}
                >
                  Limpiar
                </Button>
                <Button disabled={cart.length === 0}>Pagar</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
