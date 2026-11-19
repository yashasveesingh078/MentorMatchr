// Title + short description at the top of every page.
// "children" = optional buttons shown on the right.
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}