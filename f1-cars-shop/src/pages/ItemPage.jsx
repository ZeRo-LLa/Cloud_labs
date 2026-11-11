import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductById } from "../api/api";
import Loader from "../components/Loader";
import PrimaryButton from "../components/PrimaryButton";

import { useDispatch } from "react-redux";
import { addToCart } from "../store/cartSlice";

function ItemPage() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchCar = async () => {
      setLoading(true);
      try {
        const data = await getProductById(id);
        setCar(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id]);

  const handleAddToCart = () => {
    if (car) {
      dispatch(addToCart(car));
      alert(`${car.name} added to cart! 🏎️💨`);
    }
  };

  if (loading) return <Loader />;
  if (!car) return <h2>Car not found!</h2>;

  return (
    <div className="item-page-container">
      <img src={car.image} alt={car.name} style={{ width: "100%", maxWidth: "600px" }} />
      <h1>{car.name}</h1>
      <p><strong>Engine:</strong> {car.engine}</p>
      <p>{car.description}</p>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <Link to="/catalog">
          <PrimaryButton text="Back to Catalog" />
        </Link>
        
        <button 
          onClick={handleAddToCart}
          style={{
            backgroundColor: "#E10600",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ItemPage;