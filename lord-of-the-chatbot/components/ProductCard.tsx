import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <div 
            className="w-[300px] h-[400px] bg-white rounded-xl shadow-lg overflow-hidden flex flex-col ring-1 ring-amber-200/50 transition-all transform hover:-translate-y-2 hover:shadow-2xl"
        >
            <div className="p-5 bg-simple-gold-gradient">
                <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="text-2xl font-bold text-stone-800 text-shadow hover:underline">
                    {product.name}
                </a>
            </div>
            <div className="p-5 flex-grow overflow-y-auto text-stone-800">
                <p className="text-base leading-relaxed">
                    {product.details}
                </p>
            </div>
            <div className="p-4 bg-stone-50 border-t border-stone-200 text-right">
                <a href={product.company_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-amber-800 hover:text-amber-600 transition-colors">
                    By {product.company_name}
                </a>
            </div>
        </div>
    );
};