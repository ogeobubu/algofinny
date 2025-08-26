export declare function categorizeTransaction(description: string): string;
export declare function getCategoryColor(category: string): string;
export declare function getAvailableCategories(): string[];
export declare function suggestCategory(description: string, amount: number, type: 'credit' | 'debit'): string[];
