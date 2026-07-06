export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Frame Africa</span>
      <h1 className="text-4xl font-black tracking-tight text-text">
        NEWS. <span className="text-primary">VIEWS.</span> AFRICA.
      </h1>
      <p className="max-w-md font-body text-muted">
        The platform is scaffolded. Editorial, reader, and admin experiences land in the next
        milestones.
      </p>
    </div>
  );
}
