import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products on mount and re-run if auth state changes
  useEffect(() => {
    fetchProducts();

    // Listen to login/logout state updates automatically
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchProducts();
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Check if current user is logged in (Admin)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const isAdmin = !!session;

      let query = supabase.from("sarees");

      if (isAdmin) {
        // Admin gets all columns and all items (active & inactive)
        query = query.select("*");
      } else {
        // Guests/Customers only get public columns and active items
        query = query
          .select("id, name, price, stock, category, image, tag, is_active")
          .eq("is_active", true);
      }

      const { data, error } = await query.order("id", { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (newProduct) => {
    try {
      const { data, error } = await supabase
        .from("sarees")
        .insert([newProduct])
        .select();

      if (error) throw error;
      if (data) {
        setProducts((prev) => [data[0], ...prev]);
      }
    } catch (error) {
      console.error("Error adding product:", error.message);
      alert("Failed to save saree to database.");
    }
  };

  const updateProduct = async (id, updatedFields) => {
    try {
      const { data, error } = await supabase
        .from("sarees")
        .update(updatedFields)
        .eq("id", id)
        .select();

      if (error) throw error;
      if (data) {
        setProducts((prev) =>
          prev.map((product) => (product.id === id ? data[0] : product)),
        );
      }
    } catch (error) {
      console.error("Error updating product:", error.message);
      alert("Failed to update saree in database.");
    }
  };

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase.from("sarees").delete().eq("id", id);

      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting product:", error.message);
      alert("Failed to delete saree from database.");
    }
  };

  const checkStockAvailability = async (cartItems) => {
    try {
      for (const item of cartItems) {
        const { data, error } = await supabase
          .from("sarees")
          .select("stock, name")
          .eq("id", item.id)
          .single();

        if (error) throw error;

        const availableStock = data?.stock ?? 0;
        if (availableStock < item.quantity) {
          throw new Error(
            `Sorry, "${data.name}" only has ${availableStock} left in stock.`,
          );
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const decreaseStock = async (cartItems) => {
    try {
      for (const item of cartItems) {
        const { data, error: fetchError } = await supabase
          .from("sarees")
          .select("stock")
          .eq("id", item.id)
          .single();

        if (fetchError) throw fetchError;

        const currentStock = data?.stock ?? 0;
        const newStock = Math.max(0, currentStock - item.quantity);

        const { error } = await supabase
          .from("sarees")
          .update({ stock: newStock })
          .eq("id", item.id);

        if (error) throw error;
      }
      await fetchProducts();
    } catch (error) {
      console.error("Error updating stock quantities:", error.message);
    }
  };

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    checkStockAvailability,
    decreaseStock,
    loading,
    refetchProducts: fetchProducts,
  };
}
