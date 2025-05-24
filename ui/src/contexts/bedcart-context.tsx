import { useLocalStorage } from '@uidotdev/usehooks';
import React, { Dispatch, SetStateAction, createContext, useContext } from 'react';
import toast from 'react-hot-toast';

type BedItem = {
  id: string;
  name: string;
  genome: string;
  tissue: string;
  cell_line: string;
  cell_type: string;
  description: string;
  assay: string;
};

type BedCart = Record<string, BedItem>;

type ProviderProps = {
  children: React.ReactNode;
};

const BedCartContext = createContext<{
  cart: BedCart;
  setCart: Dispatch<SetStateAction<BedCart>>;
  addBedToCart: (bed: BedItem) => void;
  removeBedFromCart: (bedId: string) => void;
  addMultipleBedsToCart: (beds: BedItem[]) => void;
  removeMultipleBedsFromCart: (bedIds: string[]) => void;
  // @ts-expect-error - its fine to start with undefined
}>(undefined);

export const BedCartProvider = ({ children }: ProviderProps) => {
  const [cart, setCart] = useLocalStorage<BedCart>('bed-cart', {});

  const addMultipleBedsToCart = (beds: BedItem[]) => {
    const alreadyInCart = beds.filter((bed) => cart[bed.id]);
    if (alreadyInCart.length > 0) {
      const bedIds = alreadyInCart.map(bed => bed.id);
      toast.error(`BED IDs ${bedIds.join(', ')} are already in the cart!`);
      return;
    }
    
    const newItems = beds.reduce((acc, bed) => {
      acc[bed.id] = bed;
      return acc;
    }, {} as BedCart);
    
    setCart({ ...cart, ...newItems });
  };

  const addBedToCart = (bed: BedItem) => {
    if (cart[bed.id]) {
      toast.error(`BED ID ${bed.id} is already in the cart!`);
      return;
    }
    setCart({ ...cart, [bed.id]: bed });
  };

  const removeMultipleBedsFromCart = (bedIds: string[]) => {
    const newCart = { ...cart };
    bedIds.forEach(id => {
      delete newCart[id];
    });
    setCart(newCart);
  };

  const removeBedFromCart = (bedId: string) => {
    if (bedId === 'all') {
      setCart({});
      return;
    }
    const newCart = { ...cart };
    delete newCart[bedId];
    setCart(newCart);
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
