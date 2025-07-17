
import React from 'react';
import { ProductCard } from '../components/ProductCard';
import { mockProductsData } from '../utils/mockData';


const ProductsPage: React.FC = () => {
    return (
        <div>
            <h1 className="text-5xl font-cinzel font-bold text-center mb-2 text-amber-900 text-shadow">Our Products</h1>
            <p className="text-center text-lg text-stone-600 mb-12">Explore our collection of fine products, forged in the crucible of artificial intelligence.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                {mockProductsData.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
        </div>
    );
};

export default ProductsPage;
