type JsonValue = Record<string, unknown> | Record<string, unknown>[];

export function JsonLd({ data }: { data: JsonValue }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      // JSON-LD is not user HTML; safe to stringify structured data we control.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
