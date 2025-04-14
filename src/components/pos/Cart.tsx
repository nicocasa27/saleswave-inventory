import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash, Plus, Minus, Receipt, CreditCard, Trash2, Check, ArrowRight, StoreIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCompleteSale: (paymentMethod: string, customerName: string, cashAmount?: number) => Promise<boolean>;
  stores: {id: string, nombre: string}[];
  selectedStore: string;
  onStoreChange: (storeId: string) => void;
}

export const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCompleteSale,
  stores,
  selectedStore,
  onStoreChange
}) => {
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [customerName, setCustomerName] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState<number | "">("");
  const [cardType, setCardType] = useState<string>("debito");
  const [cardBank, setCardBank] = useState<string>("otro");
  const [completingPayment, setCompletingPayment] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const { toast } = useToast();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxes = subtotal * 0.16; // IVA 16%
  const total = subtotal + taxes;
  const change = cashAmount !== "" && Number(cashAmount) > total ? Number(cashAmount) - total : 0;
  const currentDate = format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  const handleCompleteSale = async () => {
    if (items.length === 0) return;
    
    if (paymentMethod === "efectivo" && (cashAmount === "" || Number(cashAmount) < total)) {
      toast({
        title: "Monto insuficiente",
        description: "El monto en efectivo debe ser igual o mayor al total de la venta.",
      });
      return;
    }

    // Format payment method based on selection
    let fullPaymentMethod = paymentMethod;
    if (paymentMethod === "tarjeta") {
      fullPaymentMethod = `${paymentMethod} - ${cardType} - ${cardBank}`;
    }

    setCompletingPayment(true);
    
    const success = await onCompleteSale(fullPaymentMethod, customerName, 
                      paymentMethod === "efectivo" ? Number(cashAmount) : undefined);
    
    if (success) {
      setSaleCompleted(true);
      
      // Reset after showing success animation
      setTimeout(() => {
        setPaymentDialogOpen(false);
        setSaleCompleted(false);
        setCompletingPayment(false);
        setPaymentMethod("efectivo");
        setCashAmount("");
        setCustomerName("");
        setCardType("debito");
        setCardBank("otro");
      }, 2000);
    } else {
      setCompletingPayment(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="text-lg font-semibold">Carrito de Compra</CardTitle>
          
          <Select value={selectedStore} onValueChange={onStoreChange}>
            <SelectTrigger className="w-[180px]">
              <StoreIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Seleccionar Sucursal" />
            </SelectTrigger>
            <SelectContent>
              {stores
                .filter(store => !!store.id && store.id !== "")
                .map(store => (
                  <SelectItem key={store.id} value={store.id || "store-sin-id"}>
                    {store.nombre || "Sucursal sin nombre"}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{currentDate}</p>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-auto">
        {items.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
            <Receipt className="mb-3 h-10 w-10" />
            <p>El carrito está vacío</p>
            <p className="text-xs">Añada productos para iniciar una venta</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-medium">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none rounded-l-md"
                      onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none rounded-r-md"
                      onClick={() => onUpdateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col border-t pt-4">
        <div className="w-full space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA (16%)</span>
            <span>${taxes.toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={items.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Vaciar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Vaciar carrito?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente todos los
                  productos del carrito.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onClearCart}>Continuar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" disabled={items.length === 0 || !selectedStore}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar
              </Button>
            </DialogTrigger>
            <DialogContent>
              {saleCompleted ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-fade-in">
                  <div className="rounded-full bg-green-100 p-3">
                    <Check className="h-8 w-8 text-green-600" strokeWidth={3} />
                  </div>
                  <h2 className="text-xl font-bold text-center">¡Venta Completada!</h2>
                  <p className="text-center text-muted-foreground">
                    La venta ha sido procesada exitosamente.
                  </p>
                  <div className="mt-2 text-2xl font-bold">${total.toFixed(2)}</div>
                  
                  {paymentMethod === "efectivo" && (
                    <div className="w-full mt-2 p-3 bg-muted rounded-md">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span>Recibido:</span>
                        <span className="text-right">${Number(cashAmount).toFixed(2)}</span>
                        <span>Cambio:</span>
                        <span className="text-right font-medium">${change.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="animate-pulse mt-4">
                    <ArrowRight className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Completar venta</DialogTitle>
                    <DialogDescription>
                      Ingrese la información para finalizar la venta.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="customer" className="col-span-1 text-right text-sm">
                        Cliente
                      </label>
                      <Input
                        id="customer"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nombre del cliente (opcional)"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="paymentMethod" className="col-span-1 text-right text-sm">
                        Método de pago
                      </label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="col-span-3" id="paymentMethod">
                          <SelectValue placeholder="Seleccionar método de pago" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {paymentMethod === "efectivo" ? (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="cashAmount" className="col-span-1 text-right text-sm">
                          Monto recibido
                        </label>
                        <div className="col-span-3 flex flex-col space-y-1">
                          <Input
                            id="cashAmount"
                            type="number"
                            min={total}
                            step="0.01"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Ingrese el monto recibido"
                          />
                          {cashAmount !== "" && Number(cashAmount) >= total && (
                            <div className="text-sm flex justify-between px-1">
                              <span>Cambio:</span>
                              <span className="font-medium">${change.toFixed(2)}</span>
                            </div>
                          )}
                          {cashAmount !== "" && Number(cashAmount) < total && (
                            <p className="text-sm text-destructive">El monto es insuficiente</p>
                          )}
                        </div>
                      </div>
                    ) : paymentMethod === "tarjeta" && (
                      <>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="cardType" className="col-span-1 text-right text-sm">
                            Tipo de tarjeta
                          </label>
                          <Select value={cardType} onValueChange={setCardType}>
                            <SelectTrigger className="col-span-3" id="cardType">
                              <SelectValue placeholder="Seleccionar tipo de tarjeta" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="debito">Débito</SelectItem>
                              <SelectItem value="credito">Crédito</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="cardBank" className="col-span-1 text-right text-sm">
                            Banco
                          </label>
                          <Select value={cardBank} onValueChange={setCardBank}>
                            <SelectTrigger className="col-span-3" id="cardBank">
                              <SelectValue placeholder="Seleccionar banco" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bbva">BBVA</SelectItem>
                              <SelectItem value="santander">Santander</SelectItem>
                              <SelectItem value="banamex">Banamex</SelectItem>
                              <SelectItem value="amex">American Express</SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    <div className="mt-2 rounded-md bg-muted p-4">
                      <div className="text-sm">
                        <div className="flex justify-between py-1">
                          <span>Subtotal</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>IVA (16%)</span>
                          <span>${taxes.toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between py-1 font-medium">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button 
                      type="button" 
                      onClick={handleCompleteSale}
                      disabled={
                        completingPayment || 
                        (paymentMethod === "efectivo" && (cashAmount === "" || Number(cashAmount) < total))
                      }
                    >
                      {completingPayment ? 
                        <div className="flex items-center">
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                          Procesando...
                        </div> : 
                        "Completar venta"
                      }
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
};
