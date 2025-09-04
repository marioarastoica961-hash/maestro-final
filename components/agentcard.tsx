'use client';

import Link from "next/link";

type Agent = {
  slug: string;
  name: string;
  category?: string;
  price: number;
  shortDescription?: string;
  longDescription?: string;
  features?: string[];
  tags?: string[];
  image?: string;
  rating?: number;
  reviews?: number;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold tracking-wide uppercase bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md">
      {children}
    </span>
  );
}

export default function AgentCard({ agent }: { agent: Agent }) {
  const {
    slug,
    name,
    category = "general",
    price,
    shortDescription,
    longDescription,
    features = [],
    tags = [],
    image = "/assets/img/placeholder.svg",
    rating = 4.7,
    reviews = 120,
  } = agent;

  const chips = tags.length ? tags.slice(0, 2) : [category];

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/assets/img/placeholder.svg";
  };

  return (
    <div className="rounded-2xl bg-white shadow-[0_6px_30px_-12px_rgba(16,185,129,0.25)] border border-emerald-100 overflow-hidden flex flex-col">
      {/* Header con imagen/fondo */}
      <div className="relative bg-gradient-to-br from-emerald-50 to-white">
        <img
          src={image}
          alt={name}
          onError={onImgError}
          className="w-full h-40 object-cover mix-blend-multiply"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge>{category}</Badge>
          {chips[0] && <Badge>{chips[0]}</Badge>}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        <h3 className="text-xl font-semibold text-zinc-900">{name}</h3>

        <p className="text-sm text-zinc-600">
          {shortDescription || longDescription || "Agente listo para producción."}
        </p>

        {/* Lista de features */}
        {features.length > 0 && (
          <ul className="mt-1 space-y-1.5 text-sm">
            {features.slice(0, 4).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-zinc-700">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 text-xs text-zinc-500">
          ⭐ {rating.toFixed(1)} · {reviews} reviews
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="text-lg font-semibold text-zinc-900">
            {money.format(price)} <span className="text-zinc-500 text-sm">USD</span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/agentes/${encodeURIComponent(slug)}`}
              className="px-3 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-sm"
            >
              Learn more
            </Link>
            <Link
              href={`/checkout/?slug=${encodeURIComponent(slug)}`}
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
            >
              Comprar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
