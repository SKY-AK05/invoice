export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L15.5 2z" />
    <polyline points="15 2 15 8 21 8" />
    <path d="M10 12h4" />
    <path d="M10 16h4" />
    <path d="m8 12 1.5 1.5L8 15" />
    <path d="m8 16 1.5 1.5L8 19" />
  </svg>
);
