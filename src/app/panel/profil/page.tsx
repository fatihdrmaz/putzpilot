"use client";

// Profil + belge yükleme (mockup adım 2-3). Belgeler private 'documents'
// bucket'ına documents/{userId}/... yoluyla gider; sadece sahibi ve admin okur.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "../lang-context";
import { Banner } from "@/components/ui";
import { IconCheckCircle, IconLogout, IconUser } from "@/components/icons";

type DocKind = "id" | "residence";

export default function ProfilePage() {
  const { dict, lang } = useLang();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string>("pending");
  const [docs, setDocs] = useState<{ id: boolean; residence: boolean }>({ id: false, residence: false });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<DocKind | null>(null);
  const idInput = useRef<HTMLInputElement>(null);
  const resInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login?next=/panel/profil");
        return;
      }
      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", data.user.id)
        .single();
      setName([profile?.first_name, profile?.last_name].filter(Boolean).join(" "));
      const { data: cp } = await supabase
        .from("cleaner_profiles")
        .select("verification_status, id_document_path, residence_document_path")
        .eq("user_id", data.user.id)
        .single();
      if (cp) {
        setStatus(cp.verification_status);
        setDocs({ id: Boolean(cp.id_document_path), residence: Boolean(cp.residence_document_path) });
      }
    });
  }, [router]);

  async function upload(kind: DocKind, file: File) {
    if (!userId) return;
    setUploading(kind);
    setError(null);
    const supabase = createClient();
    const path = `${userId}/${kind}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) {
      setError(upErr.message);
      setUploading(null);
      return;
    }
    const col = kind === "id" ? "id_document_path" : "residence_document_path";
    const { error: dbErr } = await supabase
      .from("cleaner_profiles")
      .update({ [col]: path })
      .eq("user_id", userId);
    if (dbErr) setError(dbErr.message);
    else setDocs((d) => ({ ...d, [kind]: true }));
    setUploading(null);
  }

  async function logout() {
    await createClient().auth.signOut();
    router.push("/");
  }

  const statusLabel =
    lang === "tr"
      ? { pending: "Onay bekliyor", approved: "Onaylandı", rejected: "Reddedildi / askıda" }[status]
      : { pending: "Prüfung ausstehend", approved: "Verifiziert", rejected: "Abgelehnt / gesperrt" }[status];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold">{dict.dashboard.profile}</h1>
      {error && <Banner tone="error">{error}</Banner>}

      <section className="flex items-center gap-4 rounded-2xl bg-white/5 p-5">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand/20">
          <IconUser size={26} className="text-brand" />
        </span>
        <div>
          <p className="font-bold">{name || "…"}</p>
          <p
            className={`text-xs font-semibold ${
              status === "approved" ? "text-success" : status === "rejected" ? "text-danger" : "text-brand"
            }`}
          >
            {statusLabel}
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-5">
        <h2 className="text-sm font-bold">{dict.documents.title}</h2>
        <p className="mt-1 text-xs text-white/50">{dict.documents.pendingInfo}</p>

        <div className="mt-4 flex flex-col gap-3">
          {(
            [
              ["id", dict.documents.idPassport, idInput],
              ["residence", dict.documents.residence, resInput],
            ] as [DocKind, string, React.RefObject<HTMLInputElement | null>][]
          ).map(([kind, label, ref]) => (
            <div key={kind} className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{label}</span>
              {docs[kind] ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-success">
                  <IconCheckCircle size={16} /> {dict.documents.uploaded}
                </span>
              ) : (
                <>
                  <input
                    ref={ref}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(kind, f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => ref.current?.click()}
                    disabled={uploading !== null}
                    className="min-h-10 cursor-pointer rounded-xl bg-brand px-4 text-xs font-extrabold text-ink hover:bg-brand-dark disabled:opacity-40"
                  >
                    {uploading === kind ? "…" : lang === "tr" ? "Yükle" : "Hochladen"}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={logout}
        className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-danger/40 text-sm font-bold text-danger transition-colors hover:bg-danger/10"
      >
        <IconLogout size={18} />
        {lang === "tr" ? "Çıkış Yap" : "Abmelden"}
      </button>
    </div>
  );
}
