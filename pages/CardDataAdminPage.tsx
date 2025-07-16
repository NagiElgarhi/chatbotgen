import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { getProducts, createProduct, deleteProduct } from '../services/databaseService';
import { SpinnerIcon, TrashIcon } from '../components/Icons';

const CardDataAdminPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch products.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const newProductData = {
            name: formData.get('productName') as string,
            product_url: formData.get('productUrl') as string,
            details: formData.get('productDetails') as string,
            company_name: formData.get('companyName') as string,
            company_url: formData.get('companyUrl') as string,
        };

        try {
            await createProduct(newProductData);
            e.currentTarget.reset(); // Clear form
            await fetchProducts(); // Refresh list
        } catch (err: any) {
            alert(`Error creating product: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
                await fetchProducts();
            } catch (err: any) {
                 alert(`Error deleting product: ${err.message}`);
            }
        }
    };

    return (
        <div className="bg-stone-100 min-h-screen p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold font-cinzel text-center mb-8">Manage Products</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Add Product Form */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-amber-800 mb-4">Add New Product Card</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="productName" className="block text-sm font-medium text-stone-700">Product Name</label>
                                <input type="text" name="productName" id="productName" required className="mt-1 block w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"/>
                            </div>
                             <div>
                                <label htmlFor="productUrl" className="block text-sm font-medium text-stone-700">Product URL</label>
                                <input type="url" name="productUrl" id="productUrl" required className="mt-1 block w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"/>
                            </div>
                            <div>
                                <label htmlFor="productDetails" className="block text-sm font-medium text-stone-700">Product Details</label>
                                <textarea name="productDetails" id="productDetails" rows={4} required className="mt-1 block w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"></textarea>
                            </div>
                             <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-stone-700">Company Name</label>
                                <input type="text" name="companyName" id="companyName" required className="mt-1 block w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"/>
                            </div>
                             <div>
                                <label htmlFor="companyUrl" className="block text-sm font-medium text-stone-700">Company URL</label>
                                <input type="url" name="companyUrl" id="companyUrl" required className="mt-1 block w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"/>
                            </div>
                            <div className="text-right">
                                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-lg font-bold rounded-full text-black bg-wavy-gold-button hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50">
                                    {isSubmitting ? <SpinnerIcon /> : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Product List */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                         <h2 className="text-2xl font-bold text-amber-800 mb-4">Existing Products</h2>
                         {isLoading && <div className="flex justify-center"><SpinnerIcon /></div>}
                         {error && <p className="text-red-500">{error}</p>}
                         {!isLoading && !error && (
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {products.length === 0 ? (
                                    <p className="text-stone-500">No products found.</p>
                                ) : (
                                    products.map(product => (
                                        <div key={product.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-md border border-stone-200">
                                            <div>
                                                <p className="font-bold text-stone-800">{product.name}</p>
                                                <p className="text-sm text-stone-600">{product.company_name}</p>
                                            </div>
                                            <button onClick={() => handleDelete(product.id)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardDataAdminPage;
