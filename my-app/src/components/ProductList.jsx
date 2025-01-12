import React from "react";

const ProductList = () => {
  const products = [
    { id: 1, name: "Produkt 1", price: "25,99$", image: "product1.jpg" },
    { id: 2, name: "Produkt 2", price: "25,99$", image: "product2.jpg" },
    // Weitere Produkte
  ];

  return (
    <div className="product-list">
      {products.map((product) => (
        <div key={product.id} className="product-card">
          <img src={`/assets/images/${product.image}`} alt={product.name} />
          <h3>{product.name}</h3>
          <p>{product.price}</p>
        </div>
      ))}
    </div>
  );
};

export default ProductList;

