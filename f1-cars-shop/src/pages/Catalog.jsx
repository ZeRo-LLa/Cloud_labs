import React, { useState, useEffect } from "react";
import { getProducts } from "../api/api";
import SearchInput from "../components/SearchInput";
import Select from "../components/Select";
import PrimaryButton from "../components/PrimaryButton";
import Loader from "../components/Loader";
import { Link } from "react-router-dom";

function Catalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [engineType, setEngineType] = useState("");
  const [sortOrder, setSortOrder] = useState(""); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getProducts(engineType);
        setItems(data);
      } catch (error) {
        console.error("Помилка:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [engineType]); 

  const processedItems = [...items]
    .filter((item) => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "asc") return a.price - b.price;
      if (sortOrder === "desc") return b.price - a.price;
      return 0;
    });

  return (
    <div className="catalog-container" style={{ padding: '20px' }}>
      <h1>F1 2024/25 Catalog</h1>
      
      <div className="filters-bar" style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        
        <Select 
          label="Engine:" 
          options={["Ferrari", "Honda RBPT", "Mercedes", "Renault", "Audi", "Cadillac"]} 
          onChange={setEngineType} 
          defaultText="All Engines"
        />

        <Select 
          label="Sort by Price:" 
          options={["asc", "desc"]} 
          onChange={setSortOrder} 
          defaultText="Default Sorting"
        />
      </div>

      {loading ? <Loader /> : (
        <div className="product-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '25px' 
        }}>
          {processedItems.length > 0 ? (
            processedItems.map((car) => (
              <div key={car.id} className="product-card" style={{
                border: '1px solid #ddd',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center',
                backgroundColor: '#fff'
              }}>
                <img src={car.image} alt={car.name} style={{ width: '100%', borderRadius: '8px' }} />
                <h3>{car.name}</h3>
                <p style={{ color: '#666' }}>Engine: {car.engine}</p>
                
                <p style={{ fontWeight: 'bold', color: '#E10600', fontSize: '1.2rem' }}>
                  ${car.price ? car.price.toLocaleString() : "N/A"}
                </p>

                <Link to={`/catalog/${car.id}`}>
                  <PrimaryButton text="View Details" />
                </Link>
              </div>
            ))
          ) : (
            <p style={{ gridColumn: '1/-1', textAlign: 'center' }}>No cars found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Catalog;