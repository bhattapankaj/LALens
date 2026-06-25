import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

function HomeFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div className="home-footer-brand">
          <BrandLogo variant="footer" />
          <p className="home-footer-tagline">
            LALens uses <strong>live public Census data</strong> and prototype Opportunity Scores for{" "}
            <strong>all 64 Louisiana parishes</strong>.
          </p>
        </div>
        <div className="home-footer-links">
          <Link to="/methodology">Methodology</Link>
          <Link to="/data-sources">Data Sources</Link>
          <Link to="/platform">Platform</Link>
        </div>
      </div>
    </footer>
  );
}

export default HomeFooter;
