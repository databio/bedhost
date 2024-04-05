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
  // @ts-expect-error - its fine to start with undefined
}>(undefined);

export const BedCartProvider = ({ children }: ProviderProps) => {
  const [cart, setCart] = useLocalStorage<string[]>('bed-cart', []);

  const addBedToCart = (bed: string) => {
    if (cart.includes(bed)) {
      toast.error(`BED ID ${bed} is already in the cart!`);
      return;
    }
    setCart([...cart, bed]);
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
        removeBedFromCart,
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
