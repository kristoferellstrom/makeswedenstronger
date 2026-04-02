import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Brödsmulor" className="breadcrumbs">
      <ol className="breadcrumbsList">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="breadcrumbsItem">
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
            {index < items.length - 1 ? <span className="breadcrumbsSeparator">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
