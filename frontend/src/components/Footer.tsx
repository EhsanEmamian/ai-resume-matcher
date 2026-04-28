export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#07111f] text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
            AI Resume Matcher
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">
            Full-stack portfolio product
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
            Resume parsing, live job discovery, imported job workflows, and
            explainable matching in one production-style application.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
            Contact
          </p>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            <p>
              Email:{" "}
              <a
                href="mailto:emamianehsan@yahoo.com"
                className="underline decoration-white/30 underline-offset-4 hover:text-white"
              >
                emamianehsan@yahoo.com
              </a>
            </p>
            <p>
              LinkedIn:{" "}
              <a
                href="https://www.linkedin.com/in/ehsan-emamian/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/30 underline-offset-4 hover:text-white"
              >
                ehsan-emamian
              </a>
            </p>
            <p>
              API Docs:{" "}
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/30 underline-offset-4 hover:text-white"
              >
                Swagger UI
              </a>
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
            Builder
          </p>
          <p className="mt-3 text-lg font-semibold">Ehsan Emamian</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Junior backend developer focused on AI integration, product-minded
            engineering, and practical full-stack systems.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>Built by Ehsan Emamian</p>
          <p>FastAPI · PostgreSQL · Next.js · Claude AI · Adzuna</p>
        </div>
      </div>
    </footer>
  );
}