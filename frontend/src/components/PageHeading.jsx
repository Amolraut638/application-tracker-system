/**
 * PageHeading — standardised top-of-page title + description + optional right slot.
 *
 * Props:
 *   title        string
 *   description  string   (optional)
 *   children     ReactNode — rendered in the right side (e.g., an Add button)
 */
export default function PageHeading({ title, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="page-title">{title}</h2>
        {description && (
          <p className="page-description">{description}</p>
        )}
      </div>
      {children && (
        <div className="shrink-0 flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
