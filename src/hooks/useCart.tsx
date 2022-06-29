import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const index = cart.findIndex((p) => p.id === productId);
      if (index >= 0) {
        updateProductAmount({ productId, amount: cart[index].amount + 1 });
        return;
      }
      const { data: product } = await api.get<Product>(
        `/products/${productId}`
      );

      setCart((oldState) => {
        const newState = [...oldState, { ...product, amount: 1 }];
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newState));
        return newState;
      });
    } catch (error: any) {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const index = cart.findIndex((p) => p.id === productId);
      if (index === -1) throw new Error();
      setCart((oldState) => {
        const newState = [
          ...oldState.filter((product) => product.id !== productId),
        ];
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newState));
        return newState;
      });
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const index = cart.findIndex((p) => p.id === productId);
      const { data: stock } = await api.get<UpdateProductAmount>(
        `/stock/${productId}`
      );
      if (amount <= 0) {
        return;
      }
      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      setCart((oldState) => {
        const newCart: Product[] = [...oldState];
        const newAmount: number = amount;
        newCart[index].amount = newAmount > 0 ? newAmount : 0;
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        return newCart;
      });
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
