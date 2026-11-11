import React from "react";
import { useParams, Link } from "react-router-dom";
import products from "../data/products";
import PrimaryButton from "../components/PrimaryButton";

function ItemPage() {
  const { id } = useParams(); 
  const car = products.find((item) => item.id === parseInt(id));

  if (!car) {
    return <div className="container"><h2>Car not found!</h2></div>;
  }

  return (
    <div className="item-page-container">
      <div className="item-content">
        <img src={car.image} alt={car.name} className="item-image" />
        <div className="item-details">
          <h1>{car.name}</h1>
          <p className="engine-tag">Engine: {car.engine}</p>
          <p className="description">{car.description}</p>
          <p className="full-text">
            This is a high-performance racing machine designed for the 2024 Formula 1 season. 
            Every detail is optimized for maximum aerodynamic efficiency.
          </p>
          <Link to="/catalog">
            <PrimaryButton text="Back to Catalog" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ItemPage;