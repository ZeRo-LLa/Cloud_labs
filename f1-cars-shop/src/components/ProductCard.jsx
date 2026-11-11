import PrimaryButton from "./PrimaryButton";

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h4>{product.name}</h4>
      <p>{product.description}</p>
      <PrimaryButton text="View more" />
    </div>
  );
}

export default ProductCard;
