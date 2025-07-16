import React from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

// Create a static placeholder product to use for the grid.
const placeholderProduct: Product = {
    id: 1,
    name: "Forged Creation",
    product_url: "#",
    details: "A masterwork of digital craftsmanship, forged in the heart of our AI engine. This entity is tailored for a unique purpose, awaiting its quest.",
    company_name: "The Council",
    company_url: "#",
    created_at: new Date().toISOString(),
};

// Generate an array of 60 placeholder products for the static gallery.
const staticProducts = Array.from({ length: 60 }, (_, i) => ({
    ...placeholderProduct,
    id: i + 1,
    name: `Forged Creation #${i + 1}`
}));


const ProductsPage: React.FC = () => {
    return (
        <div>
            <h1 className="text-5xl font-cinzel font-bold text-center mb-2 text-amber-900 text-shadow">The Creations Gallery</h1>
            <p className="text-center text-lg text-stone-600 mb-12">Behold the creations forged in the crucible of artificial intelligence.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                {staticProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
        </div>
    );
};

export default ProductsPage;
