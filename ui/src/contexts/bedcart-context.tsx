import { useLocalStorage } from '@uidotdev/usehooks';
import React, { Dispatch, SetStateAction, createContext, useContext } from 'react';
import toast from 'react-hot-toast';

type ProviderProps = {
  children: React.ReactNode;
};

const BedCartContext = createContext<{
  cart: string[];
  setCart: Dispatch<SetStateAction<string[]>>;
  addBedToCart: (bed: string) => void;
  removeBedFromCart: (bed: string) => void;
  addMultipleBedsToCart: (beds: string[]) => void;
  removeMultipleBedsFromCart: (beds: string[]) => void;
  // @ts-expect-error - its fine to start with undefined
}>(undefined);

export const BedCartProvider = ({ children }: ProviderProps) => {
  const [cart, setCart] = useLocalStorage<string[]>('bed-cart', []);

  const addMultipleBedsToCart = (beds: string[]) => {
    const alreadyInCart = beds.filter((bed) => cart.includes(bed));
    if (alreadyInCart.length > 0) {
      toast.error(`BED IDs ${alreadyInCart.join(', ')} are already in the cart!`);
      return;
    }
    setCart([...cart, ...beds]);
  };

  const addBedToCart = (bed: string) => {
    if (cart.includes(bed)) {
      toast.error(`BED ID ${bed} is already in the cart!`);
      return;
    }
    setCart([...cart, bed]);
  };

  const removeMultipleBedsFromCart = (beds: string[]) => {
    setCart(cart.filter((item) => !beds.includes(item)));
  };

  const removeBedFromCart = (bed: string) => {
    if (bed === 'all') {
      setCart([]);
      return;
    }
    setCart(cart.filter((item) => item !== bed));
  };

  return (
    <BedCartContext.Provider
      value={{
        cart,
        setCart,
        addBedToCart,
        addMultipleBedsToCart,
        removeBedFromCart,
        removeMultipleBedsFromCart,
      }}
    >
      {children}
    </BedCartContext.Provider>
  );
};

export const useBedCart = () => {
  const context = useContext(BedCartContext);
  if (context === undefined) {
    throw new Error('useBedCart must be used within a BedCartProvider');
  }
  return context;
};
