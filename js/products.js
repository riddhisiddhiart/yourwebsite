/**
 * Product Data for Riddhi Siddhi Art
 * Only products with actual images are listed
 */

(function() {
    'use strict';

    // Product Data - Only items with actual photos
    const products = [
        {
            id: 1,
            name: "Radha Krishna Marble Murti - Azure",
            nameHindi: "राधा कृष्ण संगमरमर मूर्ति",
            category: "radha-krishna",
            image: "images/products/radha-krishna-in-azure.jpeg",
            description: "Beautiful handcrafted Radha Krishna marble murti with vibrant colors and gold leaf detailing. Traditional Jaipur craftsmanship. Perfect for home temples and mandirs.",
            descriptionHindi: "सुंदर हस्तनिर्मित राधा कृष्ण संगमरमर मूर्ति",
            price: "Contact for Price",
            alt: "Radha Krishna marble murti with azure background"
        },
        {
            id: 2,
            name: "Radha Krishna Marble Murti - Red",
            nameHindi: "राधा कृष्ण संगमरमर मूर्ति",
            category: "radha-krishna",
            image: "images/products/radha-krishna-in-red.jpeg",
            description: "Standing Radha Krishna pair with beautiful attire. Hand painted with gold accents. Traditional Jaipur craftsmanship.",
            descriptionHindi: "खड़े राधा कृष्ण युगल की सुंदर मूर्ति",
            price: "Contact for Price",
            alt: "Radha Krishna marble murti with red background"
        },
        {
            id: 3,
            name: "Ganesh Ji Marble Murti - Green",
            nameHindi: "गणेश जी संगमरमर मूर्ति",
            category: "ganesh",
            image: "images/products/ganeshji-in-green.jpeg",
            description: "Elegant Lord Ganesh marble statue seated on lotus with intricate gold work. Premium Makrana marble with traditional hand painting.",
            descriptionHindi: "कमल पर विराजमान गणेश जी की सुंदर मूर्ति",
            price: "Contact for Price",
            alt: "Ganesh Ji marble statue with green background"
        },
        {
            id: 4,
            name: "Ganesh Ji Marble Murti - Violet",
            nameHindi: "गणेश जी गुलाबी कमल मूर्ति",
            category: "ganesh",
            image: "images/products/ganesh-ji-inviloet-purple.jpeg",
            description: "Beautiful Ganesh Ji murti on pink lotus base with delicate features and premium marble finish. Ideal for Ganesh Chaturthi and home temples.",
            descriptionHindi: "गुलाबी कमल पर गणेश जी की दिव्य मूर्ति",
            price: "Contact for Price",
            alt: "Ganesh Ji marble murti with violet background"
        },
        {
            id: 5,
            name: "Ganesh Ji Marble Murti - Red",
            nameHindi: "रंगीन गणेश जी मूर्ति",
            category: "ganesh",
            image: "images/products/ganeshji-in-red.jpeg",
            description: "Traditional style Ganesh Ji with vibrant orange and gold colors. Hand painted with pure colors. Perfect for Ganesh Chaturthi celebrations.",
            descriptionHindi: "जीवंत रंगों में गणेश जी की पारंपरिक मूर्ति",
            price: "Contact for Price",
            alt: "Ganesh Ji marble statue with red background"
        }
    ];

    // Validate product data
    function validateProduct(product) {
        const requiredFields = ['id', 'name', 'category', 'image', 'description', 'price'];
        const validCategories = ['ganesh', 'radha-krishna', 'temple', 'jain'];
        
        for (const field of requiredFields) {
            if (!product.hasOwnProperty(field)) {
                console.warn(`Product missing field: ${field}`, product);
                return false;
            }
        }
        
        if (!validCategories.includes(product.category)) {
            console.warn(`Invalid category: ${product.category}`);
            return false;
        }
        
        return true;
    }

    const validatedProducts = products.filter(validateProduct);
    Object.freeze(validatedProducts);

    // Fallback placeholder images (only used if local image fails)
    const placeholderImages = Object.freeze({
        "radha-krishna": "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?w=600&h=600&fit=crop&q=80",
        "ganesh": "https://images.unsplash.com/photo-1567591370504-80c5c6a77d95?w=600&h=600&fit=crop&q=80",
        "temple": "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=600&fit=crop&q=80",
        "jain": "https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?w=600&h=600&fit=crop&q=80",
        "default": "https://images.unsplash.com/photo-1567591370504-80c5c6a77d95?w=600&h=600&fit=crop&q=80"
    });

    // Get product image - uses local image path
    function getProductImage(product) {
        if (!product) {
            return placeholderImages.default;
        }
        return product.image || placeholderImages[product.category] || placeholderImages.default;
    }
    
    // Export placeholder for fallback use
    window.placeholderImages = placeholderImages;

    // Export
    Object.defineProperty(window, 'productsData', {
        value: validatedProducts,
        writable: false,
        configurable: false
    });

    Object.defineProperty(window, 'getProductImage', {
        value: getProductImage,
        writable: false,
        configurable: false
    });

})();
