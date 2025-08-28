import { Link } from "react-router";

export default function FooterSection() {
  return (
    <footer className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <Link to="/" aria-label="go home" className="mx-auto block size-fit">
          <img src="/rsk.png" alt="RSK Logo" className="h-12 w-12" />
        </Link>
        <span className="text-muted-foreground block text-center text-sm">
          {" "}
          © {new Date().getFullYear()} RSK, All rights reserved
        </span>
      </div>
    </footer>
  );
}
