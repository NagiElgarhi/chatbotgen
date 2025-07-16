
import { Product } from '../types';

const generateMockData = (count: number, namePrefix: string, detailsPrefix: string): Product[] => {
    const data: Product[] = [];
    for (let i = 1; i <= count; i++) {
        data.push({
            id: i,
            name: `${namePrefix} #${i}`,
            product_url: '#',
            details: `This is a detailed description for ${detailsPrefix} number ${i}. It showcases the unique features and craftsmanship involved in its creation. Built with dedication and precision.`,
            company_name: 'The Forge of AI',
            company_url: '#',
            created_at: new Date().toISOString(),
        });
    }
    return data;
};

export const mockProductsData: Product[] = generateMockData(60, 'Forged Product', 'product');
export const mockCreationsData: Product[] = generateMockData(60, 'Noble Creation', 'creation');
