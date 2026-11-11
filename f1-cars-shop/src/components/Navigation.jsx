import { Link } from "react-router-dom";

function Navigation() {
  return (
    <nav className="nav">
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/catalog">Cars</Link></li>
      </ul>
    </nav>
  );
}

export default Navigation;