function Products() {
  return (
    <section className="products">
      <h3>Popular F1 Cars</h3>

      <div className="product-list">
        <div className="product-card">
          <img src={"../assets/ferrari.jpg"} alt="Ferrari SF-24" />
          <h4>Ferrari SF-24</h4>
          <p>Top speed: 350 km/h</p>
        </div>

        <div className="product-card">
          <img src={"../assets/redbull.jpg"} alt="Red Bull RB19" />
          <h4>Red Bull RB19</h4>
          <p>World Champion Car</p>
        </div>

        <div className="product-card">
          <img src={"/assets/mercedes.jpg"} alt="Mercedes W14" />
          <h4>Mercedes W14</h4>
          <p>Hybrid Power Unit</p>
        </div>
      </div>
    </section>
  );
}

export default Products;